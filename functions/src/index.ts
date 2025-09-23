import * as functions from "firebase-functions";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";
import { getFirestore } from "firebase-admin/firestore";
import Mailjet from "node-mailjet";
import { googleSheetsService } from "./services/googleSheetsService";


initializeApp();

interface FirebaseError extends Error {
  code?: string;
  message: string;
}
interface EmailData {
  email: string;
  fullName: string;
  invitationToken: string;
}

// Handle deletion request updates
export const onDeletionRequestUpdated = functions.firestore
  .document("deletion_requests/{requestId}")
  .onUpdate(async (change) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();

    // Only proceed if status changed from 'pending' to 'completed'
    if (beforeData.status === "pending" && afterData.status === "completed") {
      try {
        // Get the member's auth UID
        const memberId = afterData.member_id;

        // Delete the user's auth account
        await getAuth().deleteUser(memberId);

        // Log the successful deletion
        functions.logger.info(`Successfully deleted auth user ${memberId}`);

        // Update the deletion request with auth deletion status
        await change.after.ref.update({
          auth_deleted: true,
          auth_deleted_at: new Date(),
        });
        cleanupDeletedUserData;
      } catch (error) {
        const firebaseError = error as FirebaseError;
        const errorMessage = firebaseError.message || "Unknown error occurred";
        functions.logger.error(`Error deleting auth user: ${errorMessage}`);

        // Update the request with the error
        await change.after.ref.update({
          auth_error: errorMessage,
          auth_deleted: false,
        });
      }
    }
  });

// Clean up user data after deletion
export const cleanupDeletedUserData = functions.auth
  .user()
  .onDelete(async (user: any) => {
    try {
      // Delete user's storage files
      const bucket = getStorage().bucket();
      await bucket.deleteFiles({
        prefix: `avatars/${user.uid}/`,
      });
      await bucket.deleteFiles({
        prefix: `dependants/${user.uid}/`,
      });

      await bucket.deleteFiles({
        prefix: `proof_of_payments/${user.uid}/`,
      });

      functions.logger.info(
        `Successfully cleaned up data for user ${user.uid}`
      );
    } catch (error) {
      const firebaseError = error as FirebaseError;
      const errorMessage = firebaseError.message || "Unknown error occurred";
      functions.logger.error(`Error cleaning up user data: ${errorMessage}`);
    }
  });

export const sendMemberInvitation = functions.https.onCall(
  async (
    data: EmailData,
    context
  ): Promise<{ success: boolean; message?: string }> => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Must be authenticated to send invitations"
      );
    }
    const { email, fullName, invitationToken } = data;

    // Validate input
    if (!email || !fullName || !invitationToken) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing email, name, or invitationToken"
      );
    }
    const mailjet = new Mailjet({
      apiKey: "1bbeb1984d50fff671202400e7d9e470",
      apiSecret: "dda067ed5adde03719bc5d95b9ffe5b4",
    });
    // const mailjet = Mailjet.apiConnect({
    //   apiKey: "1bbeb1984d50fff671202400e7d9e470", // Replace with your API key
    //   apiSecret: "dda067ed5adde03719bc5d95b9ffe5b4", // Replace with your Secret key
    // });

    const deploymentUrl = functions.config().app.url;
    const registrationUrl = `${deploymentUrl}/auth/register?token=${invitationToken}`;

    try {
      const request = mailjet.post("send", { version: "v3.1" }).request({
        Messages: [
          {
            From: {
              Email: "inkuthazoburialclub@gmail.com",
              Name: "Inkuthazo Web Portal",
            },
            To: [
              {
                Email: email,
                Name: fullName,
              },
            ],
            // TemplateID: YOUR_TEMPLATE_ID, // Replace with your Mailjet template ID
            // TemplateLanguage: true,
            Variables: {
              name: name,
              registrationLink: registrationUrl,
            },
          },
        ],
      });

      const response = await request;
      console.log("Email sent successfully:", response.body);

      return { success: true, message: "Email sent successfully" };
    } catch (error: any) {
      console.error("Error sending email:", error.message || error.response);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to send email",
        error.response?.data || error.message
      );
    }
  }
);

// Helper function to verify user authentication and get user details
async function verifyUserAuth(context: functions.https.CallableContext) {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Must be authenticated to access this endpoint"
    );
  }

  const db = getFirestore();
  const userDoc = await db.collection('members').doc(context.auth.uid).get();

  if (!userDoc.exists) {
    throw new functions.https.HttpsError(
      "not-found",
      "User profile not found"
    );
  }

  return {
    uid: context.auth.uid,
    userData: userDoc.data(),
    isAdmin: userDoc.data()?.role === 'admin'
  };
}

// Google Sheets API Endpoints for Attendance System

// Create sheet for meeting
export const createAttendanceSheet = functions.https.onCall(
  async (data: { meetingId: string }, context) => {
    try {
      const { isAdmin } = await verifyUserAuth(context);

      if (!isAdmin) {
        throw new functions.https.HttpsError(
          "permission-denied",
          "Only admins can create attendance sheets"
        );
      }

      const { meetingId } = data;
      if (!meetingId) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Meeting ID is required"
        );
      }

      // Get meeting data from Firestore
      const db = getFirestore();
      const meetingDoc = await db.collection('meetings').doc(meetingId).get();

      if (!meetingDoc.exists) {
        throw new functions.https.HttpsError(
          "not-found",
          "Meeting not found"
        );
      }

      const meeting = { id: meetingDoc.id, ...meetingDoc.data() } as any;
      const sheetName = await googleSheetsService.createSheetForMeeting(meeting as any);

      return {
        success: true,
        sheetName,
        message: "Attendance sheet created successfully"
      };
    } catch (error) {
      functions.logger.error("Error creating attendance sheet:", error);

      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      throw new functions.https.HttpsError(
        "internal",
        "Failed to create attendance sheet"
      );
    }
  }
);

