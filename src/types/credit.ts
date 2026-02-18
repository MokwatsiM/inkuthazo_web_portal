import { Timestamp } from 'firebase/firestore';

export type CreditStatus =
  | 'pending_review'      // Created by admin, awaiting chairperson review
  | 'needs_info'          // Chairperson requested more information
  | 'approved'            // Approved by chairperson
  | 'rejected'            // Rejected by chairperson
  | 'active'              // Active and being repaid
  | 'settled'             // Fully paid
  | 'defaulted';          // Payment defaulted

export type CreditReviewAction = 'approve' | 'reject' | 'request_info';

export interface CreditTerms {
  principal_amount: number;           // Original credit amount
  additional_fee: number;             // Additional fee (can be 0)
  total_amount: number;               // principal + fee
  installments: number;               // Number of payments
  installment_amount: number;         // Amount per installment
}

export interface CreditReview {
  reviewed_by: string;                // Chairperson user ID
  reviewer_name: string;              // Chairperson name
  action: CreditReviewAction;
  notes: string;
  reviewed_at: Timestamp;
  additional_info_requested?: string; // What info is needed
}

export interface CreditPayment {
  id: string;
  contribution_id: string;            // Link to contribution
  amount: number;
  payment_number: number;             // Which installment (1, 2, 3, etc.)
  paid_at: Timestamp;
  approved_at?: Timestamp;
  status: 'pending' | 'approved' | 'rejected';
}

export interface Credit {
  id: string;

  // Member information
  member_id: string;
  member_name: string;

  // Credit details
  reason: string;                     // Purpose of credit
  description?: string;

  // Terms
  terms: CreditTerms;

  // Status and workflow
  status: CreditStatus;

  // Admin who created it
  created_by: string;
  created_by_name: string;
  created_at: Timestamp;

  // Chairperson review
  review?: CreditReview;

  // Additional info response (if requested)
  additional_info_response?: string;
  additional_info_updated_at?: Timestamp;

  // Expense tracking
  expense_id?: string;                // Created expense when approved

  // Payment tracking
  payments: CreditPayment[];
  total_paid: number;                 // Total amount paid so far
  remaining_balance: number;          // Amount still owed

  // Settlement
  settled_at?: Timestamp;

  // Metadata
  updated_at: Timestamp;

  // Relations
  members?: {
    full_name: string;
  };
}

export interface CreditFilter {
  member_id?: string;
  status?: CreditStatus;
  created_by?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface CreditSummary {
  totalCredits: number;
  totalAmount: number;
  activeCredits: number;
  activeAmount: number;
  settledCredits: number;
  settledAmount: number;
  pendingReview: number;
  defaultedCredits: number;
}

export interface CreateCreditData {
  member_id: string;
  member_name: string;
  reason: string;
  description?: string;
  principal_amount: number;
  additional_fee: number;
  installments: number;
}
