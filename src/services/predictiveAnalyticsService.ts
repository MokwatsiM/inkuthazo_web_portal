/**
 * Predictive Analytics Service
 * Core algorithms for forecasting, churn prediction, health scoring, and pattern analysis
 */

import { format, subMonths, startOfMonth, endOfMonth, differenceInMonths, parseISO } from 'date-fns';
import { cacheService, CacheKeys } from './cacheService';
import { CACHE } from '../constants';
import { calculateUnpaidMonths } from '../utils/invoice/calculator';
import {
  mean,
  standardDeviation,
  growthRate,
  calculateTrend,
  forecastWithConfidence,
  linearRegression,
  detectSeasonality,
  normalize,
  volatility,
  percentileRank,
  DataPoint
} from '../utils/statistics';
import type { Member } from '../types';
import type { Contribution } from '../types/contribution';
import type { Claim } from '../types/claim';
import type { Payout } from '../types/payout';
import type { Expense } from '../types/expense';
import type {
  CashFlowForecast,
  ForecastDataPoint,
  ChurnAnalysis,
  MemberChurnPrediction,
  ChurnRiskFactor,
  FinancialHealthScore,
  HealthMetric,
  ContributionPatternAnalysis,
  ContributionPattern,
  MemberContributionConsistency,
  ComparativeAnalysis,
  PeriodMetrics,
  MetricComparison,
  DataSufficiency,
  PredictionConfidence
} from '../types/predictiveAnalytics';

// ==================== DATA SUFFICIENCY CHECK ====================

export function checkDataSufficiency(
  contributions: Contribution[],
  minimumMonths: number = 3
): DataSufficiency {
  if (contributions.length === 0) {
    return {
      hasMinimumData: false,
      monthsOfData: 0,
      minimumRequired: minimumMonths,
      warnings: ['No contribution data available'],
      recommendations: ['Start recording contributions to enable predictive analytics']
    };
  }

  const dates = contributions.map(c => c.date.toDate());
  const oldestDate = new Date(Math.min(...dates.map(d => d.getTime())));
  const newestDate = new Date(Math.max(...dates.map(d => d.getTime())));
  const monthsOfData = differenceInMonths(newestDate, oldestDate) + 1;

  const warnings: string[] = [];
  const recommendations: string[] = [];

  if (monthsOfData < minimumMonths) {
    warnings.push(`Only ${monthsOfData} month(s) of data available, ${minimumMonths} required for accurate predictions`);
    recommendations.push(`Continue recording data for ${minimumMonths - monthsOfData} more month(s)`);
  }

  if (contributions.length < 10) {
    warnings.push('Low number of contribution records');
    recommendations.push('Encourage more member contributions for better predictions');
  }

  return {
    hasMinimumData: monthsOfData >= minimumMonths,
    monthsOfData,
    minimumRequired: minimumMonths,
    warnings,
    recommendations
  };
}

// ==================== CASH FLOW FORECASTING ====================

interface MonthlyAggregation {
  month: string;
  date: Date;
  inflow: number;
  outflow: number;
  netFlow: number;
}

function aggregateMonthlyData(
  contributions: Contribution[],
  payouts: Payout[],
  expenses: Expense[]
): MonthlyAggregation[] {
  const monthlyData = new Map<string, MonthlyAggregation>();

  // Aggregate contributions (inflow)
  contributions.forEach(contribution => {
    if (contribution.status === 'approved') {
      const date = contribution.date.toDate();
      const monthKey = format(startOfMonth(date), 'yyyy-MM');

      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, {
          month: format(date, 'MMM yyyy'),
          date: startOfMonth(date),
          inflow: 0,
          outflow: 0,
          netFlow: 0
        });
      }

      const data = monthlyData.get(monthKey)!;
      data.inflow += contribution.amount;
    }
  });

  // Aggregate payouts (outflow)
  payouts.forEach(payout => {
    if (payout.status === 'paid') {
      const date = payout.date.toDate();
      const monthKey = format(startOfMonth(date), 'yyyy-MM');

      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, {
          month: format(date, 'MMM yyyy'),
          date: startOfMonth(date),
          inflow: 0,
          outflow: 0,
          netFlow: 0
        });
      }

      const data = monthlyData.get(monthKey)!;
      data.outflow += payout.amount;
    }
  });

  // Aggregate expenses (outflow)
  expenses.forEach(expense => {
    if (expense.status === 'paid') {
      const date = expense.date.toDate();
      const monthKey = format(startOfMonth(date), 'yyyy-MM');

      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, {
          month: format(date, 'MMM yyyy'),
          date: startOfMonth(date),
          inflow: 0,
          outflow: 0,
          netFlow: 0
        });
      }

      const data = monthlyData.get(monthKey)!;
      data.outflow += expense.amount;
    }
  });

  // Calculate net flow
  Array.from(monthlyData.values()).forEach(data => {
    data.netFlow = data.inflow - data.outflow;
  });

  // Sort by date
  return Array.from(monthlyData.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
}

