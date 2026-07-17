"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMemberInvitation = exports.cleanupDeletedUserData = exports.onDeletionRequestUpdated = exports.syncMemberClaims = exports.sendCreditNotices = exports.sendArrearsNotices = exports.hostingReminder = exports.onMemberApproved = exports.onDonationReviewed = exports.onCreditStatusChanged = exports.onClaimReviewed = exports.onContributionReviewed = void 0;
const functions = require("firebase-functions/v1");
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
const storage_1 = require("firebase-admin/storage");
const logger_1 = require("firebase-functions/logger");
const brevo_1 = require("./notifications/brevo");
const catalogue_1 = require("./notifications/catalogue");
(0, app_1.initializeApp)();
// Lifecycle notification triggers (in-app + email)
var triggers_1 = require("./notifications/triggers");
Object.defineProperty(exports, "onContributionReviewed", { enumerable: true, get: function () { return triggers_1.onContributionReviewed; } });
Object.defineProperty(exports, "onClaimReviewed", { enumerable: true, get: function () { return triggers_1.onClaimReviewed; } });
Object.defineProperty(exports, "onCreditStatusChanged", { enumerable: true, get: function () { return triggers_1.onCreditStatusChanged; } });
Object.defineProperty(exports, "onDonationReviewed", { enumerable: true, get: function () { return triggers_1.onDonationReviewed; } });
Object.defineProperty(exports, "onMemberApproved", { enumerable: true, get: function () { return triggers_1.onMemberApproved; } });
Object.defineProperty(exports, "hostingReminder", { enumerable: true, get: function () { return triggers_1.hostingReminder; } });
// Admin-triggered arrears statement emails
var arrearsNotice_1 = require("./notifications/arrearsNotice");
Object.defineProperty(exports, "sendArrearsNotices", { enumerable: true, get: function () { return arrearsNotice_1.sendArrearsNotices; } });
// Admin-triggered outstanding-credit statement emails
var creditNotice_1 = require("./notifications/creditNotice");
Object.defineProperty(exports, "sendCreditNotices", { enumerable: true, get: function () { return creditNotice_1.sendCreditNotices; } });
// Keep Firebase Auth custom claims (role, status) in sync with the member
// document. Security rules authorize from request.auth.token.role/status,
// so this must run whenever either field changes. Existing sessions pick up
// new claims when their ID token refreshes (up to ~1 hour) or on re-login.
exports.syncMemberClaims = functions.firestore
    .document("members/{memberId}")
    .onWrite(async (change, context) => {
    var _a, _b;
    const memberId = context.params.memberId;
    // Member deleted — auth account cleanup is handled elsewhere
    if (!change.after.exists) {
        return;
    }
    const after = change.after.data();
    const before = change.before.exists
        ? change.before.data()
        : null;
    if (before &&
        before.role === after.role &&
        before.status === after.status) {
        return;
    }
    try {
        await (0, auth_1.getAuth)().setCustomUserClaims(memberId, {
            role: (_a = after.role) !== null && _a !== void 0 ? _a : null,
            status: (_b = after.status) !== null && _b !== void 0 ? _b : null,
        });
        logger_1.logger.info(`Synced claims for ${memberId}: role=${after.role}, status=${after.status}`);
    }
    catch (error) {
        const firebaseError = error;
        logger_1.logger.error(`Error syncing claims for ${memberId}: ${firebaseError.message}`);
    }
});
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
            logger_1.logger.info(`Successfully deleted auth user ${memberId}`);
            // Update the deletion request with auth deletion status
            await change.after.ref.update({
                auth_deleted: true,
                auth_deleted_at: new Date(),
            });
        }
        catch (error) {
            const firebaseError = error;
            const errorMessage = firebaseError.message || "Unknown error occurred";
            logger_1.logger.error(`Error deleting auth user: ${errorMessage}`);
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
        logger_1.logger.info(`Successfully cleaned up data for user ${user.uid}`);
    }
    catch (error) {
        const firebaseError = error;
        const errorMessage = firebaseError.message || "Unknown error occurred";
        logger_1.logger.error(`Error cleaning up user data: ${errorMessage}`);
    }
});
exports.sendMemberInvitation = functions
    .runWith({ secrets: [brevo_1.BREVO_API_KEY] })
    .https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Must be authenticated to send invitations");
    }
    const { email, fullName, invitationToken } = data;
    // Validate input
    if (!email || !fullName || !invitationToken) {
        throw new functions.https.HttpsError("invalid-argument", "Missing email, name, or invitationToken");
    }
    const registrationUrl = `${brevo_1.APP_URL.value()}/auth/register?token=${invitationToken}`;
    try {
        await (0, brevo_1.sendBrevoEmail)({
            to: email,
            toName: fullName,
            subject: "You are invited to join the Inkuthazo Social Club",
            html: (0, catalogue_1.emailLayout)("You're invited!", `<p>Hi ${fullName},</p>
             <p>You have been invited to join the Inkuthazo Social Club portal.
             Click the button below to complete your registration.
             This invitation expires in 7 days.</p>`, "Complete your registration", registrationUrl),
        });
        logger_1.logger.info(`Invitation email sent to ${email}`);
        return { success: true, message: "Email sent successfully" };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger_1.logger.error("Error sending invitation email:", message);
        throw new functions.https.HttpsError("internal", "Failed to send email", message);
    }
});
//# sourceMappingURL=index.js.map