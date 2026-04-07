import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  CashFlowForecast,
  ChurnAnalysis,
  FinancialHealthScore,
  ContributionPatternAnalysis,
  ComparativeAnalysis,
} from '../types/predictiveAnalytics';
import {
  forecastCashFlow,
  predictMemberChurn,
  calculateFinancialHealth,
  analyzeContributionPatterns,
  comparePeriodsAnalysis,
} from '../services/predictiveAnalyticsService';
import { Contribution } from '../types/contribution';
import { Member } from '../types/index';
import { Payout } from '../types/payout';
import { Expense } from '../types/expense';
import { Claim } from '../types/claim';
import logger from '../utils/logger';

interface PredictiveAnalyticsState {
  // Data
  cashFlowForecast: CashFlowForecast | null;
  churnAnalysis: ChurnAnalysis | null;
  financialHealth: FinancialHealthScore | null;
  contributionPatterns: ContributionPatternAnalysis | null;
  comparativeAnalysis: ComparativeAnalysis | null;

  // Loading states
  isLoadingCashFlow: boolean;
  isLoadingChurn: boolean;
  isLoadingHealth: boolean;
  isLoadingPatterns: boolean;
  isLoadingComparative: boolean;

  // Error states
  cashFlowError: string | null;
  churnError: string | null;
  healthError: string | null;
  patternsError: string | null;
  comparativeError: string | null;

  // Base data
  members: Member[];
  contributions: Contribution[];
  payouts: Payout[];
  expenses: Expense[];
  claims: Claim[];
  isLoadingBaseData: boolean;
}

interface UsePredictiveAnalyticsResult extends PredictiveAnalyticsState {
  // Actions
  refreshCashFlowForecast: (months?: number) => Promise<void>;
  refreshChurnAnalysis: () => Promise<void>;
  refreshFinancialHealth: () => Promise<void>;
  refreshContributionPatterns: () => Promise<void>;
  refreshComparativeAnalysis: (
    period1Start: Date,
    period1End: Date,
    period2Start: Date,
    period2End: Date
  ) => Promise<void>;
  refreshAll: () => Promise<void>;
  refreshBaseData: () => Promise<void>;
}

