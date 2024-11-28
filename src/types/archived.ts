// src/types/archived.ts
import { Timestamp } from 'firebase/firestore';

export interface ArchivedContribution {
  id: string;
  member: {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    join_date: Timestamp;
    status: 'active' | 'inactive';
  };
  contribution: {
    amount: number;
    date: Timestamp;
    type: 'monthly' | 'registration' | 'other';
    proof_of_payment?: string;
  };
  archived_at: Timestamp;
}
