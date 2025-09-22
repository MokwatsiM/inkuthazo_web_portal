export interface MonthlyFee {
  month: Date;
  /**
   * Total amount owed for this month (includes both monthly fee and late penalty if applicable)
   * This is the sum of outstanding monthly fee + outstanding late penalty
   */
  amount: number;
  isLate: boolean;
  isPaid: boolean;
  latePenaltyPaid: boolean;
  /** The monthly fee amount for this specific month (historical rate) */
  monthlyFeeAmount: number;
  /** The late penalty amount for this specific month (historical rate) */
  latePenaltyAmount: number;
}

export interface InvoiceDetails {
  unpaidMonths: MonthlyFee[];
  totalAmount: number;
  monthlyFee: number;
  latePenalty: number;
}