export function usePredictiveAnalytics(): UsePredictiveAnalyticsResult {
  const [state, setState] = useState<PredictiveAnalyticsState>({
    cashFlowForecast: null,
    churnAnalysis: null,
    financialHealth: null,
    contributionPatterns: null,
    comparativeAnalysis: null,
    isLoadingCashFlow: false,
    isLoadingChurn: false,
    isLoadingHealth: false,
    isLoadingPatterns: false,
    isLoadingComparative: false,
    cashFlowError: null,
    churnError: null,
    healthError: null,
    patternsError: null,
    comparativeError: null,
    members: [],
    contributions: [],
    payouts: [],
    expenses: [],
    claims: [],
    isLoadingBaseData: false,
  });

  // Refresh base data
  const refreshBaseData = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoadingBaseData: true }));
    try {
      // Fetch all collections directly from Firebase
      const [membersSnapshot, contributionsSnapshot, payoutsSnapshot, expensesSnapshot, claimsSnapshot] = await Promise.all([
        getDocs(collection(db, 'members')),
        getDocs(collection(db, 'contributions')),
        getDocs(collection(db, 'payouts')),
        getDocs(collection(db, 'expenses')),
        getDocs(collection(db, 'claims')),
      ]);

      const members = membersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Member[];

      const contributions = contributionsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Contribution[];

      const payouts = payoutsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Payout[];

      const expenses = expensesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Expense[];

      const claims = claimsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Claim[];

      setState((prev) => ({
        ...prev,
        members,
        contributions,
        payouts,
        expenses,
        claims,
        isLoadingBaseData: false,
      }));
    } catch (error) {
      logger.error('Error fetching base data:', error);
      setState((prev) => ({ ...prev, isLoadingBaseData: false }));
    }
  }, []);

  // Refresh cash flow forecast
  const refreshCashFlowForecast = useCallback(
    async (months: number = 6) => {
      setState((prev) => ({ ...prev, isLoadingCashFlow: true, cashFlowError: null }));
      try {
        const forecast = await forecastCashFlow(
          state.contributions,
          state.payouts,
          state.expenses,
          months
        );
        setState((prev) => ({
          ...prev,
          cashFlowForecast: forecast,
          isLoadingCashFlow: false,
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setState((prev) => ({
          ...prev,
          cashFlowError: errorMessage,
          isLoadingCashFlow: false,
        }));
      }
    },
    [state.contributions, state.payouts, state.expenses]
  );

  // Refresh churn analysis
  const refreshChurnAnalysis = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoadingChurn: true, churnError: null }));
    try {
      const analysis = await predictMemberChurn(state.members, state.contributions);
      setState((prev) => ({
        ...prev,
        churnAnalysis: analysis,
        isLoadingChurn: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState((prev) => ({
        ...prev,
        churnError: errorMessage,
        isLoadingChurn: false,
      }));
    }
  }, [state.members, state.contributions]);

  // Refresh financial health
  const refreshFinancialHealth = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoadingHealth: true, healthError: null }));
    try {
      const health = await calculateFinancialHealth(
        state.members,
        state.contributions,
        state.payouts,
        state.expenses,
        state.claims
      );
      setState((prev) => ({
        ...prev,
        financialHealth: health,
        isLoadingHealth: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState((prev) => ({
        ...prev,
        healthError: errorMessage,
        isLoadingHealth: false,
      }));
    }
  }, [state.members, state.contributions, state.payouts, state.expenses, state.claims]);

  // Refresh contribution patterns
  const refreshContributionPatterns = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoadingPatterns: true, patternsError: null }));
    try {
      const patterns = await analyzeContributionPatterns(state.contributions, state.members);
      setState((prev) => ({
        ...prev,
        contributionPatterns: patterns,
        isLoadingPatterns: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState((prev) => ({
        ...prev,
        patternsError: errorMessage,
        isLoadingPatterns: false,
      }));
    }
  }, [state.contributions, state.members]);

  // Refresh comparative analysis
  const refreshComparativeAnalysis = useCallback(
    async (
      period1Start: Date,
      period1End: Date,
      period2Start: Date,
      period2End: Date
    ) => {
      setState((prev) => ({ ...prev, isLoadingComparative: true, comparativeError: null }));
      try {
        const analysis = await comparePeriodsAnalysis(
          period1Start,
          period1End,
          period2Start,
          period2End,
          state.contributions,
          state.payouts,
          state.expenses,
          state.members
        );
        setState((prev) => ({
          ...prev,
          comparativeAnalysis: analysis,
          isLoadingComparative: false,
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setState((prev) => ({
          ...prev,
          comparativeError: errorMessage,
          isLoadingComparative: false,
        }));
      }
    },
    [state.contributions, state.payouts, state.expenses, state.members]
  );

  // Refresh all analytics
  const refreshAll = useCallback(async () => {
    // Calculate default date ranges for comparative analysis
    // Compare last 3 months vs previous 3 months
    const now = new Date();
    const period2End = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of current month
    const period2Start = new Date(now.getFullYear(), now.getMonth() - 2, 1); // 3 months ago
    const period1End = new Date(period2Start.getTime() - 24 * 60 * 60 * 1000); // Day before period2Start
    const period1Start = new Date(period1End.getFullYear(), period1End.getMonth() - 2, 1); // 3 months before that

    await Promise.all([
      refreshCashFlowForecast(6),
      refreshChurnAnalysis(),
      refreshFinancialHealth(),
      refreshContributionPatterns(),
      refreshComparativeAnalysis(period1Start, period1End, period2Start, period2End),
    ]);
  }, [
    refreshCashFlowForecast,
    refreshChurnAnalysis,
    refreshFinancialHealth,
    refreshContributionPatterns,
    refreshComparativeAnalysis,
  ]);

  // Load base data on mount
  useEffect(() => {
    refreshBaseData();
  }, [refreshBaseData]);

  // Auto-refresh analytics when base data changes
  useEffect(() => {
    if (
      state.members.length > 0 &&
      state.contributions.length > 0 &&
      !state.isLoadingBaseData
    ) {
      refreshAll();
    }
  }, [state.members.length, state.contributions.length, state.isLoadingBaseData]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    ...state,
    refreshCashFlowForecast,
    refreshChurnAnalysis,
    refreshFinancialHealth,
    refreshContributionPatterns,
    refreshComparativeAnalysis,
    refreshAll,
    refreshBaseData,
  };
}
