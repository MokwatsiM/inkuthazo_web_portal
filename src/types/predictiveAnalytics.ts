/**
 * Type definitions for Predictive Analytics features
 */

import { Timestamp } from 'firebase/firestore';

// Cash Flow Forecasting
export interface ForecastDataPoint {
  month: string;
  date: Date;
  actual?: number;
  forecast: number;
  lowerBound: number; // Worst case
  upperBound: number; // Best case
  confidence: number; // 0-100
}

export interface CashFlowForecast {
  historical: ForecastDataPoint[];
  forecasted: ForecastDataPoint[];
  summary: {
    averageMonthlyInflow: number;
    averageMonthlyOutflow: number;
    projectedBalance: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    trendPercentage: number;
  };
  scenarios: {
    bestCase: number;
    expected: number;
    worstCase: number;
  };
  generatedAt: Date;
  forecastPeriodMonths: number;
}

// Member Churn Prediction
export interface ChurnRiskFactor {
  factor: string;
  score: number; // 0-100
  weight: number; // Percentage
  description: string;
}

export interface MemberChurnPrediction {
  memberId: string;
  memberName: string;
  email: string;
  phoneNumber: string;
  riskScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high';
  riskFactors: ChurnRiskFactor[];
  lastContributionDate: Date | null;
  missedPayments: number;
  latePayments: number;
  contributionDecline: number; // Percentage
  recommendations: string[];
  confidenceLevel: number; // 0-100
}

export interface ChurnAnalysis {
  totalMembers: number;
  atRiskMembers: MemberChurnPrediction[];
  riskDistribution: {
    high: number;
    medium: number;
    low: number;
  };
  averageRiskScore: number;
  estimatedChurnRate: number; // Percentage
  generatedAt: Date;
}

// Financial Health Score
export interface HealthMetric {
  name: string;
  value: number;
  score: number; // 0-100
  weight: number; // Percentage
  status: 'excellent' | 'good' | 'fair' | 'poor';
  description: string;
  recommendation?: string;
}

export interface FinancialHealthScore {
  overallScore: number; // 0-100
  status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  metrics: {
    liquidityRatio: HealthMetric;
    runwayMonths: HealthMetric;
    memberGrowthRate: HealthMetric;
    contributionGrowthRate: HealthMetric;
    claimRatio: HealthMetric;
    efficiencyRatio: HealthMetric;
  };
  historicalScores: {
    month: string;
    score: number;
    date: Date;
  }[];
  recommendations: string[];
  alerts: {
    severity: 'high' | 'medium' | 'low';
    message: string;
    metric: string;
  }[];
  generatedAt: Date;
}

// Contribution Pattern Analysis
export interface ContributionPattern {
  type: 'seasonal' | 'day-of-month' | 'payment-method' | 'amount-range';
  name: string;
  description: string;
  data: Record<string, number>;
  insights: string[];
  confidence: number; // 0-100
}

export interface MemberContributionConsistency {
  memberId: string;
  memberName: string;
  consistencyScore: number; // 0-100
  averageAmount: number;
  standardDeviation: number;
  paymentFrequency: 'regular' | 'irregular' | 'sporadic';
  preferredDay?: number;
  preferredMethod?: string;
}

export interface ContributionPatternAnalysis {
  patterns: ContributionPattern[];
  memberConsistency: MemberContributionConsistency[];
  seasonalTrends: {
    month: string;
    averageAmount: number;
    count: number;
    percentageOfAnnual: number;
  }[];
  peakPeriods: {
    period: string;
    reason?: string;
  }[];
  insights: string[];
  generatedAt: Date;
}

// Comparative Period Analysis
export interface PeriodMetrics {
  period: string;
  startDate: Date;
  endDate: Date;
  totalContributions: number;
  contributionCount: number;
  averageContribution: number;
  totalPayouts: number;
  payoutCount: number;
  netCashFlow: number;
  memberCount: number;
  newMembers: number;
  churnedMembers: number;
  activeContributors: number;
}

export interface MetricComparison {
  metric: string;
  period1Value: number;
  period2Value: number;
  absoluteChange: number;
  percentageChange: number;
  trend: 'up' | 'down' | 'stable';
  interpretation: 'positive' | 'negative' | 'neutral';
}

export interface ComparativeAnalysis {
  period1: PeriodMetrics;
  period2: PeriodMetrics;
  comparisons: MetricComparison[];
  highlights: {
    type: 'improvement' | 'decline' | 'achievement';
    metric: string;
    message: string;
  }[];
  overallTrend: 'improving' | 'declining' | 'stable';
  generatedAt: Date;
}

// Custom Report Builder
export type ReportTemplate =
  | 'monthly_financial'
  | 'member_activity'
  | 'contribution_summary'
  | 'claims_payouts'
  | 'financial_health'
  | 'custom';

export interface ReportParameter {
  key: string;
  label: string;
  type: 'date' | 'dateRange' | 'select' | 'multiSelect' | 'number' | 'boolean';
  required: boolean;
  options?: { value: string; label: string }[];
  defaultValue?: any;
}

export interface ReportSection {
  title: string;
  type: 'metric' | 'table' | 'chart' | 'text';
  data: any;
  chartType?: 'line' | 'bar' | 'pie' | 'area';
}

export interface CustomReport {
  id?: string;
  name: string;
  description?: string;
  template: ReportTemplate;
  parameters: Record<string, any>;
  sections: ReportSection[];
  generatedAt: Date;
  generatedBy: string;
}

export interface ReportConfig {
  template: ReportTemplate;
  name: string;
  description: string;
  parameters: ReportParameter[];
  defaultSections: string[];
}

// Analytics Data Sufficiency
export interface DataSufficiency {
  hasMinimumData: boolean;
  monthsOfData: number;
  minimumRequired: number;
  warnings: string[];
  recommendations: string[];
}

// Prediction Confidence
export interface PredictionConfidence {
  level: 'high' | 'medium' | 'low';
  score: number; // 0-100
  factors: {
    dataQuality: number;
    dataVolume: number;
    dataRecency: number;
    patternStability: number;
  };
  message: string;
}