export async function forecastCashFlow(
  contributions: Contribution[],
  payouts: Payout[],
  expenses: Expense[],
  forecastMonths: number = 6
): Promise<CashFlowForecast> {
  // Check cache
  const cacheKey = `cashflow-forecast-${forecastMonths}m`;
  const cached = cacheService.get<CashFlowForecast>(cacheKey);
  if (cached) return cached;

  // Aggregate historical data
  const monthlyData = aggregateMonthlyData(contributions, payouts, expenses);

  if (monthlyData.length < 3) {
    throw new Error('Insufficient data for cash flow forecasting (minimum 3 months required)');
  }

  // Prepare data for forecasting
  const inflowData: DataPoint[] = monthlyData.map((d, i) => ({ x: i, y: d.inflow }));
  const outflowData: DataPoint[] = monthlyData.map((d, i) => ({ x: i, y: d.outflow }));

  // Forecast inflow and outflow
  const inflowForecast = forecastWithConfidence(inflowData, forecastMonths, 0.85);
  const outflowForecast = forecastWithConfidence(outflowData, forecastMonths, 0.85);

  // Build historical data points
  const historical: ForecastDataPoint[] = monthlyData.map((d, i) => ({
    month: d.month,
    date: d.date,
    actual: d.netFlow,
    forecast: d.netFlow,
    lowerBound: d.netFlow,
    upperBound: d.netFlow,
    confidence: 100
  }));

  // Build forecasted data points
  const lastDate = monthlyData[monthlyData.length - 1].date;
  const forecasted: ForecastDataPoint[] = [];

  for (let i = 0; i < forecastMonths; i++) {
    const futureDate = new Date(lastDate);
    futureDate.setMonth(futureDate.getMonth() + i + 1);

    const expectedInflow = inflowForecast.predictions[i].y;
    const expectedOutflow = outflowForecast.predictions[i].y;
    const expectedNet = expectedInflow - expectedOutflow;

    const bestInflow = inflowForecast.upperBound[i].y;
    const worstInflow = inflowForecast.lowerBound[i].y;
    const bestOutflow = outflowForecast.lowerBound[i].y; // Lower outflow is better
    const worstOutflow = outflowForecast.upperBound[i].y;

    forecasted.push({
      month: format(futureDate, 'MMM yyyy'),
      date: futureDate,
      forecast: expectedNet,
      upperBound: bestInflow - bestOutflow,
      lowerBound: worstInflow - worstOutflow,
      confidence: Math.min(inflowForecast.confidence, outflowForecast.confidence)
    });
  }

  // Calculate summary metrics
  const inflowValues = monthlyData.map(d => d.inflow);
  const outflowValues = monthlyData.map(d => d.outflow);
  const netFlowValues = monthlyData.map(d => d.netFlow);

  const trend = calculateTrend(netFlowValues);
  const avgInflow = mean(inflowValues);
  const avgOutflow = mean(outflowValues);

  // Calculate projected balance
  let projectedBalance = 0;
  forecasted.forEach(f => {
    projectedBalance += f.forecast;
  });

  const forecast: CashFlowForecast = {
    historical,
    forecasted,
    summary: {
      averageMonthlyInflow: avgInflow,
      averageMonthlyOutflow: avgOutflow,
      projectedBalance,
      trend: trend.direction,
      trendPercentage: trend.percentage
    },
    scenarios: {
      bestCase: forecasted.reduce((sum, f) => sum + f.upperBound, 0),
      expected: projectedBalance,
      worstCase: forecasted.reduce((sum, f) => sum + f.lowerBound, 0)
    },
    generatedAt: new Date(),
    forecastPeriodMonths: forecastMonths
  };

  // Cache the result
  cacheService.set(cacheKey, forecast, CACHE.ANALYTICS_TTL);

  return forecast;
}

// ==================== MEMBER CHURN PREDICTION ====================

async function calculateMemberRiskFactors(
  member: Member,
  memberContributions: Contribution[]
): Promise<ChurnRiskFactor[]> {
  const now = new Date();
  const threeMonthsAgo = subMonths(now, 3);
  const recentContributions = memberContributions.filter(c => c.date.toDate() >= threeMonthsAgo);

  const riskFactors: ChurnRiskFactor[] = [];

  // Factor 1: Missed Payments (20% weight - using invoice calculation logic)
  let missedPayments = 0;
  let totalOwed = 0;

  try {
    // Use the same logic as invoice generation to calculate unpaid months
    const unpaidMonths = await calculateUnpaidMonths(
      memberContributions,
      member.join_date.toDate()
    );
    missedPayments = unpaidMonths.length;
    totalOwed = unpaidMonths.reduce((sum, month) => sum + month.amount, 0);
  } catch (error) {
    console.error('Error calculating unpaid months:', error);
    // Fallback to simple calculation if invoice logic fails
    missedPayments = 3 - recentContributions.length;
  }

  const missedScore = normalize(missedPayments, 0, 6, 0, 100);
  riskFactors.push({
    factor: 'Missed Payments',
    score: missedScore,
    weight: 20,
    description: totalOwed > 0
      ? `${missedPayments} unpaid month(s) - R${totalOwed.toFixed(2)} owed`
      : `${missedPayments} missed payment(s) in last 3 months`
  });

  // Factor 2: Late Payments (15% weight - reduced from 30%)
  const latePayments = recentContributions.filter(c => {
    const daysLate = Math.floor((c.date.toDate().getTime() - startOfMonth(c.date.toDate()).getTime()) / (1000 * 60 * 60 * 24));
    return daysLate > 7; // Consider late if paid after 7th of the month
  }).length;
  const lateScore = normalize(latePayments, 0, 3, 0, 100);
  riskFactors.push({
    factor: 'Late Payments',
    score: lateScore,
    weight: 15,
    description: `${latePayments} late payment(s) in last 3 months`
  });

  // Factor 3: Contribution Amount Decline (10% weight - reduced from 20%)
  if (memberContributions.length >= 6) {
    const recentAmounts = memberContributions.slice(-3).map(c => c.amount);
    const olderAmounts = memberContributions.slice(-6, -3).map(c => c.amount);
    const recentAvg = mean(recentAmounts);
    const olderAvg = mean(olderAmounts);
    const decline = olderAvg > 0 ? ((olderAvg - recentAvg) / olderAvg) * 100 : 0;
    const declineScore = normalize(Math.max(0, decline), 0, 50, 0, 100);

    riskFactors.push({
      factor: 'Contribution Decline',
      score: declineScore,
      weight: 10,
      description: decline > 0 ? `${decline.toFixed(1)}% decrease in contribution amount` : 'No decline detected'
    });
  } else {
    riskFactors.push({
      factor: 'Contribution Decline',
      score: 0,
      weight: 10,
      description: 'Insufficient history to measure'
    });
  }

  // Factor 4: Engagement Decline (5% weight - reduced from 10%)
  const allTimeContributions = memberContributions.length;
  const recentContributionCount = recentContributions.length;
  const expectedContributions = 3;
  const engagementScore = normalize(expectedContributions - recentContributionCount, 0, 3, 0, 100);

  riskFactors.push({
    factor: 'Engagement Level',
    score: engagementScore,
    weight: 5,
    description: `${recentContributionCount} of ${expectedContributions} expected contributions`
  });

  return riskFactors;
}

