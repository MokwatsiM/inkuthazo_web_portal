"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMemberInvitation = exports.cleanupDeletedUserData = exports.onDeletionRequestUpdated = exports.syncMemberClaims = void 0;
const functions = require("firebase-functions");
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
const storage_1 = require("firebase-admin/storage");
const node_mailjet_1 = require("node-mailjet");
const firebase_functions_1 = require("firebase-functions");
(0, app_1.initializeApp)();
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
        functions.logger.info(`Synced claims for ${memberId}: role=${after.role}, status=${after.status}`);
    }
    catch (error) {
        const firebaseError = error;
        functions.logger.error(`Error syncing claims for ${memberId}: ${firebaseError.message}`);
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
            functions.logger.info(`Successfully deleted auth user ${memberId}`);
            // Update the deletion request with auth deletion status
            await change.after.ref.update({
                auth_deleted: true,
                auth_deleted_at: new Date(),
            });
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
        firebase_functions_1.logger.debug("Email sent successfully:", response.body);
        return { success: true, message: "Email sent successfully" };
    }
    catch (error) {
        firebase_functions_1.logger.error("Error sending email:", error.message || error.response);
        throw new functions.https.HttpsError("internal", "Failed to send email", ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
    }
});
//# sourceMappingURL=index.js.map