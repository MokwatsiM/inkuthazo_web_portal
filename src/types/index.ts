import { Timestamp } from 'firebase/firestore';
import type { Contribution } from './contribution';
import type { Payout } from './payout';

export type UserRole = 'admin' | 'member';
export type MemberStatus = 'pending' | 'approved' | 'active' | 'inactive';

export interface Dependant {
  id: string;
  full_name: string;
  date_of_birth: Timestamp;
  relationship: 'spouse' | 'child' | 'parent';
  id_number: string;
  id_document_url?: string;
}

export interface Member {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  join_date: Timestamp;
  status: MemberStatus;
  role: UserRole;
  avatar_url?: string;
  dependants?: Dependant[];
}

export interface MemberDetail extends Member {
  contributions: Contribution[];
  payouts: Payout[];
}