import * as functions from "firebase-functions/v1";
import { logger } from "firebase-functions/logger";
import { getAuth } from "firebase-admin/auth";
import { sendBrevoEmail, BREVO_API_KEY, APP_URL } from "./brevo";
import { emailLayout } from "./catalogue";

/**
 * Send a branded email-verification message via Brevo instead of the
 * default (unbranded) Firebase Auth email. Called from the client right
 * after signup and from the "resend" action.
 *
 * The verification link is minted with the Admin SDK and returns the user
 * to the portal, where they continue to the pending-approval state.
 */
export const sendBrandedVerificationEmail = functions
  .runWith({ secrets: [BREVO_API_KEY] })
  .https.onCall(
    async (
      _data: unknown,
      context
    ): Promise<{ success: boolean }> => {
      if (!context.auth) {
        throw new functions.https.HttpsError(
          "unauthenticated",
          "Must be authenticated"
        );
      }

      const user = await getAuth().getUser(context.auth.uid);
      if (!user.email) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "Account has no email address"
        );
      }
      if (user.emailVerified) {
        // Nothing to do — treat as success so the client can proceed
        return { success: true };
      }

      const link = await getAuth().generateEmailVerificationLink(user.email, {
        url: `${APP_URL.value()}/auth/login`,
        handleCodeInApp: false,
      });

      try {
        await sendBrevoEmail({
          to: user.email,
          toName: user.displayName || undefined,
          subject: "Verify your email — Inkuthazo Social Club",
          html: emailLayout(
            "Verify your email",
            `<p>Welcome to the Inkuthazo Social Club portal.</p>
             <p>Please confirm your email address to continue. After
             verifying, an administrator will review and approve your
             membership before you get full access.</p>`,
            "Verify my email",
            link
          ),
        });
        logger.info(`Branded verification email sent to ${user.email}`);
        return { success: true };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error("Failed to send verification email:", message);
        throw new functions.https.HttpsError(
          "internal",
          "Failed to send verification email",
          message
        );
      }
    }
  );
