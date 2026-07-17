import { Timestamp } from 'firebase/firestore';

/**
 * Persistent in-app notification, written only by Cloud Functions
 * (see functions/src/notifications/). Distinct from the ephemeral toast
 * types in src/types/notification.ts.
 */
export type InAppNotificationType =
  | 'contribution_approved'
  | 'contribution_rejected'
  | 'claim_approved'
  | 'claim_rejected'
  | 'credit_approved'
  | 'credit_rejected'
  | 'credit_needs_info'
  | 'credit_settled'
  | 'donation_approved'
  | 'donation_rejected'
  | 'member_approved'
  | 'hosting_reminder'
  | 'arrears_notice'
  | 'credit_notice';

export interface InAppNotification {
  id: string;
  user_id: string;
  type: InAppNotificationType;
  title: string;
  body: string;
  /** In-app route to navigate to when clicked */
  link: string;
  read: boolean;
  created_at: Timestamp;
  expires_at: Timestamp;
  source: { collection: string; doc_id: string };
}
