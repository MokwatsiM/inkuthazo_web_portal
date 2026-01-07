import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, '../serviceAccountKey.json'), 'utf8')
);

// Initialize Firebase Admin
// node scripts/updateUserEmail.js
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function updateUserEmail(uid, newEmail) {
  try {
    // Update the user's email
    const updatedUser = await admin.auth().updateUser(uid, {
      email: newEmail,
      emailVerified: false // Set to true if you want to skip verification
    });

    console.log('✅ Successfully updated user email:');
    console.log('UID:', updatedUser.uid);
    console.log('New Email:', updatedUser.email);
    console.log('Email Verified:', updatedUser.emailVerified);

    return updatedUser;
  } catch (error) {
    console.error('❌ Error updating user email:', error.message);
    throw error;
  }
}

// Usage Example
const userUID = 'userID';
const newEmail = 'newEmail@example.com';

updateUserEmail(userUID, newEmail)
  .then(() => {
    console.log('Email update completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to update email:', error);
    process.exit(1);
  });