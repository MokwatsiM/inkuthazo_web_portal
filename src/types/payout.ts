import { Timestamp } from 'firebase/firestore';

export type PayoutStatus = 'pending' | 'approved' | 'paid';

export interface Payout {
  id: string;
  member_id: string;
  amount: number;
  date: Timestamp;
  reason: string;
  status: PayoutStatus;
  members?: {
    full_name: string;
  };
}