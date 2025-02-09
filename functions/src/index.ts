import * as functions from "firebase-functions";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";
import Mailjet from "node-mailjet";


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