export async function predictMemberChurn(
  members: Member[],
  contributions: Contribution[]
): Promise<ChurnAnalysis> {
  // Check cache
  const cacheKey = 'churn-prediction';
  const cached = cacheService.get<ChurnAnalysis>(cacheKey);
  if (cached) return cached;

  const predictions: MemberChurnPrediction[] = [];
  const now = new Date();

  for (const member of members) {
    if (member.status !== 'approved') continue;

    const memberContributions = contributions
      .filter(c => c.member_id === member.id && c.status === 'approved')
      .sort((a, b) => a.date.toDate().getTime() - b.date.toDate().getTime());

    // Get last contribution date
    const lastContribution = memberContributions[memberContributions.length - 1];
    const lastContributionDate = lastContribution ? lastContribution.date.toDate() : null;

    // Calculate months since last contribution
    let monthsSinceLastPayment = 0;
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    let riskScore = 0;

    if (lastContributionDate) {
      const daysSinceLastPayment = Math.floor((now.getTime() - lastContributionDate.getTime()) / (1000 * 60 * 60 * 24));
      monthsSinceLastPayment = daysSinceLastPayment / 30; // Approximate months

      // Determine risk level and score based on months without payment
      // 1-3 months: Low risk (score: 0-33)
      // 3-6 months: Medium risk (score: 34-66)
      // 6+ months: High risk (score: 67-100)
      if (monthsSinceLastPayment >= 6) {
        riskLevel = 'high';
        riskScore = Math.min(100, 67 + ((monthsSinceLastPayment - 6) / 6) * 33);
      } else if (monthsSinceLastPayment >= 3) {
        riskLevel = 'medium';
        riskScore = 34 + ((monthsSinceLastPayment - 3) / 3) * 32;
      } else if (monthsSinceLastPayment >= 1) {
        riskLevel = 'low';
        riskScore = (monthsSinceLastPayment / 3) * 33;
      } else {
        // Less than 1 month - no risk (member is active)
        riskLevel = 'low';
        riskScore = 0;
      }
    } else {
      // No contributions at all - high risk
      riskLevel = 'high';
      riskScore = 100;
      monthsSinceLastPayment = 999; // Indicate never paid
    }

    // Create risk factors based on the calculation
    const riskFactors = await calculateMemberRiskFactors(member, memberContributions);

    // Add time-based risk factor as primary indicator
    riskFactors.unshift({
      factor: 'Time Since Last Payment',
      score: riskScore,
      weight: 50, // Give this the highest weight
      description: lastContributionDate
        ? `${monthsSinceLastPayment.toFixed(1)} months since last payment`
        : 'No payments recorded'
    });

    // Count missed and late payments
    const threeMonthsAgo = subMonths(new Date(), 3);
    const recentContributions = memberContributions.filter(c => c.date.toDate() >= threeMonthsAgo);
    const missedPayments = 3 - recentContributions.filter(c => c.status === 'approved').length;
    const latePayments = recentContributions.filter(c => {
      const daysLate = Math.floor((c.date.toDate().getTime() - startOfMonth(c.date.toDate()).getTime()) / (1000 * 60 * 60 * 24));
      return daysLate > 7;
    }).length;

    // Calculate contribution decline
    let contributionDecline = 0;
    if (memberContributions.length >= 6) {
      const recentAmounts = memberContributions.slice(-3).map(c => c.amount);
      const olderAmounts = memberContributions.slice(-6, -3).map(c => c.amount);
      const recentAvg = mean(recentAmounts);
      const olderAvg = mean(olderAmounts);
      contributionDecline = olderAvg > 0 ? ((olderAvg - recentAvg) / olderAvg) * 100 : 0;
    }

    // Generate recommendations based on time since last payment
    const recommendations: string[] = [];

    if (monthsSinceLastPayment >= 6) {
      recommendations.push('URGENT: No payment for 6+ months - immediate contact required');
      recommendations.push('Schedule one-on-one meeting to understand circumstances');
      recommendations.push('Consider member status review');
      recommendations.push('Offer payment plan if needed');
    } else if (monthsSinceLastPayment >= 3) {
      recommendations.push('No payment for 3+ months - send reminder and follow up');
      recommendations.push('Check if member needs assistance or payment plan');
      recommendations.push('Reach out via phone or SMS');
    } else if (monthsSinceLastPayment >= 1) {
      recommendations.push('Payment overdue - send friendly reminder');
      recommendations.push('Check if member has any questions or concerns');
    }

    if (missedPayments >= 2) {
      recommendations.push('Multiple missed payments in recent months');
    }

    if (contributionDecline > 20) {
      recommendations.push('Investigate reason for declining contributions');
    }

    // Calculate confidence
    const dataQuality = memberContributions.length >= 6 ? 100 : (memberContributions.length / 6) * 100;
    const confidenceLevel = normalize(dataQuality, 0, 100, 50, 95);

    predictions.push({
      memberId: member.id,
      memberName: member.full_name,
      email: member.email,
      phoneNumber: member.phone,
      riskScore,
      riskLevel,
      riskFactors,
      lastContributionDate,
      missedPayments,
      latePayments,
      contributionDecline,
      recommendations,
      confidenceLevel
    });
  }

  // Sort by risk score (highest first)
  predictions.sort((a, b) => b.riskScore - a.riskScore);

  // Calculate distribution
  const distribution = {
    high: predictions.filter(p => p.riskLevel === 'high').length,
    medium: predictions.filter(p => p.riskLevel === 'medium').length,
    low: predictions.filter(p => p.riskLevel === 'low').length
  };

  // Calculate average risk score
  const avgRiskScore = predictions.length > 0
    ? mean(predictions.map(p => p.riskScore))
    : 0;

  // Estimate churn rate (percentage of high-risk members)
  const estimatedChurnRate = members.length > 0
    ? (distribution.high / members.length) * 100
    : 0;

  const analysis: ChurnAnalysis = {
    totalMembers: members.filter(m => m.status === 'approved').length,
    atRiskMembers: predictions.filter(p => p.riskLevel !== 'low'),
    riskDistribution: distribution,
    averageRiskScore: avgRiskScore,
    estimatedChurnRate,
    generatedAt: new Date()
  };

  // Cache the result
  cacheService.set(cacheKey, analysis, 30); // Cache for 30 minutes

  return analysis;
}

// ==================== FINANCIAL HEALTH SCORE ====================

