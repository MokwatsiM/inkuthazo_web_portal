import { Timestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'member';
export type MemberStatus = 'pending' | 'approved' | 'inactive';

export interface Member {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  join_date: Timestamp;
  status: MemberStatus;
  role: UserRole;
}

export interface Contribution {
  id: string;
  member_id: string;
  amount: number;
  date: Timestamp;
  type: 'monthly' | 'registration' | 'other';
  proof_of_payment?: string; // URL to the uploaded file
  members?: {
    full_name: string;
  };
}

export interface Payout {
  id: string;
  member_id: string;
  amount: number;
  date: Timestamp;
  reason: string;
  status: 'pending' | 'approved' | 'paid';
  members?: {
    full_name: string;
  };
}

export interface MemberDetail extends Member {
  contributions: Contribution[];
  payouts: Payout[];
}

export interface FinancialData {
  name: string;
  contributions: number;
  payouts: number;
}

export type ReportType = 'contributions' | 'payouts' | 'summary';
export type ReportPeriod = 'monthly' | 'quarterly' | 'yearly';

export interface ReportData {
  period: {
    start: string;
    end: string;
  };
  totalContributions: number;
  totalPayouts: number;
  balance: number;
  contributionsCount: number;
  payoutsCount: number;
  contributions: Contribution[];
  payouts: Payout[];
}