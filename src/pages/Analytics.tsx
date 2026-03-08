import React, { useState, useEffect } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { subMonths, format, startOfMonth, endOfMonth } from "date-fns";
import { ResponsivePie } from "@nivo/pie";
import { ResponsiveBar } from "@nivo/bar";
import { getConfigurationValue } from "../services/configurationService";
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  orderBy,
} from "firebase/firestore";
import { db } from "../config/firebase";
import Button from "../components/ui/Button";
import KPICard from "../components/ui/KPICard";
import { Users, DollarSign, TrendingUp, TrendingDown, Wallet, Gift } from "lucide-react";
import type { Member } from "../types";
import type { Contribution } from "../types/contribution";
import type { Claim } from "../types/claim";
import type { Payout } from "../types/payout";
import { Expense } from "../types/expense";
import type { Donation } from "../types/donation";

const Analytics: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [period, setPeriod] = useState<"3m" | "6m" | "12m" | "all">("3m");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    members: Member[];
    contributions: Contribution[];
    claims: Claim[];
    payouts: Payout[];
    expenses: Expense[];
    donations: Donation[];
  }>({
    members: [],
    contributions: [],
    claims: [],
    payouts: [],
    expenses: [],
    donations: [],
  });
  const [penaltyAnalysis, setPenaltyAnalysis] = useState<{
    totalPremiums: number;
    totalPenalties: number;
    monthlyBreakdown: Array<{
      month: string;
      premiums: number;
      penalties: number;
    }>;
  }>({
    totalPremiums: 0,
    totalPenalties: 0,
    monthlyBreakdown: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let startDate: Date;
        const endDate = endOfMonth(new Date());

        if (period === "all") {
          startDate = new Date(2023, 5, 1); // June 1, 2023
        } else {
          const months = period === "3m" ? 3 : period === "6m" ? 6 : 12;
          startDate = startOfMonth(subMonths(new Date(), months));
        }

        // Fetch members
        const membersRef = collection(db, "members");
        const membersSnapshot = await getDocs(membersRef);
        const members = membersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Member[];

        // Fetch contributions
        const contributionsRef = collection(db, "contributions");
        const contributionsQuery = query(
          contributionsRef,
          where("date", ">=", Timestamp.fromDate(startDate)),
          where("date", "<=", Timestamp.fromDate(endDate)),
          orderBy("date", "asc")
        );
        const contributionsSnapshot = await getDocs(contributionsQuery);
        const contributions = contributionsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Contribution[];

        // Fetch claims
        const claimsRef = collection(db, "claims");
        const claimsQuery = query(
          claimsRef,
          where("date", ">=", Timestamp.fromDate(startDate)),
          where("date", "<=", Timestamp.fromDate(endDate)),
          orderBy("date", "asc")
        );
        const claimsSnapshot = await getDocs(claimsQuery);
        const claims = claimsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Claim[];

        // Fetch payouts
        const payoutsRef = collection(db, "payouts");
        const payoutsQuery = query(
          payoutsRef,
          where("date", ">=", Timestamp.fromDate(startDate)),
          where("date", "<=", Timestamp.fromDate(endDate)),
          orderBy("date", "asc")
        );
        const payoutsSnapshot = await getDocs(payoutsQuery);
        const payouts = payoutsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Payout[];

        // Fetch expenses
        const expensesRef = collection(db, "expenses");
        const expensesQuery = query(
          expensesRef,
          where("date", ">=", Timestamp.fromDate(startDate)),
          where("date", "<=", Timestamp.fromDate(endDate)),
          orderBy("date", "asc")
        );
        const expensesSnapshot = await getDocs(expensesQuery);
        const expenses = expensesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Expense[];

        // Fetch donations
        const donationsRef = collection(db, "donations");
        const donationsQuery = query(
          donationsRef,
          where("date", ">=", Timestamp.fromDate(startDate)),
          where("date", "<=", Timestamp.fromDate(endDate)),
          where("status", "==", "approved"),
          orderBy("date", "asc")
        );
        const donationsSnapshot = await getDocs(donationsQuery);
        const donations = donationsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Donation[];

        setData({ members, contributions, claims, payouts, expenses, donations });

        // Calculate penalty analysis
        await calculatePenaltyAnalysis(contributions);
      } catch (error) {
        console.error("Error fetching analytics data:", error);
      } finally {
        setLoading(false);
      }
    };

    const calculatePenaltyAnalysis = async (contributions: Contribution[]) => {
      try {
        // Only analyze approved monthly contributions
        const monthlyContributions = contributions.filter(
          (c) => c.status === "approved" && c.type === "monthly"
        );
        const penaltyContributions = contributions.filter(
          (c) => c.status === "approved" && c.type === "infringement_penalty"
        );

        let totalPremiums = 0;
        let totalPenalties = 0;
        const monthlyBreakdown: Array<{
          month: string;
          premiums: number;
          penalties: number;
        }> = [];

        // Group contributions by month
        const contributionsByMonth = new Map<string, Contribution[]>();
        monthlyContributions.forEach((contribution) => {
          const date = contribution.date.toDate();
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          if (!contributionsByMonth.has(monthKey)) {
            contributionsByMonth.set(monthKey, []);
          }
          contributionsByMonth.get(monthKey)!.push(contribution);
        });

        const penaltyContributionsByMonth = new Map<string, Contribution[]>();
        penaltyContributions.forEach((contribution) => {
          const date = contribution.date.toDate();
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          if (!penaltyContributionsByMonth.has(monthKey)) {
            penaltyContributionsByMonth.set(monthKey, []);
          }
          penaltyContributionsByMonth.get(monthKey)!.push(contribution);
        });



        // Analyze each month
        for (const [monthKey, monthContributions] of contributionsByMonth) {
          const [year, month] = monthKey.split('-');
          const monthDate = new Date(parseInt(year), parseInt(month) - 1, 1);
          const monthName = format(monthDate, 'MMM yyyy');

          // Get configuration for this month
          const monthlyFee = await getConfigurationValue("monthly_fee", monthDate);

          let monthPremiums = 0;
          let monthPenalties = 0;

          monthContributions.forEach((contribution) => {
            if (contribution.amount > monthlyFee) {
              // Payment exceeds monthly fee - likely includes penalty
              monthPremiums += monthlyFee;
              monthPenalties += contribution.amount - monthlyFee;
            } else {
              // Payment is equal to or less than monthly fee
              monthPremiums += contribution.amount;
            }
          });

          monthPenalties += penaltyContributionsByMonth.get(monthKey)?.reduce((acc, contribution) => acc + contribution.amount, 0) || 0;

          totalPremiums += monthPremiums;
          totalPenalties += monthPenalties;

          if (monthPremiums > 0 || monthPenalties > 0) {
            monthlyBreakdown.push({
              month: monthName,
              premiums: monthPremiums,
              penalties: monthPenalties,
            });
          }
        }

        setPenaltyAnalysis({
          totalPremiums,
          totalPenalties,
          monthlyBreakdown: monthlyBreakdown.sort((a, b) =>
            new Date(a.month).getTime() - new Date(b.month).getTime()
          ),
        });
      } catch (error) {
        console.error("Error calculating penalty analysis:", error);
      }
    };

    fetchData();
  }, [period]);

  // Calculate enhanced metrics
  const totalContributions = data.contributions.reduce((sum, c) => sum + c.amount, 0);
  const totalClaims = data.claims.reduce((sum, c) => sum + c.amount, 0);

  const metrics = {
    totalMembers: data.members.length,
    activeMembers: data.members.filter((m) => m.status === "active").length,
    inactiveMembers: data.members.filter((m) => m.status === "inactive").length,
    approvedMembers: data.members.filter((m) => m.status === "approved").length,
    totalContributions,
    totalClaims,
    totalPayouts: data.payouts.reduce((sum, p) => sum + p.amount, 0),
    totalExpenses: data.expenses.reduce((sum, e) => sum + e.amount, 0),
    totalDonations: data.donations.reduce((sum, d) => sum + d.amount, 0),
    donationCount: data.donations.length,
    pendingClaims: data.claims.filter((c) => c.status === "pending").length,
    approvedClaims: data.claims.filter((c) => c.status === "approved").length,
    rejectedClaims: data.claims.filter((c) => c.status === "rejected").length,
    pendingExpenses: data.expenses.filter((e) => e.status === "pending").length,
    avgContribution:
      data.contributions.length > 0
        ? totalContributions / data.contributions.length
        : 0,
    avgClaimAmount:
      data.claims.length > 0
        ? totalClaims / data.claims.length
        : 0,
    claimsToContributionRatio:
      totalContributions > 0
        ? (totalClaims / totalContributions) * 100
        : 0,
    memberRetentionRate:
      data.members.length > 0
        ? (data.members.filter((m) => m.status === "approved").length / data.members.length) * 100
        : 0,
  };

  // Calculate actual fund balance including expenses and donations
  const fundBalance =
    metrics.totalContributions + metrics.totalDonations - metrics.totalPayouts - metrics.totalExpenses;

  // Prepare cashflow data (contributions vs payouts + expenses)
  const cashflowData = Array.from({
    length:
      period === "3m" ? 3 : period === "6m" ? 6 : period === "12m" ? 12 : 12,
  })
    .map((_, i) => {
      const date = subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);

      const monthContributions = data.contributions.filter((c) => {
        const contribDate = c.date.toDate();
        return contribDate >= monthStart && contribDate <= monthEnd;
      }).reduce((sum, c) => sum + c.amount, 0);

      const monthDonations = data.donations.filter((d) => {
        const donationDate = d.date.toDate();
        return donationDate >= monthStart && donationDate <= monthEnd;
      }).reduce((sum, d) => sum + d.amount, 0);

      const monthPayouts = data.payouts.filter((p) => {
        const payoutDate = p.date.toDate();
        return payoutDate >= monthStart && payoutDate <= monthEnd;
      }).reduce((sum, p) => sum + p.amount, 0);

      const monthExpenses = data.expenses.filter((e) => {
        const expenseDate = e.date.toDate();
        return expenseDate >= monthStart && expenseDate <= monthEnd;
      }).reduce((sum, e) => sum + e.amount, 0);

      const totalIncome = monthContributions + monthDonations;
      const totalOutgoing = monthPayouts + monthExpenses;

      return {
        month: format(date, "MMM yyyy"),
        Contributions: monthContributions,
        Donations: monthDonations,
        "Payouts & Expenses": totalOutgoing,
        "Net Flow": totalIncome - totalOutgoing,
      };
    })
    .reverse();

  // Claims status breakdown
  const claimsStatusData = [
    { id: "Pending", value: metrics.pendingClaims, color: "#f59e0b" },
    { id: "Approved", value: metrics.approvedClaims, color: "#10b981" },
    { id: "Rejected", value: metrics.rejectedClaims, color: "#ef4444" },
  ].filter(item => item.value > 0);

  // Member status breakdown
  const memberStatusData = [
    { id: "Active", value: metrics.activeMembers, color: "#10b981" },
    { id: "Inactive", value: metrics.inactiveMembers, color: "#6b7280" },
    { id: "Approved", value: metrics.approvedMembers, color: "#8b5cf6" },
  ].filter(item => item.value > 0);

  // Penalty vs Premium breakdown for pie chart
  const penaltyBreakdownData = [
    {
      id: "Regular Premiums",
      value: penaltyAnalysis.totalPremiums,
      color: "#10b981",
    },
    {
      id: "Penalty Fees",
      value: penaltyAnalysis.totalPenalties,
      color: "#ef4444",
    },
  ].filter(item => item.value > 0);

  // Top insights
  const insights = [
    {
      title: "Claims Efficiency",
      value: `${((metrics.approvedClaims / (metrics.approvedClaims + metrics.rejectedClaims)) * 100 || 0).toFixed(1)}%`,
      description: "of claims are approved",
      trend: metrics.approvedClaims > metrics.rejectedClaims ? "positive" : "negative",
    },
    {
      title: "Fund Utilization",
      value: `${((metrics.totalPayouts / metrics.totalContributions) * 100 || 0).toFixed(1)}%`,
      description: "of contributions are paid out",
      trend: (metrics.totalPayouts / metrics.totalContributions) < 0.8 ? "positive" : "warning",
    },
    {
      title: "Member Retention",
      value: `${metrics.memberRetentionRate.toFixed(1)}%`,
      description: "of members are active",
      trend: metrics.memberRetentionRate > 85 ? "positive" : "negative",
    },
    {
      title: "Penalty Rate",
      value: `${(penaltyAnalysis.totalPenalties / (penaltyAnalysis.totalPremiums + penaltyAnalysis.totalPenalties) * 100 || 0).toFixed(1)}%`,
      description: "of contributions are penalties",
      trend: (penaltyAnalysis.totalPenalties / (penaltyAnalysis.totalPremiums + penaltyAnalysis.totalPenalties) * 100) < 10 ? "positive" : "warning",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Comprehensive financial insights and metrics</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={period === "3m" ? "primary" : "secondary"}
            onClick={() => setPeriod("3m")}
            size="small"
          >
            3 Months
          </Button>
          <Button
            variant={period === "6m" ? "primary" : "secondary"}
            onClick={() => setPeriod("6m")}
            size="small"
          >
            6 Months
          </Button>
          <Button
            variant={period === "12m" ? "primary" : "secondary"}
            onClick={() => setPeriod("12m")}
            size="small"
          >
            12 Months
          </Button>
          <Button
            variant={period === "all" ? "primary" : "secondary"}
            onClick={() => setPeriod("all")}
            size="small"
          >
            All Time
          </Button>
        </div>
      </div>

      {/* Key Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {insights.map((insight, index) => {
          const gradients = ["purple", "teal", "blue", "amber"] as const;
          return (
            <div key={index} className="bg-white dark:bg-surface-dark rounded-[20px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_35px_rgba(0,0,0,0.08)] transition-all duration-300">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${insight.trend === "positive" ? "from-green-500 to-green-600" :
                  insight.trend === "negative" ? "from-red-500 to-red-600" :
                    insight.trend === "warning" ? "from-amber-500 to-amber-600" :
                      "from-blue-500 to-blue-600"
                  } flex items-center justify-center shadow-lg`}>
                  {insight.trend === "positive" ? (
                    <TrendingUp className="w-6 h-6 text-white" />
                  ) : insight.trend === "negative" ? (
                    <TrendingDown className="w-6 h-6 text-white" />
                  ) : (
                    <TrendingUp className="w-6 h-6 text-white" />
                  )}
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {insight.title}
              </h3>
              <p className={`mt-2 text-2xl font-bold ${insight.trend === "positive"
                ? "text-green-600 dark:text-green-400"
                : insight.trend === "negative"
                  ? "text-red-600 dark:text-red-400"
                  : insight.trend === "warning"
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-gray-900 dark:text-white"
                }`}>
                {insight.value}
              </p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {insight.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Core Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <KPICard
          title="Total Members"
          value={metrics.approvedMembers}
          subtitle={`${metrics.activeMembers} active`}
          icon={Users}
          gradient="blue"
        />
        <KPICard
          title="Total Contributions"
          value={`R ${metrics.totalContributions.toFixed(0)}`}
          subtitle={`Avg: R ${metrics.avgContribution.toFixed(0)}`}
          icon={DollarSign}
          gradient="green"
        />
        <KPICard
          title="Donations & Investments"
          value={`R ${metrics.totalDonations.toFixed(0)}`}
          subtitle={`${metrics.donationCount} donations`}
          icon={Gift}
          gradient="purple"
        />
        <KPICard
          title="Total Payouts"
          value={`R ${(metrics.totalPayouts + metrics.totalExpenses).toFixed(0)}`}
          subtitle={`Claims: R ${metrics.totalPayouts.toFixed(0)}`}
          icon={TrendingDown}
          gradient="red"
        />
        <KPICard
          title="Fund Balance"
          value={`R ${fundBalance.toFixed(0)}`}
          subtitle={`${metrics.pendingClaims} pending claims`}
          icon={Wallet}
          gradient={fundBalance >= 0 ? "green" : "red"}
        />
      </div>

      {/* Cash Flow Analysis */}
      <div className="bg-white dark:bg-surface-dark rounded-[20px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Cash Flow Analysis</h3>
        <div className="h-[400px]">
          <ResponsiveBar
            data={cashflowData}
            keys={["Contributions", "Donations", "Payouts & Expenses", "Net Flow"]}
            indexBy="month"
            margin={{ top: 50, right: 130, bottom: 50, left: 80 }}
            padding={0.3}
            groupMode="grouped"
            colors={["#10b981", "#a855f7", "#ef4444", "#3b82f6"]}
            borderRadius={4}
            axisBottom={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: -45,
            }}
            axisLeft={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              format: (value) => `R ${value}`,
            }}
            labelSkipWidth={12}
            labelSkipHeight={12}
            theme={{
              axis: {
                ticks: { text: { fill: isDark ? "#d1d5db" : "#374151" } },
                legend: { text: { fill: isDark ? "#d1d5db" : "#374151" } }
              },
              legends: {
                text: { fill: isDark ? "#d1d5db" : "#374151" }
              }
            }}
            legends={[
              {
                dataFrom: "keys",
                anchor: "bottom-right",
                direction: "column",
                justify: false,
                translateX: 120,
                translateY: 0,
                itemsSpacing: 2,
                itemWidth: 100,
                itemHeight: 20,
                itemDirection: "left-to-right",
                itemOpacity: 0.85,
                symbolSize: 20,
                itemTextColor: isDark ? "#d1d5db" : "#374151",
              },
            ]}
            tooltip={({ id, value, indexValue }) => (
              <div className="bg-white dark:bg-gray-800 p-3 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="font-semibold">{indexValue}</div>
                <div className="text-sm">{id}: R {value.toFixed(0)}</div>
              </div>
            )}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-surface-dark rounded-[20px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Claims Status Overview</h3>
          {claimsStatusData.length > 0 ? (
            <div className="h-[300px]">
              <ResponsivePie
                data={claimsStatusData}
                margin={{ top: 20, right: 80, bottom: 80, left: 80 }}
                innerRadius={0.4}
                padAngle={2}
                cornerRadius={4}
                activeOuterRadiusOffset={8}
                colors={{ datum: 'data.color' }}
                borderWidth={2}
                borderColor={{ from: "color", modifiers: [["darker", 0.3]] }}
                arcLinkLabelsSkipAngle={10}
                arcLinkLabelsTextColor={isDark ? "#d1d5db" : "#64748b"}
                arcLinkLabelsThickness={2}
                arcLinkLabelsColor={{ from: "color" }}
                arcLabelsSkipAngle={10}
                arcLabelsTextColor="#ffffff"
                legends={[
                  {
                    anchor: "bottom",
                    direction: "row",
                    justify: false,
                    translateX: 0,
                    translateY: 56,
                    itemsSpacing: 10,
                    itemWidth: 80,
                    itemHeight: 18,
                    itemTextColor: isDark ? "#d1d5db" : "#64748b",
                    itemDirection: "left-to-right",
                    itemOpacity: 1,
                    symbolSize: 18,
                    symbolShape: "circle",
                  },
                ]}
                tooltip={({ datum }) => (
                  <div className="bg-white dark:bg-gray-800 p-3 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="font-semibold">{datum.id}</div>
                    <div className="text-sm">{datum.value} claims</div>
                  </div>
                )}
              />
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
              No claims data available for this period
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-surface-dark rounded-[20px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Member Status Breakdown</h3>
          {memberStatusData.length > 0 ? (
            <div className="h-[300px]">
              <ResponsivePie
                data={memberStatusData}
                margin={{ top: 20, right: 80, bottom: 80, left: 80 }}
                innerRadius={0.4}
                padAngle={2}
                cornerRadius={4}
                activeOuterRadiusOffset={8}
                colors={{ datum: 'data.color' }}
                borderWidth={2}
                borderColor={{ from: "color", modifiers: [["darker", 0.3]] }}
                arcLinkLabelsSkipAngle={10}
                arcLinkLabelsTextColor={isDark ? "#d1d5db" : "#64748b"}
                arcLinkLabelsThickness={2}
                arcLinkLabelsColor={{ from: "color" }}
                arcLabelsSkipAngle={10}
                arcLabelsTextColor="#ffffff"
                legends={[
                  {
                    anchor: "bottom",
                    direction: "row",
                    justify: false,
                    translateX: 0,
                    translateY: 56,
                    itemsSpacing: 20,
                    itemWidth: 80,
                    itemHeight: 18,
                    itemTextColor: isDark ? "#d1d5db" : "#64748b",
                    itemDirection: "left-to-right",
                    itemOpacity: 1,
                    symbolSize: 18,
                    symbolShape: "circle",
                  },
                ]}
                tooltip={({ datum }) => (
                  <div className="bg-white dark:bg-gray-800 p-3 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="font-semibold">{datum.id}</div>
                    <div className="text-sm">{datum.value} members ({((datum.value / metrics.totalMembers) * 100).toFixed(1)}%)</div>
                  </div>
                )}
              />
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
              No member data available
            </div>
          )}
        </div>
      </div>

      {/* Premium vs Penalty Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-surface-dark rounded-[20px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Premium vs Penalty Breakdown</h3>
          {penaltyBreakdownData.length > 0 ? (
            <div className="h-[300px]">
              <ResponsivePie
                data={penaltyBreakdownData}
                margin={{ top: 20, right: 80, bottom: 80, left: 80 }}
                innerRadius={0.4}
                padAngle={2}
                cornerRadius={4}
                activeOuterRadiusOffset={8}
                colors={{ datum: 'data.color' }}
                borderWidth={2}
                borderColor={{ from: "color", modifiers: [["darker", 0.3]] }}
                arcLinkLabelsSkipAngle={10}
                arcLinkLabelsTextColor={isDark ? "#d1d5db" : "#64748b"}
                arcLinkLabelsThickness={2}
                arcLinkLabelsColor={{ from: "color" }}
                arcLabelsSkipAngle={10}
                arcLabelsTextColor="#ffffff"
                legends={[
                  {
                    anchor: "bottom",
                    direction: "row",
                    justify: false,
                    translateX: 0,
                    translateY: 56,
                    itemsSpacing: 20,
                    itemWidth: 120,
                    itemHeight: 18,
                    itemTextColor: isDark ? "#d1d5db" : "#64748b",
                    itemDirection: "left-to-right",
                    itemOpacity: 1,
                    symbolSize: 18,
                    symbolShape: "circle",
                  },
                ]}
                tooltip={({ datum }) => (
                  <div className="bg-white dark:bg-gray-800 p-3 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="font-semibold">{datum.id}</div>
                    <div className="text-sm">R {datum.value.toFixed(2)} ({((datum.value / (penaltyAnalysis.totalPremiums + penaltyAnalysis.totalPenalties)) * 100).toFixed(1)}%)</div>
                  </div>
                )}
              />
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
              No premium/penalty data available for this period
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-surface-dark rounded-[20px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Monthly Premium vs Penalty Trends</h3>
          <div className="h-[300px]">
            <ResponsiveBar
              data={penaltyAnalysis.monthlyBreakdown}
              keys={["premiums", "penalties",]}
              indexBy="month"
              margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
              padding={0.3}
              groupMode="grouped"
              colors={["#10b981", "#ef4444"]}
              borderRadius={4}
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: -45,
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                format: (value) => `R ${value}`,
              }}
              labelSkipWidth={12}
              labelSkipHeight={12}
              theme={{
                axis: {
                  ticks: { text: { fill: isDark ? "#d1d5db" : "#374151" } },
                  legend: { text: { fill: isDark ? "#d1d5db" : "#374151" } }
                },
                legends: {
                  text: { fill: isDark ? "#d1d5db" : "#374151" }
                }
              }}
              legends={[
                {
                  dataFrom: "keys",
                  anchor: "bottom-right",
                  direction: "column",
                  justify: false,
                  translateX: 120,
                  translateY: 0,
                  itemsSpacing: 2,
                  itemWidth: 100,
                  itemHeight: 20,
                  itemDirection: "left-to-right",
                  itemOpacity: 0.85,
                  symbolSize: 20,
                  itemTextColor: isDark ? "#d1d5db" : "#374151",
                },
              ]}
              tooltip={({ id, value, indexValue }) => (
                <div className="bg-white dark:bg-gray-800 p-3 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="font-semibold">{indexValue}</div>
                  <div className="text-sm">{id === 'premiums' ? 'Regular Premiums' : 'Penalty Fees'}: R {value.toFixed(0)}</div>
                </div>
              )}
            />
          </div>
        </div>
      </div>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-surface-dark rounded-[20px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Quick Stats</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Contribution Frequency</span>
              <span className="font-semibold">{(data.contributions.length / Math.max(metrics.activeMembers, 1)).toFixed(1)} per member</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Claims Rate</span>
              <span className="font-semibold">{((data.claims.length / Math.max(metrics.totalMembers, 1)) * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Penalty Income</span>
              <span className="font-semibold text-red-600">R {penaltyAnalysis.totalPenalties.toFixed(0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Fund Health Score</span>
              <span className={`font-semibold ${fundBalance > metrics.totalContributions * 0.3 ? "text-green-600" :
                fundBalance > 0 ? "text-yellow-600" : "text-red-600"
                }`}>
                {fundBalance > metrics.totalContributions * 0.3 ? "Excellent" :
                  fundBalance > 0 ? "Good" : "Critical"}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-surface-dark rounded-[20px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Pending Actions</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-200">Claims to Review</p>
                <p className="text-sm text-yellow-600 dark:text-yellow-400">{metrics.pendingClaims} pending</p>
              </div>
              <div className="text-2xl font-bold text-yellow-600">{metrics.pendingClaims}</div>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div>
                <p className="font-medium text-blue-800 dark:text-blue-200">Expenses to Approve</p>
                <p className="text-sm text-blue-600 dark:text-blue-400">{metrics.pendingExpenses} pending</p>
              </div>
              <div className="text-2xl font-bold text-blue-600">{metrics.pendingExpenses}</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-surface-dark rounded-[20px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Period Summary</h3>
          <div className="space-y-3">
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                +R {metrics.totalContributions.toFixed(0)}
              </p>
              <p className="text-sm text-green-600 dark:text-green-400">Total Income</p>
            </div>
            <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                -R {(metrics.totalPayouts + metrics.totalExpenses).toFixed(0)}
              </p>
              <p className="text-sm text-red-600 dark:text-red-400">Total Outflow</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
