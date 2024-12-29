import { Timestamp } from 'firebase/firestore';
import type { MemberStatus } from './index';

export interface ArchivedContribution {
  id: string;
  member: {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    join_date: Timestamp;
    status: MemberStatus;
  };
  contribution: {
    amount: number;
    date: Timestamp;
    type: 'monthly' | 'registration' | 'other';
    proof_of_payment?: string;
  };
  archived_at: Timestamp;
}