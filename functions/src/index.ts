import * as functions from "firebase-functions/v1";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";
import { logger } from "firebase-functions/logger";
import { sendBrevoEmail, BREVO_API_KEY, APP_URL } from "./notifications/brevo";
import { emailLayout } from "./notifications/catalogue";

initializeApp();

// Lifecycle notification triggers (in-app + email)
export {
  onContributionReviewed,
  onClaimReviewed,
  onCreditStatusChanged,
  onDonationReviewed,
  onMemberApproved,
  hostingReminder,
} from "./notifications/triggers";

// Admin-triggered arrears statement emails
export { sendArrearsNotices } from "./notifications/arrearsNotice";

// Admin-triggered outstanding-credit statement emails
export { sendCreditNotices } from "./notifications/creditNotice";

// Branded (Brevo) email-verification message for new signups
export { sendBrandedVerificationEmail } from "./notifications/verificationEmail";

interface FirebaseError extends Error {
  code?: string;
  message: string;
}
interface EmailData {
  email: string;
  fullName: string;
  invitationToken: string;
}

// Keep Firebase Auth custom claims (role, status) in sync with the member
// document. Security rules authorize from request.auth.token.role/status,
// so this must run whenever either field changes. Existing sessions pick up
// new claims when their ID token refreshes (up to ~1 hour) or on re-login.
export const syncMemberClaims = functions.firestore
  .document("members/{memberId}")
  .onWrite(async (change, context) => {
    const memberId = context.params.memberId;

    // Member deleted — auth account cleanup is handled elsewhere
    if (!change.after.exists) {
      return;
    }

    const after = change.after.data() as { role?: string; status?: string };
    const before = change.before.exists
      ? (change.before.data() as { role?: string; status?: string })
      : null;

    if (
      before &&
      before.role === after.role &&
      before.status === after.status
    ) {
      return;
    }

    try {
      await getAuth().setCustomUserClaims(memberId, {
        role: after.role ?? null,
        status: after.status ?? null,
      });
      logger.info(
        `Synced claims for ${memberId}: role=${after.role}, status=${after.status}`
      );
    } catch (error) {
      const firebaseError = error as FirebaseError;
      logger.error(
        `Error syncing claims for ${memberId}: ${firebaseError.message}`
      );
    }
  });

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
        logger.info(`Successfully deleted auth user ${memberId}`);

        // Update the deletion request with auth deletion status
        await change.after.ref.update({
          auth_deleted: true,
          auth_deleted_at: new Date(),
        });
      } catch (error) {
        const firebaseError = error as FirebaseError;
        const errorMessage = firebaseError.message || "Unknown error occurred";
        logger.error(`Error deleting auth user: ${errorMessage}`);

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
  .onDelete(async (user) => {
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

      logger.info(
        `Successfully cleaned up data for user ${user.uid}`
      );
    } catch (error) {
      const firebaseError = error as FirebaseError;
      const errorMessage = firebaseError.message || "Unknown error occurred";
      logger.error(`Error cleaning up user data: ${errorMessage}`);
    }
  });

export const sendMemberInvitation = functions
  .runWith({ secrets: [BREVO_API_KEY] })
  .https.onCall(
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

      const registrationUrl =
        `${APP_URL.value()}/auth/register?token=${invitationToken}`;

      try {
        await sendBrevoEmail({
          to: email,
          toName: fullName,
          subject: "You are invited to join the Inkuthazo Social Club",
          html: emailLayout(
            "You're invited!",
            `<p>Hi ${fullName},</p>
             <p>You have been invited to join the Inkuthazo Social Club portal.
             Click the button below to complete your registration.
             This invitation expires in 7 days.</p>`,
            "Complete your registration",
            registrationUrl
          ),
        });

        logger.info(`Invitation email sent to ${email}`);
        return { success: true, message: "Email sent successfully" };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error("Error sending invitation email:", message);
        throw new functions.https.HttpsError(
          "internal",
          "Failed to send email",
          message
        );
      }
    }
  );
