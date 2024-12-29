import { Timestamp } from 'firebase/firestore';

export type ContributionStatus = 'pending' | 'approved' | 'rejected';
export type ContributionType = 'monthly' | 'registration' | 'other';

export interface Contribution {
  id: string;
  member_id: string;
  amount: number;
  date: Timestamp;
  type: ContributionType;
  status: ContributionStatus;
  proof_of_payment?: string;
  review_notes?: string;
  reviewed_by?: string;
  reviewed_at?: Timestamp;
  members?: {
    full_name: string;
  };
}
export interface ContributionReview {
  status: ContributionStatus;
  notes: string;
  reviewer_id: string;
  reviewed_at: Date;
}