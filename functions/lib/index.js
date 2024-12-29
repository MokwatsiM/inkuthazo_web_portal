"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupDeletedUserData = exports.onDeletionRequestUpdated = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
exports.onDeletionRequestUpdated = functions.firestore
    .document('deletion_requests/{requestId}')
    .onUpdate(async (change) => {
    const newData = change.after.data();
    const previousData = change.before.data();
    // Only proceed if status changed from 'pending' to 'completed'
    if (previousData.status === 'pending' && newData.status === 'completed') {
        try {
            // Get the member's auth UID
            const memberId = newData.member_id;
            // Delete the user's auth account
            await admin.auth().deleteUser(memberId);
            // Log the successful deletion
            functions.logger.info(`Successfully deleted auth user ${memberId}`);
            // Update the deletion request with auth deletion status
            await change.after.ref.update({
                auth_deleted: true,
                auth_deleted_at: admin.firestore.FieldValue.serverTimestamp()
            });
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
// Optional: Add a function to clean up user data after successful deletion
exports.cleanupDeletedUserData = functions.auth
    .user()
    .onDelete(async (user) => {
    try {
        // Delete user's storage files
        const bucket = admin.storage().bucket();
        await bucket.deleteFiles({
            prefix: `avatars/${user.uid}/`
        });
        await bucket.deleteFiles({
            prefix: `dependants/${user.uid}/`
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