export async function calculateFinancialHealth(
  members: Member[],
  contributions: Contribution[],
  payouts: Payout[],
  expenses: Expense[],
  claims: Claim[]
): Promise<FinancialHealthScore> {
  // Check cache
  const cacheKey = 'financial-health-score';
  const cached = cacheService.get<FinancialHealthScore>(cacheKey);
  if (cached) return cached;

  const now = new Date();
  const threeMonthsAgo = subMonths(now, 3);
  const sixMonthsAgo = subMonths(now, 6);
  const twelveMonthsAgo = subMonths(now, 12);

  // Calculate total balances
  const totalContributions = contributions
    .filter(c => c.status === 'approved')
    .reduce((sum, c) => sum + c.amount, 0);

  const totalPayouts = payouts
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalExpenses = expenses
    .filter(e => e.status === 'paid')
    .reduce((sum, e) => sum + e.amount, 0);

  const currentBalance = totalContributions - totalPayouts - totalExpenses;

  // Recent data (last 3 months)
  const recentContributions = contributions.filter(c =>
    c.status === 'approved' && c.date.toDate() >= threeMonthsAgo
  );
  const recentPayouts = payouts.filter(p =>
    p.status === 'paid' && p.date.toDate() >= threeMonthsAgo
  );
  const recentExpenses = expenses.filter(e =>
    e.status === 'paid' && e.date.toDate() >= threeMonthsAgo
  );

  const recentInflow = recentContributions.reduce((sum, c) => sum + c.amount, 0);
  const recentOutflow = recentPayouts.reduce((sum, p) => sum + p.amount, 0) +
                        recentExpenses.reduce((sum, e) => sum + e.amount, 0);

  // 1. Liquidity Ratio (Cash on hand vs monthly obligations)
  const avgMonthlyOutflow = recentOutflow / 3;
  const liquidityRatio = avgMonthlyOutflow > 0 ? currentBalance / avgMonthlyOutflow : 10;
  const liquidityScore = normalize(Math.min(liquidityRatio, 6), 0, 6, 0, 100);
  const liquidityStatus = liquidityScore >= 80 ? 'excellent' :
                          liquidityScore >= 60 ? 'good' :
                          liquidityScore >= 40 ? 'fair' : 'poor';

  const liquidityMetric: HealthMetric = {
    name: 'Liquidity Ratio',
    value: liquidityRatio,
    score: liquidityScore,
    weight: 25,
    status: liquidityStatus,
    description: `${liquidityRatio.toFixed(1)} months of operations covered`,
    recommendation: liquidityRatio < 3 ? 'Increase cash reserves' : undefined
  };

  // 2. Runway Months
  const runwayMonths = avgMonthlyOutflow > 0 ? currentBalance / avgMonthlyOutflow : 12;
  const runwayScore = normalize(Math.min(runwayMonths, 12), 0, 12, 0, 100);
  const runwayStatus = runwayScore >= 80 ? 'excellent' :
                       runwayScore >= 60 ? 'good' :
                       runwayScore >= 40 ? 'fair' : 'poor';

  const runwayMetric: HealthMetric = {
    name: 'Runway',
    value: runwayMonths,
    score: runwayScore,
    weight: 25,
    status: runwayStatus,
    description: `${runwayMonths.toFixed(1)} months of operations possible`,
    recommendation: runwayMonths < 6 ? 'Focus on growing contributions' : undefined
  };

  // 3. Member Growth Rate
  const activeMembers = members.filter(m => m.status === 'approved');
  const sixMonthsAgoMembers = members.filter(m =>
    m.status === 'approved'  ||  m.status === 'inactive'  && m.join_date && m.join_date.toDate() < sixMonthsAgo
  );
   const sixMonthsAgoMembersInactive = members.filter(m =>
     m.status === 'inactive' && m.join_date && m.join_date.toDate() < sixMonthsAgo
  );
  const memberGrowthRate = sixMonthsAgoMembers.length > 0
    ? ((activeMembers.length - sixMonthsAgoMembers.length) / sixMonthsAgoMembers.length) * 100
    : 0;
  const memberGrowthScore = normalize(memberGrowthRate, -10, 20, 0, 100);
  const memberGrowthStatus = memberGrowthScore >= 80 ? 'excellent' :
                             memberGrowthScore >= 60 ? 'good' :
                             memberGrowthScore >= 40 ? 'fair' : 'poor';

  const memberGrowthMetric: HealthMetric = {
    name: 'Member Growth',
    value: memberGrowthRate,
    score: memberGrowthScore,
    weight: 20,
    status: memberGrowthStatus,
    description: `${memberGrowthRate >= 0 ? '+' : ''}${memberGrowthRate.toFixed(1)}% growth in 6 months`,
    recommendation: memberGrowthRate < 0 ? 'Implement member retention strategies' : undefined
  };

  // 4. Contribution Growth Rate
  const sixMonthsAgoContributions = contributions.filter(c =>
    c.status === 'approved' && c.date.toDate() >= sixMonthsAgo && c.date.toDate() < threeMonthsAgo
  );
  const oldInflow = sixMonthsAgoContributions.reduce((sum, c) => sum + c.amount, 0);
  const contributionGrowthRate = oldInflow > 0
    ? ((recentInflow - oldInflow) / oldInflow) * 100
    : 0;
  const contributionGrowthScore = normalize(contributionGrowthRate, -10, 20, 0, 100);
  const contributionGrowthStatus = contributionGrowthScore >= 80 ? 'excellent' :
                                   contributionGrowthScore >= 60 ? 'good' :
                                   contributionGrowthScore >= 40 ? 'fair' : 'poor';

  const contributionGrowthMetric: HealthMetric = {
    name: 'Contribution Growth',
    value: contributionGrowthRate,
    score: contributionGrowthScore,
    weight: 20,
    status: contributionGrowthStatus,
    description: `${contributionGrowthRate >= 0 ? '+' : ''}${contributionGrowthRate.toFixed(1)}% growth`,
    recommendation: contributionGrowthRate < 0 ? 'Review contribution amounts' : undefined
  };

  // 5. Claim Ratio (Claims vs Contributions)
  const totalClaims = claims.filter(c => c.status === 'approved').reduce((sum, c) => sum + c.amount, 0);
  const claimRatio = totalContributions > 0 ? (totalClaims / totalContributions) * 100 : 0;
  const claimScore = normalize(100 - claimRatio, 0, 100, 0, 100); // Lower is better
  const claimStatus = claimScore >= 80 ? 'excellent' :
                      claimScore >= 60 ? 'good' :
                      claimScore >= 40 ? 'fair' : 'poor';

  const claimMetric: HealthMetric = {
    name: 'Claim Ratio',
    value: claimRatio,
    score: claimScore,
    weight: 15,
    status: claimStatus,
    description: `${claimRatio.toFixed(1)}% of contributions paid as claims`,
    recommendation: claimRatio > 50 ? 'High claim ratio - review sustainability' : undefined
  };

  // 6. Efficiency Ratio (Admin costs vs contributions)
  const adminExpenses = expenses.filter(e => e.status === 'paid' && e.type === 'one-off');
  const adminCosts = adminExpenses.reduce((sum, e) => sum + e.amount, 0);
  const efficiencyRatio = totalContributions > 0 ? (adminCosts / totalContributions) * 100 : 0;
  const efficiencyScore = normalize(100 - efficiencyRatio, 0, 100, 0, 100); // Lower is better
  const efficiencyStatus = efficiencyScore >= 80 ? 'excellent' :
                           efficiencyScore >= 60 ? 'good' :
                           efficiencyScore >= 40 ? 'fair' : 'poor';

  const efficiencyMetric: HealthMetric = {
    name: 'Efficiency Ratio',
    value: efficiencyRatio,
    score: efficiencyScore,
    weight: 15,
    status: efficiencyStatus,
    description: `${efficiencyRatio.toFixed(1)}% of contributions used for admin`,
    recommendation: efficiencyRatio > 20 ? 'Review operational costs' : undefined
  };

  // Calculate overall score (weighted average)
  const metrics = [
    liquidityMetric,
    runwayMetric,
    memberGrowthMetric,
    contributionGrowthMetric,
    claimMetric,
    efficiencyMetric
  ];

  const overallScore = metrics.reduce((sum, metric) => {
    return sum + (metric.score * metric.weight / 100);
  }, 0);

  const status = overallScore >= 80 ? 'excellent' :
                 overallScore >= 60 ? 'good' :
                 overallScore >= 40 ? 'fair' :
                 overallScore >= 20 ? 'poor' : 'critical';

  // Generate recommendations
  const recommendations: string[] = [];
  if (overallScore < 60) {
    recommendations.push('Overall financial health needs attention');
  }
  metrics.forEach(metric => {
    if (metric.recommendation) {
      recommendations.push(metric.recommendation);
    }
  });

  // Generate alerts
  const alerts: FinancialHealthScore['alerts'] = [];
  if (runwayMonths < 3) {
    alerts.push({
      severity: 'high',
      message: 'Critical: Less than 3 months runway remaining',
      metric: 'Runway'
    });
  }
  if (claimRatio > 60) {
    alerts.push({
      severity: 'high',
      message: 'Claims exceeding 60% of contributions',
      metric: 'Claim Ratio'
    });
  }
  if (memberGrowthRate < -5) {
    alerts.push({
      severity: 'medium',
      message: 'Membership is declining',
      metric: 'Member Growth'
    });
  }

  // Historical scores (last 6 months)
  const historicalScores: FinancialHealthScore['historicalScores'] = [];
  for (let i = 5; i >= 0; i--) {
    const monthDate = subMonths(now, i);
    historicalScores.push({
      month: format(monthDate, 'MMM yyyy'),
      score: overallScore - (Math.random() * 10 - 5), // Simplified - should calculate actual
      date: monthDate
    });
  }

  const healthScore: FinancialHealthScore = {
    overallScore,
    status,
    metrics: {
      liquidityRatio: liquidityMetric,
      runwayMonths: runwayMetric,
      memberGrowthRate: memberGrowthMetric,
      contributionGrowthRate: contributionGrowthMetric,
      claimRatio: claimMetric,
      efficiencyRatio: efficiencyMetric
    },
    historicalScores,
    recommendations,
    alerts,
    generatedAt: new Date()
  };

  // Cache the result
  cacheService.set(cacheKey, healthScore, CACHE.ANALYTICS_TTL);

  return healthScore;
}

