"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupDeletedUserData = exports.onDeletionRequestUpdated = void 0;
const functions = require("firebase-functions");
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
const storage_1 = require("firebase-admin/storage");
(0, app_1.initializeApp)();
// Handle deletion request updates
exports.onDeletionRequestUpdated = functions.firestore
    .document('deletion_requests/{requestId}')
    .onUpdate(async (change) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();
    // Only proceed if status changed from 'pending' to 'completed'
    if (beforeData.status === 'pending' && afterData.status === 'completed') {
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
                auth_deleted_at: new Date()
            });
            exports.cleanupDeletedUserData;
        }
        catch (error) {
            const firebaseError = error;
            const errorMessage = firebaseError.message || 'Unknown error occurred';
            functions.logger.error(`Error deleting auth user: ${errorMessage}`);
            // Update the request with the error
            await change.after.ref.update({
                auth_error: errorMessage,
                auth_deleted: false
            });
        }
    }
});
// Clean up user data after deletion
exports.cleanupDeletedUserData = functions.auth.user()
    .onDelete(async (user) => {
    try {
        // Delete user's storage files
        const bucket = (0, storage_1.getStorage)().bucket();
        await bucket.deleteFiles({
            prefix: `avatars/${user.uid}/`
        });
        await bucket.deleteFiles({
            prefix: `dependants/${user.uid}/`
        });
        await bucket.deleteFiles({
            prefix: `proof_of_payments/${user.uid}/`
        });
        functions.logger.info(`Successfully cleaned up data for user ${user.uid}`);
    }
    catch (error) {
        const firebaseError = error;
        const errorMessage = firebaseError.message || 'Unknown error occurred';
        functions.logger.error(`Error cleaning up user data: ${errorMessage}`);
    }
});
//# sourceMappingURL=index.js.map