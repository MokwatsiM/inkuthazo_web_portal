import * as functions from 'firebase-functions';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

import * as mailgun from "mailgun-js";


initializeApp();

interface FirebaseError extends Error {
  code?: string;
  message: string;
}
// Initialize Mailgun

const mg = mailgun({
  apiKey: functions.config().mailgun.api_key,
  domain: functions.config().mailgun.domain,
});

// Update the sendEmail helper function
async function sendEmail(options: { 
  to: string; 
  template: { 
    name: string; 
    data: Record<string, string>; 
  }; 
}) {
  const { to, template } = options;

  // Define email templates
  const templates: Record<
    string,
    {
      subject: string;
      html: (data: Record<string, string>) => string;
    }
  > = {
    "member-invitation": {
      subject: "Invitation to Join Inkuthazo Burial & Social Club Portal",
      html: (data) => `
        <h1>Welcome to the Inkuthazo Burial & Social Club Portal</h1>
        <p>Hello ${data.fullName},</p>
        <p>You have been invited to join our Inkuthazo Burial & Social Club Portal.</p>
        <p>Click the link below to complete your registration:</p>
        <p><a href="${data.registrationUrl}">Complete Registration</a></p>
        <p>This invitation link will expire in 7 days.</p>
        <p>If you did not request this invitation, please ignore this email.</p>
      `,
    },
  };

  const emailTemplate = templates[template.name];
  if (!emailTemplate) {
    throw new Error(`Email template '${template.name}' not found`);
  }

  const emailData = {
    from: `Burial Society Portal <noreply@${functions.config().mailgun.domain}>`,
    to,
    subject: emailTemplate.subject,
    html: emailTemplate.html(template.data)
  };

  try {
    await mg.messages().send(emailData);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to send email'
    );
  }
}

// Handle deletion request updates
export const onDeletionRequestUpdated = functions.firestore
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
        await getAuth().deleteUser(memberId);

        // Log the successful deletion
        functions.logger.info(`Successfully deleted auth user ${memberId}`);

        // Update the deletion request with auth deletion status
        await change.after.ref.update({
          auth_deleted: true,
          auth_deleted_at: new Date()
        });
        cleanupDeletedUserData;
      } catch (error) {
        const firebaseError = error as FirebaseError;
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
export const cleanupDeletedUserData = functions.auth.user()
  .onDelete(async (user:any) => {
    try {
      // Delete user's storage files
      const bucket = getStorage().bucket();
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
    } catch (error) {
      const firebaseError = error as FirebaseError;
      const errorMessage = firebaseError.message || 'Unknown error occurred';
      functions.logger.error(`Error cleaning up user data: ${errorMessage}`);
    }
  });

  // Send member invitation email
export const sendMemberInvitation = functions.https.onCall(async (data, context) => {
  // Verify the caller is authenticated and authorized
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be authenticated to send invitations'
    );
  }

  try {
    const { email, fullName, invitationToken } = data;
    
    // Get the deployment URL from environment variable
    const deploymentUrl = functions.config().app.url;
    const registrationUrl = `${deploymentUrl}/auth/register?token=${invitationToken}`;

    // Send the invitation email
    await sendEmail({
      to: email,
      template: {
        name: 'member-invitation',
        data: {
          fullName,
          registrationUrl
        }
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending invitation email:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to send invitation email'
    );
  }
});

// // Helper function to send emails (implementation depends on your email service)
// async function sendEmail(options: { 
//   to: string; 
//   template: { 
//     name: string; 
//     data: Record<string, string>; 
//   }; 
// }) {
//   // Implement email sending using your preferred service
//   // (e.g., SendGrid, Mailgun, etc.)
//   // This is just a placeholder
//   console.log('Sending email:', options);
// }