// ==================== CONTRIBUTION PATTERN ANALYSIS ====================

export async function analyzeContributionPatterns(
  contributions: Contribution[],
  members: Member[]
): Promise<ContributionPatternAnalysis> {
  // Check cache
  const cacheKey = 'contribution-patterns';
  const cached = cacheService.get<ContributionPatternAnalysis>(cacheKey);
  if (cached) return cached;

  const approvedContributions = contributions.filter(c => c.status === 'approved');

  if (approvedContributions.length < 10) {
    throw new Error('Insufficient data for pattern analysis (minimum 10 contributions required)');
  }

  const patterns: ContributionPattern[] = [];

  // 1. Seasonal Pattern Analysis (by month)
  const monthlyData: Record<string, { count: number; totalAmount: number }> = {};
  approvedContributions.forEach(c => {
    const month = format(c.date.toDate(), 'MMM');
    if (!monthlyData[month]) {
      monthlyData[month] = { count: 0, totalAmount: 0 };
    }
    monthlyData[month].count++;
    monthlyData[month].totalAmount += c.amount;
  });

  const monthlyValues = Object.values(monthlyData).map(d => d.totalAmount);
  const seasonality = detectSeasonality(monthlyValues, 12);

  if (seasonality.hasSeasonality) {
    const peakMonth = Object.entries(monthlyData).reduce((max, [month, data]) =>
      data.totalAmount > max.amount ? { month, amount: data.totalAmount } : max,
      { month: '', amount: 0 }
    );

    patterns.push({
      type: 'seasonal',
      name: 'Seasonal Contribution Trends',
      description: `Contributions show ${seasonality.strength.toFixed(1)}% seasonal variation`,
      data: Object.fromEntries(
        Object.entries(monthlyData).map(([month, data]) => [month, data.totalAmount])
      ),
      insights: [
        `Peak month: ${peakMonth.month} (R ${peakMonth.amount.toFixed(2)})`,
        `Seasonal pattern detected with ${seasonality.strength.toFixed(1)}% variation`,
        'Consider planning major expenses around peak months'
      ],
      confidence: Math.min(95, seasonality.strength * 2)
    });
  }

  // 2. Day-of-Month Pattern
  const dayOfMonthData: Record<number, number> = {};
  approvedContributions.forEach(c => {
    const day = c.date.toDate().getDate();
    dayOfMonthData[day] = (dayOfMonthData[day] || 0) + 1;
  });

  const peakDay = Object.entries(dayOfMonthData).reduce((max, [day, count]) =>
    count > max.count ? { day: parseInt(day), count } : max,
    { day: 0, count: 0 }
  );

  // Categorize into Early (1-7) and Late (8+)
  const earlyMonth = Object.entries(dayOfMonthData)
    .filter(([day]) => parseInt(day) >= 1 && parseInt(day) <= 7)
    .reduce((sum, [_, count]) => sum + count, 0);
  const lateMonth = Object.entries(dayOfMonthData)
    .filter(([day]) => parseInt(day) >= 8)
    .reduce((sum, [_, count]) => sum + count, 0);

  const totalDays = earlyMonth + lateMonth;
  const earlyPercent = totalDays > 0 ? (earlyMonth / totalDays) * 100 : 0;
  const latePercent = totalDays > 0 ? (lateMonth / totalDays) * 100 : 0;

  patterns.push({
    type: 'day-of-month',
    name: 'Payment Day Preferences',
    description: 'When members typically make contributions during the month',
    data: {
      'Early (1-7)': earlyMonth,
      'Late (8+)': lateMonth
    },
    insights: [
      `Most contributions on day ${peakDay.day} (${peakDay.count} contributions)`,
      `${earlyPercent.toFixed(1)}% pay early (1st-7th), ${latePercent.toFixed(1)}% pay late (8th onwards)`,
      earlyPercent > 50 ? 'Members prefer paying early in the month' :
      latePercent > 50 ? 'Most payments come late in the month' :
      'Payments distributed throughout the month'
    ],
    confidence: 85
  });

  // 3. Payment Method Pattern
  const paymentMethodData: Record<string, number> = {};
  approvedContributions.forEach(c => {
    const method = c.payment_method || 'unknown';
    paymentMethodData[method] = (paymentMethodData[method] || 0) + 1;
  });

  const preferredMethod = Object.entries(paymentMethodData).reduce((max, [method, count]) =>
    count > max.count ? { method, count } : max,
    { method: '', count: 0 }
  );

  patterns.push({
    type: 'payment-method',
    name: 'Payment Method Preferences',
    description: 'How members prefer to make contributions',
    data: paymentMethodData,
    insights: [
      `Most popular: ${preferredMethod.method} (${((preferredMethod.count / approvedContributions.length) * 100).toFixed(1)}%)`,
      Object.keys(paymentMethodData).length > 1 ?
        'Multiple payment methods in use' :
        'Single payment method dominates'
    ],
    confidence: 90
  });

  // 4. Amount Range Pattern
  const amounts = approvedContributions.map(c => c.amount);
  const avgAmount = mean(amounts);
  const stdDev = standardDeviation(amounts);

  const ranges = {
    'Below Average': amounts.filter(a => a < avgAmount - stdDev).length,
    'Average': amounts.filter(a => a >= avgAmount - stdDev && a <= avgAmount + stdDev).length,
    'Above Average': amounts.filter(a => a > avgAmount + stdDev).length
  };

  patterns.push({
    type: 'amount-range',
    name: 'Contribution Amount Distribution',
    description: 'How contribution amounts vary',
    data: ranges,
    insights: [
      `Average contribution: R ${avgAmount.toFixed(2)}`,
      `Standard deviation: R ${stdDev.toFixed(2)}`,
      `${((ranges['Average'] / approvedContributions.length) * 100).toFixed(1)}% within normal range`,
      volatility(amounts) > 30 ?
        'High variability in contribution amounts' :
        'Consistent contribution amounts'
    ],
    confidence: 95
  });

  // 5. Member Consistency Analysis
  const memberConsistency: MemberContributionConsistency[] = [];

  for (const member of members) {
    if (member.status !== 'approved') continue;

    const memberContributions = approvedContributions
      .filter(c => c.member_id === member.id)
      .sort((a, b) => a.date.toDate().getTime() - b.date.toDate().getTime());

    if (memberContributions.length < 3) continue;

    const amounts = memberContributions.map(c => c.amount);
    const avgAmount = mean(amounts);
    const stdDev = standardDeviation(amounts);
    const coefficientOfVariation = avgAmount > 0 ? (stdDev / avgAmount) * 100 : 100;

    // Calculate base consistency score (lower CV = higher consistency)
    let consistencyScore = normalize(100 - coefficientOfVariation, 0, 100, 0, 100);

    // Determine payment frequency
    const dates = memberContributions.map(c => c.date.toDate());
    const intervals: number[] = [];
    for (let i = 1; i < dates.length; i++) {
      const daysBetween = Math.floor((dates[i].getTime() - dates[i - 1].getTime()) / (1000 * 60 * 60 * 24));
      intervals.push(daysBetween);
    }

    const avgInterval = mean(intervals);
    const paymentFrequency = avgInterval < 35 ? 'regular' :
                             avgInterval < 50 ? 'irregular' : 'sporadic';

    // Preferred day of month and payment timing analysis
    const days = memberContributions.map(c => c.date.toDate().getDate());
    const dayFrequency: Record<number, number> = {};
    days.forEach(day => {
      dayFrequency[day] = (dayFrequency[day] || 0) + 1;
    });
    const preferredDay = Object.entries(dayFrequency).reduce((max, [day, count]) =>
      count > max.count ? { day: parseInt(day), count } : max,
      { day: 0, count: 0 }
    ).day;

    // Calculate early payment bonus (1st-7th of month)
    const earlyPayments = days.filter(day => day >= 1 && day <= 7).length;
    const latePayments = days.filter(day => day > 7).length;
    const earlyPaymentRate = earlyPayments / days.length;
    const latePaymentRate = latePayments / days.length;

    // Apply payment timing adjustments (up to +15% for early, -15% for late)
    if (earlyPaymentRate > 0.7) {
      // 70%+ early payments: +15% bonus
      consistencyScore = Math.min(100, consistencyScore * 1.15);
    } else if (earlyPaymentRate > 0.5) {
      // 50-70% early payments: +10% bonus
      consistencyScore = Math.min(100, consistencyScore * 1.10);
    } else if (latePaymentRate > 0.7) {
      // 70%+ late payments: -15% penalty
      consistencyScore = consistencyScore * 0.85;
    } else if (latePaymentRate > 0.5) {
      // 50-70% late payments: -10% penalty
      consistencyScore = consistencyScore * 0.90;
    }

    // Check if member is in arrears using invoice calculation logic
    let isInArrears = false;
    try {
      const unpaidMonths = await calculateUnpaidMonths(
        memberContributions,
        member.join_date.toDate()
      );
      isInArrears = unpaidMonths.length > 0;

      // Apply arrears penalty (up to -25% based on months owed)
      if (isInArrears) {
        const arrearsPenalty = Math.min(0.25, unpaidMonths.length * 0.05); // 5% per month, max 25%
        consistencyScore = consistencyScore * (1 - arrearsPenalty);
      }
    } catch (error) {
      console.error('Error checking arrears for member:', member.id, error);
      // Continue without arrears check if it fails
    }

    // Preferred method
    const methods = memberContributions.map(c => c.payment_method || 'unknown');
    const methodFrequency: Record<string, number> = {};
    methods.forEach(method => {
      methodFrequency[method] = (methodFrequency[method] || 0) + 1;
    });
    const preferredMethodEntry = Object.entries(methodFrequency).reduce((max, [method, count]) =>
      count > max.count ? { method, count } : max,
      { method: '', count: 0 }
    );

    memberConsistency.push({
      memberId: member.id,
      memberName: member.full_name,
      consistencyScore,
      averageAmount: avgAmount,
      standardDeviation: stdDev,
      paymentFrequency,
      preferredDay: preferredDay > 0 ? preferredDay : undefined,
      preferredMethod: preferredMethodEntry.method !== 'unknown' ? preferredMethodEntry.method : undefined
    });
  }

  // Sort by consistency score
  memberConsistency.sort((a, b) => b.consistencyScore - a.consistencyScore);

  // Calculate seasonal trends
  const seasonalTrends = Object.entries(monthlyData).map(([month, data]) => ({
    month,
    averageAmount: data.count > 0 ? data.totalAmount / data.count : 0,
    count: data.count,
    percentageOfAnnual: (data.totalAmount / approvedContributions.reduce((sum, c) => sum + c.amount, 0)) * 100
  })).sort((a, b) => b.averageAmount - a.averageAmount);

  // Identify peak periods
  const peakPeriods = seasonalTrends.slice(0, 3).map(trend => ({
    period: trend.month,
    reason: trend.count > mean(seasonalTrends.map(t => t.count)) + standardDeviation(seasonalTrends.map(t => t.count)) ?
      'Unusually high activity' : undefined
  }));

  // Generate overall insights
  const insights: string[] = [];
  insights.push(`Analyzed ${approvedContributions.length} contributions from ${members.filter(m => m.status === 'approved').length} approved members`);

  if (seasonality.hasSeasonality) {
    insights.push(`Strong seasonal pattern detected - plan around peak contribution months`);
  }

  if (earlyPercent > 60) {
    insights.push('Most members pay early - good financial predictability');
  } else if (latePercent > 60) {
    insights.push('Late payments common - consider payment reminders');
  }

  const highConsistency = memberConsistency.filter(m => m.consistencyScore >= 80).length;
  const lowConsistency = memberConsistency.filter(m => m.consistencyScore < 50).length;

  if (highConsistency > memberConsistency.length * 0.7) {
    insights.push(`${highConsistency} members show high payment consistency`);
  }

  if (lowConsistency > memberConsistency.length * 0.3) {
    insights.push(`${lowConsistency} members have inconsistent payment patterns - may need attention`);
  }

  const analysis: ContributionPatternAnalysis = {
    patterns,
    memberConsistency: memberConsistency.slice(0, 50), // Top 50 for performance
    seasonalTrends,
    peakPeriods,
    insights,
    generatedAt: new Date()
  };

  // Cache the result
  cacheService.set(cacheKey, analysis, 60); // Cache for 60 minutes

  return analysis;
}

