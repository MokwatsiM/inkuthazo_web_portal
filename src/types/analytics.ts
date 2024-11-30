import { Timestamp } from 'firebase/firestore';

export interface ContributionAnalytics {
  totalAmount: number;
  averageAmount: number;
  contributionsByType: {
    type: string;
    amount: number;
    count: number;
  }[];
  monthlyTrends: {
    month: string;
    amount: number;
    count: number;
  }[];
}

export interface PayoutAnalytics {
  totalAmount: number;
  averageAmount: number;
  payoutsByStatus: {
    status: string;
    amount: number;
    count: number;
  }[];
  monthlyTrends: {
    month: string;
    amount: number;
    count: number;
  }[];
}

export interface MemberAnalytics {
  totalMembers: number;
  activeMembers: number;
  membersByStatus: {
    status: string;
    count: number;
  }[];
  memberGrowth: {
    month: string;
    newMembers: number;
    totalMembers: number;
  }[];
}

export interface FinancialMetrics {
  totalContributions: number;
  totalPayouts: number;
  balance: number;
  monthlyMetrics: {
    month: string;
    contributions: number;
    payouts: number;
    balance: number;
  }[];
}