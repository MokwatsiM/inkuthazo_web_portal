import { Timestamp } from 'firebase/firestore';

export type DonationType = 'investment' | 'donation' | 'sponsorship' | 'grant' | 'other';
export type DonationSource = 'member' | 'outsider' | 'organization';
export type DonationStatus = 'pending' | 'approved' | 'rejected';

export interface Donation {
  id: string;

  // Source information
  source: DonationSource;
  donor_name: string;
  member_id?: string; // Only if source is 'member'
  organization?: string; // For organization donors
  contact_email?: string;
  contact_phone?: string;

  // Donation details
  type: DonationType;
  amount: number;
  date: Timestamp;
  description?: string;
  purpose?: string; // What the donation is for

  // Status and approval
  status: DonationStatus;
  proof_of_payment?: string;
  payment_method?: string; // e.g., "Bank Transfer", "Cash", "Check", "EFT"
  reference_number?: string;

  // Review information
  review_notes?: string;
  reviewed_by?: string;
  reviewed_at?: Timestamp;

  // Metadata
  created_by: string;
  created_at: Timestamp;
  updated_at: Timestamp;

  // Optional: Tax deductible information
  tax_deductible?: boolean;
  receipt_issued?: boolean;
  receipt_number?: string;

  // Relations
  members?: {
    full_name: string;
  };
}

export interface DonationReview {
  status: DonationStatus;
  notes: string;
  reviewer_id: string;
  reviewed_at: Date;
}

export interface DonationFilter {
  source?: DonationSource;
  type?: DonationType;
  status?: DonationStatus;
  member_id?: string;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
}

export interface DonationSummary {
  totalDonations: number;
  totalAmount: number;
  byType: Record<DonationType, { count: number; amount: number }>;
  bySource: Record<DonationSource, { count: number; amount: number }>;
  byStatus: Record<DonationStatus, { count: number; amount: number }>;
  topDonors: Array<{ name: string; amount: number; count: number }>;
}
