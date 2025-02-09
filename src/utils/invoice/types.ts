export interface MonthlyFee {
  month: Date;
  amount: number;
  isLate: boolean;
  isPaid: boolean;
  latePenaltyPaid: boolean;
}

export interface InvoiceDetails {
  unpaidMonths: MonthlyFee[];
  totalAmount: number;
  monthlyFee: number;
  latePenalty: number;
}