// Record attendance in Google Sheets
export const recordAttendanceInSheets = functions.https.onCall(
  async (data: {
    meetingId: string;
    memberId: string;
    memberName: string;
    responses: Record<string, any>;
  }, context) => {
    try {
      const { uid } = await verifyUserAuth(context);

      const { meetingId, memberId, memberName, responses } = data;

      // Verify user can only submit attendance for themselves
      if (uid !== memberId) {
        throw new functions.https.HttpsError(
          "permission-denied",
          "Can only submit attendance for yourself"
        );
      }

      if (!meetingId || !memberId || !memberName || !responses) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Missing required fields"
        );
      }

      // Get meeting data
      const db = getFirestore();
      const meetingDoc = await db.collection('meetings').doc(meetingId).get();

      if (!meetingDoc.exists) {
        throw new functions.https.HttpsError(
          "not-found",
          "Meeting not found"
        );
      }

      const meeting = { id: meetingDoc.id, ...meetingDoc.data() } as any;

      // Check if user already attended
      const hasAttended = await googleSheetsService.hasUserAttended(
        meetingId,
        memberId,
        meeting as any
      );

      if (hasAttended) {
        throw new functions.https.HttpsError(
          "already-exists",
          "Attendance already recorded for this meeting"
        );
      }

      // Record attendance
      const attendanceRecord = {
        memberId,
        memberName,
        meetingId,
        meetingDate: meeting.date,
        responses,
        submissionTimestamp: new Date().toISOString(),
      };

      await googleSheetsService.recordAttendance(meeting as any, attendanceRecord);

      return {
        success: true,
        message: "Attendance recorded successfully"
      };
    } catch (error) {
      functions.logger.error("Error recording attendance:", error);

      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      throw new functions.https.HttpsError(
        "internal",
        (error as Error).message || "Failed to record attendance"
      );
    }
  }
);

// Get attendance records for a meeting
export const getAttendanceRecords = functions.https.onCall(
  async (data: { meetingId: string }, context) => {
    try {
      const { isAdmin } = await verifyUserAuth(context);

      if (!isAdmin) {
        throw new functions.https.HttpsError(
          "permission-denied",
          "Only admins can view attendance records"
        );
      }

      const { meetingId } = data;
      if (!meetingId) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Meeting ID is required"
        );
      }

      // Get meeting data
      const db = getFirestore();
      const meetingDoc = await db.collection('meetings').doc(meetingId).get();

      if (!meetingDoc.exists) {
        throw new functions.https.HttpsError(
          "not-found",
          "Meeting not found"
        );
      }

      const meeting = { id: meetingDoc.id, ...meetingDoc.data() } as any;
      const records = await googleSheetsService.getAttendanceRecords(meeting as any);

      return {
        success: true,
        data: records
      };
    } catch (error) {
      functions.logger.error("Error getting attendance records:", error);

      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      throw new functions.https.HttpsError(
        "internal",
        "Failed to get attendance records"
      );
    }
  }
);

// Check if user has attended a meeting
export const checkAttendanceStatus = functions.https.onCall(
  async (data: { meetingId: string, memberId?: string }, context) => {
    try {
      const { uid, isAdmin } = await verifyUserAuth(context);

      const { meetingId, memberId } = data;
      const targetMemberId = memberId || uid;

      // Non-admins can only check their own attendance
      if (!isAdmin && targetMemberId !== uid) {
        throw new functions.https.HttpsError(
          "permission-denied",
          "Can only check your own attendance status"
        );
      }

      if (!meetingId) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Meeting ID is required"
        );
      }

      // Get meeting data
      const db = getFirestore();
      const meetingDoc = await db.collection('meetings').doc(meetingId).get();

      if (!meetingDoc.exists) {
        throw new functions.https.HttpsError(
          "not-found",
          "Meeting not found"
        );
      }

      const meeting = { id: meetingDoc.id, ...meetingDoc.data() } as any;
      const hasAttended = await googleSheetsService.hasUserAttended(
        meetingId,
        targetMemberId,
        meeting as any
      );

      return {
        success: true,
        hasAttended
      };
    } catch (error) {
      functions.logger.error("Error checking attendance status:", error);

      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      throw new functions.https.HttpsError(
        "internal",
        "Failed to check attendance status"
      );
    }
  }
);

// Export attendance data with shareable link
export const exportAttendanceData = functions.https.onCall(
  async (data: { meetingId: string }, context) => {
    try {
      const { isAdmin } = await verifyUserAuth(context);

      if (!isAdmin) {
        throw new functions.https.HttpsError(
          "permission-denied",
          "Only admins can export attendance data"
        );
      }

      const { meetingId } = data;
      if (!meetingId) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Meeting ID is required"
        );
      }

      const exportData = await googleSheetsService.exportAttendanceData(meetingId);

      return {
        success: true,
        ...exportData
      };
    } catch (error) {
      functions.logger.error("Error exporting attendance data:", error);

      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      throw new functions.https.HttpsError(
        "internal",
        "Failed to export attendance data"
      );
    }
  }
);
