import type { Contribution } from './contribution';
import { Payout } from './payout';

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