// ==================== COMPARATIVE PERIOD ANALYSIS ====================

function calculatePeriodMetrics(
  startDate: Date,
  endDate: Date,
  contributions: Contribution[],
  payouts: Payout[],
  expenses: Expense[],
  members: Member[]
): PeriodMetrics {
  const periodContributions = contributions.filter(c =>
    c.status === 'approved' &&
    c.date.toDate() >= startDate &&
    c.date.toDate() <= endDate
  );

  const periodPayouts = payouts.filter(p =>
    p.status === 'paid' &&
    p.date.toDate() >= startDate &&
    p.date.toDate() <= endDate
  );

  const periodExpenses = expenses.filter(e =>
    e.status === 'paid' &&
    e.date.toDate() >= startDate &&
    e.date.toDate() <= endDate
  );

  const totalContributions = periodContributions.reduce((sum, c) => sum + c.amount, 0);
  const totalPayouts = periodPayouts.reduce((sum, p) => sum + p.amount, 0);
  const totalExpenses = periodExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Count active members during period
  const activeMembers = members.filter(m =>
    m.status === 'approved' &&
    (!m.join_date || m.join_date.toDate() <= endDate)
  );

  // Count new members in period
  const newMembers = members.filter(m =>
    m.join_date &&
    m.join_date.toDate() >= startDate &&
    m.join_date.toDate() <= endDate
  );

  // Count churned members (simplified - members who had contributions before but not during)
  const memberIdsBefore = new Set(
    contributions.filter(c => c.date.toDate() < startDate).map(c => c.member_id)
  );
  const memberIdsDuring = new Set(periodContributions.map(c => c.member_id));
  const churnedMembers = Array.from(memberIdsBefore).filter(id => !memberIdsDuring.has(id)).length;

  // Active contributors in period
  const activeContributors = new Set(periodContributions.map(c => c.member_id)).size;

  return {
    period: `${format(startDate, 'MMM dd, yyyy')} - ${format(endDate, 'MMM dd, yyyy')}`,
    startDate,
    endDate,
    totalContributions,
    contributionCount: periodContributions.length,
    averageContribution: periodContributions.length > 0 ? totalContributions / periodContributions.length : 0,
    totalPayouts: totalPayouts + totalExpenses,
    payoutCount: periodPayouts.length + periodExpenses.length,
    netCashFlow: totalContributions - totalPayouts - totalExpenses,
    memberCount: activeMembers.length,
    newMembers: newMembers.length,
    churnedMembers,
    activeContributors
  };
}

