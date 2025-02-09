import type { Contribution } from "./contribution";
import type { Payout } from "./payout";

export type ReportType =
  | "contributions"
  | "payouts"
  | "summary"
  | "dependants"
  | "arrears";
export type ReportPeriod = "monthly" | "quarterly" | "yearly" | "all-time";

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
