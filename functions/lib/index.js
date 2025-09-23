"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportAttendanceData = exports.checkAttendanceStatus = exports.getAttendanceRecords = exports.recordAttendanceInSheets = exports.createAttendanceSheet = exports.sendMemberInvitation = exports.cleanupDeletedUserData = exports.onDeletionRequestUpdated = void 0;
const functions = require("firebase-functions");
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
const storage_1 = require("firebase-admin/storage");
const firestore_1 = require("firebase-admin/firestore");
const node_mailjet_1 = require("node-mailjet");
const googleSheetsService_1 = require("./services/googleSheetsService");
(0, app_1.initializeApp)();
// Handle deletion request updates
exports.onDeletionRequestUpdated = functions.firestore
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
            await (0, auth_1.getAuth)().deleteUser(memberId);
            // Log the successful deletion
            functions.logger.info(`Successfully deleted auth user ${memberId}`);
            // Update the deletion request with auth deletion status
            await change.after.ref.update({
                auth_deleted: true,
                auth_deleted_at: new Date(),
            });
            exports.cleanupDeletedUserData;
        }
        catch (error) {
            const firebaseError = error;
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
exports.cleanupDeletedUserData = functions.auth
    .user()
    .onDelete(async (user) => {
    try {
        // Delete user's storage files
        const bucket = (0, storage_1.getStorage)().bucket();
        await bucket.deleteFiles({
            prefix: `avatars/${user.uid}/`,
        });
        await bucket.deleteFiles({
            prefix: `dependants/${user.uid}/`,
        });
        await bucket.deleteFiles({
            prefix: `proof_of_payments/${user.uid}/`,
        });
        functions.logger.info(`Successfully cleaned up data for user ${user.uid}`);
    }
    catch (error) {
        const firebaseError = error;
        const errorMessage = firebaseError.message || "Unknown error occurred";
        functions.logger.error(`Error cleaning up user data: ${errorMessage}`);
    }
});
exports.sendMemberInvitation = functions.https.onCall(async (data, context) => {
    var _a;
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Must be authenticated to send invitations");
    }
    const { email, fullName, invitationToken } = data;
    // Validate input
    if (!email || !fullName || !invitationToken) {
        throw new functions.https.HttpsError("invalid-argument", "Missing email, name, or invitationToken");
    }
    const mailjet = new node_mailjet_1.default({
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
    }
    catch (error) {
        console.error("Error sending email:", error.message || error.response);
        throw new functions.https.HttpsError("internal", "Failed to send email", ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
    }
});
// Helper function to verify user authentication and get user details
async function verifyUserAuth(context) {
    var _a;
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Must be authenticated to access this endpoint");
    }
    const db = (0, firestore_1.getFirestore)();
    const userDoc = await db.collection('members').doc(context.auth.uid).get();
    if (!userDoc.exists) {
        throw new functions.https.HttpsError("not-found", "User profile not found");
    }
    return {
        uid: context.auth.uid,
        userData: userDoc.data(),
        isAdmin: ((_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.role) === 'admin'
    };
}
// Google Sheets API Endpoints for Attendance System
// Create sheet for meeting
exports.createAttendanceSheet = functions.https.onCall(async (data, context) => {
    try {
        const { isAdmin } = await verifyUserAuth(context);
        if (!isAdmin) {
            throw new functions.https.HttpsError("permission-denied", "Only admins can create attendance sheets");
        }
        const { meetingId } = data;
        if (!meetingId) {
            throw new functions.https.HttpsError("invalid-argument", "Meeting ID is required");
        }
        // Get meeting data from Firestore
        const db = (0, firestore_1.getFirestore)();
        const meetingDoc = await db.collection('meetings').doc(meetingId).get();
        if (!meetingDoc.exists) {
            throw new functions.https.HttpsError("not-found", "Meeting not found");
        }
        const meeting = Object.assign({ id: meetingDoc.id }, meetingDoc.data());
        const sheetName = await googleSheetsService_1.googleSheetsService.createSheetForMeeting(meeting);
        return {
            success: true,
            sheetName,
            message: "Attendance sheet created successfully"
        };
    }
    catch (error) {
        functions.logger.error("Error creating attendance sheet:", error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError("internal", "Failed to create attendance sheet");
    }
});
// Record attendance in Google Sheets
exports.recordAttendanceInSheets = functions.https.onCall(async (data, context) => {
    try {
        const { uid } = await verifyUserAuth(context);
        const { meetingId, memberId, memberName, responses } = data;
        // Verify user can only submit attendance for themselves
        if (uid !== memberId) {
            throw new functions.https.HttpsError("permission-denied", "Can only submit attendance for yourself");
        }
        if (!meetingId || !memberId || !memberName || !responses) {
            throw new functions.https.HttpsError("invalid-argument", "Missing required fields");
        }
        // Get meeting data
        const db = (0, firestore_1.getFirestore)();
        const meetingDoc = await db.collection('meetings').doc(meetingId).get();
        if (!meetingDoc.exists) {
            throw new functions.https.HttpsError("not-found", "Meeting not found");
        }
        const meeting = Object.assign({ id: meetingDoc.id }, meetingDoc.data());
        // Check if user already attended
        const hasAttended = await googleSheetsService_1.googleSheetsService.hasUserAttended(meetingId, memberId, meeting);
        if (hasAttended) {
            throw new functions.https.HttpsError("already-exists", "Attendance already recorded for this meeting");
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
        await googleSheetsService_1.googleSheetsService.recordAttendance(meeting, attendanceRecord);
        return {
            success: true,
            message: "Attendance recorded successfully"
        };
    }
    catch (error) {
        functions.logger.error("Error recording attendance:", error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError("internal", error.message || "Failed to record attendance");
    }
});
// Get attendance records for a meeting
exports.getAttendanceRecords = functions.https.onCall(async (data, context) => {
    try {
        const { isAdmin } = await verifyUserAuth(context);
        if (!isAdmin) {
            throw new functions.https.HttpsError("permission-denied", "Only admins can view attendance records");
        }
        const { meetingId } = data;
        if (!meetingId) {
            throw new functions.https.HttpsError("invalid-argument", "Meeting ID is required");
        }
        // Get meeting data
        const db = (0, firestore_1.getFirestore)();
        const meetingDoc = await db.collection('meetings').doc(meetingId).get();
        if (!meetingDoc.exists) {
            throw new functions.https.HttpsError("not-found", "Meeting not found");
        }
        const meeting = Object.assign({ id: meetingDoc.id }, meetingDoc.data());
        const records = await googleSheetsService_1.googleSheetsService.getAttendanceRecords(meeting);
        return {
            success: true,
            data: records
        };
    }
    catch (error) {
        functions.logger.error("Error getting attendance records:", error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError("internal", "Failed to get attendance records");
    }
});
// Check if user has attended a meeting
exports.checkAttendanceStatus = functions.https.onCall(async (data, context) => {
    try {
        const { uid, isAdmin } = await verifyUserAuth(context);
        const { meetingId, memberId } = data;
        const targetMemberId = memberId || uid;
        // Non-admins can only check their own attendance
        if (!isAdmin && targetMemberId !== uid) {
            throw new functions.https.HttpsError("permission-denied", "Can only check your own attendance status");
        }
        if (!meetingId) {
            throw new functions.https.HttpsError("invalid-argument", "Meeting ID is required");
        }
        // Get meeting data
        const db = (0, firestore_1.getFirestore)();
        const meetingDoc = await db.collection('meetings').doc(meetingId).get();
        if (!meetingDoc.exists) {
            throw new functions.https.HttpsError("not-found", "Meeting not found");
        }
        const meeting = Object.assign({ id: meetingDoc.id }, meetingDoc.data());
        const hasAttended = await googleSheetsService_1.googleSheetsService.hasUserAttended(meetingId, targetMemberId, meeting);
        return {
            success: true,
            hasAttended
        };
    }
    catch (error) {
        functions.logger.error("Error checking attendance status:", error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError("internal", "Failed to check attendance status");
    }
});
// Export attendance data with shareable link
exports.exportAttendanceData = functions.https.onCall(async (data, context) => {
    try {
        const { isAdmin } = await verifyUserAuth(context);
        if (!isAdmin) {
            throw new functions.https.HttpsError("permission-denied", "Only admins can export attendance data");
        }
        const { meetingId } = data;
        if (!meetingId) {
            throw new functions.https.HttpsError("invalid-argument", "Meeting ID is required");
        }
        const exportData = await googleSheetsService_1.googleSheetsService.exportAttendanceData(meetingId);
        return Object.assign({ success: true }, exportData);
    }
    catch (error) {
        functions.logger.error("Error exporting attendance data:", error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError("internal", "Failed to export attendance data");
    }
});
//# sourceMappingURL=index.js.map