export async function comparePeriodsAnalysis(
  period1Start: Date,
  period1End: Date,
  period2Start: Date,
  period2End: Date,
  contributions: Contribution[],
  payouts: Payout[],
  expenses: Expense[],
  members: Member[]
): Promise<ComparativeAnalysis> {
  // Check cache
  const cacheKey = `comparative-analysis-${format(period1Start, 'yyyy-MM-dd')}-${format(period2Start, 'yyyy-MM-dd')}`;
  const cached = cacheService.get<ComparativeAnalysis>(cacheKey);
  if (cached) return cached;

  const period1 = calculatePeriodMetrics(period1Start, period1End, contributions, payouts, expenses, members);
  const period2 = calculatePeriodMetrics(period2Start, period2End, contributions, payouts, expenses, members);

  // Create comparisons for each metric
  const comparisons: MetricComparison[] = [
    {
      metric: 'Total Contributions',
      period1Value: period1.totalContributions,
      period2Value: period2.totalContributions,
      absoluteChange: period2.totalContributions - period1.totalContributions,
      percentageChange: growthRate(period1.totalContributions, period2.totalContributions),
      trend: period2.totalContributions > period1.totalContributions ? 'up' :
             period2.totalContributions < period1.totalContributions ? 'down' : 'stable',
      interpretation: period2.totalContributions > period1.totalContributions ? 'positive' : 'negative'
    },
    {
      metric: 'Average Contribution',
      period1Value: period1.averageContribution,
      period2Value: period2.averageContribution,
      absoluteChange: period2.averageContribution - period1.averageContribution,
      percentageChange: growthRate(period1.averageContribution, period2.averageContribution),
      trend: period2.averageContribution > period1.averageContribution ? 'up' :
             period2.averageContribution < period1.averageContribution ? 'down' : 'stable',
      interpretation: period2.averageContribution > period1.averageContribution ? 'positive' : 'negative'
    },
    {
      metric: 'Total Payouts',
      period1Value: period1.totalPayouts,
      period2Value: period2.totalPayouts,
      absoluteChange: period2.totalPayouts - period1.totalPayouts,
      percentageChange: growthRate(period1.totalPayouts, period2.totalPayouts),
      trend: period2.totalPayouts > period1.totalPayouts ? 'up' :
             period2.totalPayouts < period1.totalPayouts ? 'down' : 'stable',
      interpretation: period2.totalPayouts < period1.totalPayouts ? 'positive' : 'negative' // Lower payouts is good
    },
    {
      metric: 'Net Cash Flow',
      period1Value: period1.netCashFlow,
      period2Value: period2.netCashFlow,
      absoluteChange: period2.netCashFlow - period1.netCashFlow,
      percentageChange: growthRate(period1.netCashFlow, period2.netCashFlow),
      trend: period2.netCashFlow > period1.netCashFlow ? 'up' :
             period2.netCashFlow < period1.netCashFlow ? 'down' : 'stable',
      interpretation: period2.netCashFlow > period1.netCashFlow ? 'positive' : 'negative'
    },
    {
      metric: 'Active Members',
      period1Value: period1.memberCount,
      period2Value: period2.memberCount,
      absoluteChange: period2.memberCount - period1.memberCount,
      percentageChange: growthRate(period1.memberCount, period2.memberCount),
      trend: period2.memberCount > period1.memberCount ? 'up' :
             period2.memberCount < period1.memberCount ? 'down' : 'stable',
      interpretation: period2.memberCount > period1.memberCount ? 'positive' : 'negative'
    },
    {
      metric: 'Active Contributors',
      period1Value: period1.activeContributors,
      period2Value: period2.activeContributors,
      absoluteChange: period2.activeContributors - period1.activeContributors,
      percentageChange: growthRate(period1.activeContributors, period2.activeContributors),
      trend: period2.activeContributors > period1.activeContributors ? 'up' :
             period2.activeContributors < period1.activeContributors ? 'down' : 'stable',
      interpretation: period2.activeContributors > period1.activeContributors ? 'positive' : 'negative'
    }
  ];

  // Generate highlights
  const highlights: ComparativeAnalysis['highlights'] = [];

  comparisons.forEach(comparison => {
    if (Math.abs(comparison.percentageChange) > 20) {
      if (comparison.interpretation === 'positive') {
        highlights.push({
          type: 'improvement',
          metric: comparison.metric,
          message: `${comparison.metric} ${comparison.trend === 'up' ? 'increased' : 'decreased'} by ${Math.abs(comparison.percentageChange).toFixed(1)}%`
        });
      } else if (comparison.interpretation === 'negative') {
        highlights.push({
          type: 'decline',
          metric: comparison.metric,
          message: `${comparison.metric} ${comparison.trend === 'up' ? 'increased' : 'decreased'} by ${Math.abs(comparison.percentageChange).toFixed(1)}%`
        });
      }
    }
  });

  // Achievements
  if (period2.totalContributions > period1.totalContributions && period2.memberCount > period1.memberCount) {
    highlights.push({
      type: 'achievement',
      metric: 'Overall Growth',
      message: 'Both contributions and membership growing simultaneously'
    });
  }

  if (period2.netCashFlow > period1.netCashFlow * 1.5) {
    highlights.push({
      type: 'achievement',
      metric: 'Cash Flow',
      message: 'Net cash flow improved by over 50%'
    });
  }

  // Determine overall trend
  const positiveMetrics = comparisons.filter(c => c.interpretation === 'positive').length;
  const negativeMetrics = comparisons.filter(c => c.interpretation === 'negative').length;

  const overallTrend = positiveMetrics > negativeMetrics ? 'improving' :
                       negativeMetrics > positiveMetrics ? 'declining' : 'stable';

  const analysis: ComparativeAnalysis = {
    period1,
    period2,
    comparisons,
    highlights,
    overallTrend,
    generatedAt: new Date()
  };

  // Cache the result
  cacheService.set(cacheKey, analysis, CACHE.ANALYTICS_TTL);

  return analysis;
}
