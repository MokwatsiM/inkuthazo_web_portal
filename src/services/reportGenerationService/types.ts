/**
 * Shared types for report generation
 */
import type { CashFlowForecast, ContributionPatternAnalysis, FinancialHealthScore, ComparativeAnalysis } from '../../types/predictiveAnalytics';

// ==================== TYPES ====================

export interface ReportParams {
  reportType: 'cash-flow' | 'churn' | 'health' | 'patterns' | 'comparative' | 'arrears' | 'credits' | 'custom';
  dateRange: {
    start: Date;
    end: Date;
  };
  includeCharts: boolean;
  includeMetrics: boolean;
  includeRecommendations: boolean;
  format: 'pdf' | 'excel' | 'csv';
  customMetrics?: string[];
  periodDescription?: string; // For comparative reports: e.g., "This Quarter vs Last Quarter"
  // For credit status reports: which credits to include
  creditStatusFilter?: CreditStatusFilter;
  // For comparative reports - custom period comparison
  comparisonPeriods?: {
    period1Start: Date;
    period1End: Date;
    period2Start: Date;
    period2End: Date;
  };
}

export interface MemberArrears {
  memberId: string;
  memberName: string;
  email: string;
  phoneNumber: string;
  joinDate: Date;
  lastPaymentDate: Date | null;
  monthsOwed: number;
  totalAmountOwed: number;
  unpaidMonths: {
    month: string;
    amount: number;
  }[];
}

export interface ArrearsReportData {
  members: MemberArrears[];
  totalMembersInArrears: number;
  totalAmountOwed: number;
  averageAmountOwed: number;
  generatedAt: Date;
}

/**
 * Credit status report filter.
 * - outstanding: money still owed (active or defaulted credits)
 * - settled: fully repaid credits
 * - all: both of the above (credits not yet disbursed are never included)
 */
export type CreditStatusFilter = 'all' | 'outstanding' | 'settled';

export interface MemberCreditLine {
  creditId: string;
  memberId: string;
  memberName: string;
  email: string;
  phoneNumber: string;
  reason: string;
  status: 'active' | 'defaulted' | 'settled';
  issuedDate: Date | null;
  totalAmount: number;
  totalPaid: number;
  remainingBalance: number;
  installments: number;
  installmentsPaid: number;
  lastPaymentDate: Date | null;
  settledDate: Date | null;
  overridden: boolean;
}

export interface CreditStatusReportData {
  filter: CreditStatusFilter;
  credits: MemberCreditLine[];
  outstandingCount: number;
  outstandingBalance: number;
  settledCount: number;
  settledAmount: number;
  defaultedCount: number;
  membersWithOutstanding: number;
  generatedAt: Date;
}

export interface ReportData {
  cashFlowForecast?: CashFlowForecast | null;
  contributionPatterns?: ContributionPatternAnalysis | null;
  financialHealth?: FinancialHealthScore | null;
  arrears?: ArrearsReportData | null;
  creditStatus?: CreditStatusReportData | null;
  comparativeAnalysis?: ComparativeAnalysis | null;
  // Additional report data types will be added as we implement more reports
}

