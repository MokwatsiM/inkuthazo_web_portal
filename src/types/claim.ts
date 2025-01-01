import { Timestamp } from 'firebase/firestore';

export type ClaimStatus = 'pending' | 'approved' | 'rejected';
export type ClaimType = 'death' | 'funeral';

export interface Claimant {
  id: string;
  type: 'member' | 'dependant';
  full_name: string;
  relationship?: string;
}

export interface Claim {
  id: string;
  member_id: string;
  claimant: Claimant;
  type: ClaimType;
  amount: number;
  date: Timestamp;
  status: ClaimStatus;
  documents_url?: string[];
  review_notes?: string;
  reviewed_by?: string;
  reviewed_at?: Timestamp;
  members?: {
    full_name: string;
  };
}