import { Timestamp } from 'firebase/firestore';
import type { Member } from './index';

export type DeletionRequestStatus = 'pending' | 'completed' | 'rejected';

export interface DeletionRequest {
  id: string;
  member_id: string;
  requested_by: string;
  requested_at: Timestamp;
  status: DeletionRequestStatus;
  auth_deleted?: boolean;
  auth_deleted_at?: Timestamp;
  auth_error?: string;
  member_email: string;
  member_data?: Omit<Member, 'id'>;
}