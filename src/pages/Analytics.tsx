import React, { useState, useEffect } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { subMonths, format, startOfMonth, endOfMonth } from "date-fns";
import { ResponsiveLine } from "@nivo/line";
import { ResponsivePie } from "@nivo/pie";
import { ResponsiveBar } from "@nivo/bar";
import { ResponsiveCalendar } from "@nivo/calendar";
import { ResponsiveRadar } from "@nivo/radar";
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
import type { Member } from "../types";
import type { Contribution } from "../types/contribution";
import type { Claim } from "../types/claim";
import type { Payout } from "../types/payout";
import { Expense } from "../types/expense";

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
  }>({
    members: [],
    contributions: [],
    claims: [],
    payouts: [],
    expenses: [],
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

        setData({ members, contributions, claims, payouts, expenses });
      } catch (error) {
        console.error("Error fetching analytics data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period]);

  // Calculate key metrics including expenses
  const metrics = {
    totalMembers: data.members.length,
    activeMembers: data.members.filter((m) => m.status === "active").length,
    totalContributions: data.contributions.reduce(
      (sum, c) => sum + c.amount,
      0
    ),
    totalClaims: data.claims.reduce((sum, c) => sum + c.amount, 0),
    totalPayouts: data.payouts.reduce((sum, p) => sum + p.amount, 0),
    totalExpenses: data.expenses.reduce((sum, e) => sum + e.amount, 0),
    pendingClaims: data.claims.filter((c) => c.status === "pending").length,
    pendingExpenses: data.expenses.filter((e) => e.status === "pending").length,
    avgContribution:
      data.contributions.length > 0
        ? data.contributions.reduce((sum, c) => sum + c.amount, 0) /
          data.contributions.length
        : 0,
  };

  // Calculate actual fund balance including expenses
  const fundBalance =
    metrics.totalContributions - metrics.totalPayouts - metrics.totalExpenses;

  // Prepare contribution trends data
  const contributionTrends = Array.from({
    length:
      period === "3m" ? 3 : period === "6m" ? 6 : period === "12m" ? 12 : 24,
  })
    .map((_, i) => {
      const date = subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      const monthContributions = data.contributions.filter((c) => {
        const contribDate = c.date.toDate();
        return contribDate >= monthStart && contribDate <= monthEnd;
      });
      return {
        x: format(date, "MMM yyyy"),
        y: monthContributions.reduce((sum, c) => sum + c.amount, 0),
      };
    })
    .reverse();

  // Calculate minimum width based on number of data points
  const minChartWidth = Math.max(contributionTrends.length * 80, 800);

  // Prepare contribution types data
  const contributionTypes = data.contributions.reduce((acc, curr) => {
    acc[curr.type] = (acc[curr.type] || 0) + curr.amount;
    return acc;
  }, {} as Record<string, number>);

  const contributionPieData = Object.entries(contributionTypes).map(
    ([id, value]) => ({
      id: id.charAt(0).toUpperCase() + id.slice(1),
      value,
    })
  );

  // Prepare claims distribution data
  const claimTypes = data.claims.reduce((acc, curr) => {
    acc[curr.type] = (acc[curr.type] || 0) + curr.amount;
    return acc;
  }, {} as Record<string, number>);

  const claimsPieData = Object.entries(claimTypes).map(([id, value]) => ({
    id: id.charAt(0).toUpperCase() + id.slice(1),
    value,
  }));

  // Update member growth data calculation to handle 'all' period
  const memberGrowth = Array.from({
    length:
      period === "3m" ? 3 : period === "6m" ? 6 : period === "12m" ? 12 : 24,
  })
    .map((_, i) => {
      const date =
        period === "all"
          ? subMonths(new Date(), 24 - i)
          : subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      const newMembers = data.members.filter((m) => {
        const joinDate = m.join_date.toDate();
        return joinDate >= monthStart && joinDate <= monthEnd;
      });
      return {
        month: format(date, "MMM yyyy"),
        "New Members": newMembers.length,
        "Total Members": data.members.filter(
          (m) => m.join_date.toDate() <= monthEnd
        ).length,
      };
    })
    .reverse();

  // Prepare financial health radar data
  const financialMetrics = [
    {
      metric: "Contribution Rate",
      value: (data.contributions.length / metrics.activeMembers) * 100 || 0,
    },
    {
      metric: "Claims Ratio",
      value: (metrics.totalClaims / metrics.totalContributions) * 100 || 0,
    },
    {
      metric: "Member Retention",
      value: (metrics.activeMembers / metrics.totalMembers) * 100 || 0,
    },
    {
      metric: "Payout Efficiency",
      value:
        (data.payouts.filter((p) => p.status === "paid").length /
          data.payouts.length) *
          100 || 0,
    },
    {
      metric: "Fund Balance",
      value:
        ((metrics.totalContributions - metrics.totalPayouts) /
          metrics.totalContributions) *
          100 || 0,
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        <div className="flex space-x-2">
          <Button
            variant={period === "3m" ? "primary" : "secondary"}
            onClick={() => setPeriod("3m")}
          >
            3 Months
          </Button>
          <Button
            variant={period === "6m" ? "primary" : "secondary"}
            onClick={() => setPeriod("6m")}
          >
            6 Months
          </Button>
          <Button
            variant={period === "12m" ? "primary" : "secondary"}
            onClick={() => setPeriod("12m")}
          >
            12 Months
          </Button>
          <Button
            variant={period === "all" ? "primary" : "secondary"}
            onClick={() => setPeriod("all")}
          >
            All Time
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Total Members
          </h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
            {metrics.totalMembers}
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {metrics.activeMembers} active
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Total Income
          </h3>
          <p className="mt-2 text-3xl font-semibold text-green-600 dark:text-green-400">
            R {metrics.totalContributions.toFixed(2)}
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Avg: R {metrics.avgContribution.toFixed(2)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Total Outflows
          </h3>
          <p className="mt-2 text-3xl font-semibold text-red-600 dark:text-red-400">
            R {(metrics.totalPayouts + metrics.totalExpenses).toFixed(2)}
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Claims: R {metrics.totalClaims.toFixed(2)}
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Other expense: R {metrics.totalExpenses.toFixed(2)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-white-400">
            Fund Balance
          </h3>
          <p
            className={`mt-2 text-3xl font-semibold ${
              fundBalance >= 0
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            R {fundBalance.toFixed(2)}
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {metrics.pendingExpenses} pending expenses
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Contribution Trends</h3>
          <div className="overflow-x-auto">
            <div
              className="h-[400px]"
              style={{ minWidth: `${minChartWidth}px` }}
            >
              <ResponsiveLine
                data={[{ id: "Contributions", data: contributionTrends }]}
                margin={{ top: 50, right: 110, bottom: 50, left: 80 }}
                xScale={{ type: "point" }}
                yScale={{
                  type: "linear",
                  min: "auto",
                  max: "auto",
                  stacked: false,
                }}
                curve="monotoneX"
                axisTop={null}
                axisRight={null}
                axisBottom={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: -45,
                  tickValues: contributionTrends.map((d) => d.x),
                }}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  format: (value) => `R ${value}`,
                }}
                pointSize={10}
                pointColor={{ theme: "background" }}
                pointBorderWidth={2}
                pointBorderColor={{ from: "serieColor" }}
                enableArea={true}
                areaOpacity={0.15}
                useMesh={true}
                theme={{
                  axis: {
                    domain: { line: { stroke: isDark ? "#9ca3af" : "#64748b" } },
                    ticks: { text: { fill: isDark ? "#d1d5db" : "#374151" } },
                    legend: { text: { fill: isDark ? "#d1d5db" : "#374151" } }
                  },
                  grid: { line: { stroke: isDark ? "#4b5563" : "#cbd5e1", strokeWidth: 1 } },
                  crosshair: {
                    line: {
                      stroke: isDark ? "#9ca3af" : "#64748b",
                      strokeWidth: 1,
                      strokeOpacity: 0.35,
                    },
                  },
                  legends: {
                    text: { fill: isDark ? "#d1d5db" : "#374151" }
                  }
                }}
                tooltip={({ point }) => {
                  const { x, y } = point.data;
                  return (
                    <div className="bg-white dark:bg-gray-800 p-2 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="font-semibold">{String(x)}</div>
                      <div className="text-sm">R {Number(y).toFixed(2)}</div>
                    </div>
                  );
                }}
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Member Growth</h3>
          <div className="overflow-x-auto">
            <div
              className="h-[400px]"
              style={{ minWidth: `${minChartWidth}px` }}
            >
              <ResponsiveBar
                data={memberGrowth}
                keys={["New Members", "Total Members"]}
                indexBy="month"
                margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
                padding={0.3}
                groupMode="grouped"
                colors={["#8b5cf6", "#6366f1"]}
                borderRadius={4}
                axisBottom={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: -45,
                  tickValues: memberGrowth.map((d) => d.month),
                }}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
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
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">
            Contribution Distribution
          </h3>
          <div className="h-[400px]">
            <ResponsivePie
              data={contributionPieData}
              margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
              innerRadius={0.5}
              padAngle={0.7}
              cornerRadius={3}
              activeOuterRadiusOffset={8}
              colors={{ scheme: "purple_blue" }}
              borderWidth={1}
              borderColor={{ from: "color", modifiers: [["darker", 0.2]] }}
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
                  itemsSpacing: 0,
                  itemWidth: 100,
                  itemHeight: 18,
                  itemTextColor: isDark ? "#d1d5db" : "#64748b",
                  itemDirection: "left-to-right",
                  itemOpacity: 1,
                  symbolSize: 18,
                  symbolShape: "circle",
                },
              ]}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Claims Distribution</h3>
          <div className="h-[400px]">
            <ResponsivePie
              data={claimsPieData}
              margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
              innerRadius={0.5}
              padAngle={0.7}
              cornerRadius={3}
              activeOuterRadiusOffset={8}
              colors={{ scheme: "red_purple" }}
              borderWidth={1}
              borderColor={{ from: "color", modifiers: [["darker", 0.2]] }}
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
                  itemsSpacing: 0,
                  itemWidth: 100,
                  itemHeight: 18,
                  itemTextColor: isDark ? "#d1d5db" : "#64748b",
                  itemDirection: "left-to-right",
                  itemOpacity: 1,
                  symbolSize: 18,
                  symbolShape: "circle",
                },
              ]}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">
            Financial Health Metrics
          </h3>
          <div className="h-[400px]">
            <ResponsiveRadar
              data={financialMetrics}
              keys={["value"]}
              indexBy="metric"
              maxValue={100}
              margin={{ top: 70, right: 80, bottom: 40, left: 80 }}
              curve="linearClosed"
              borderWidth={2}
              borderColor={{ from: "color" }}
              gridLabelOffset={36}
              theme={{
                grid: {
                  line: { stroke: isDark ? "#4b5563" : "#e2e8f0" }
                },
                labels: {
                  text: { fill: isDark ? "#d1d5db" : "#374151" }
                },
                dots: {
                  text: { fill: isDark ? "#d1d5db" : "#374151" }
                }
              }}
              dotSize={10}
              dotColor={{ theme: "background" }}
              dotBorderWidth={2}
              colors={{ scheme: "category10" }}
              fillOpacity={0.25}
              blendMode="multiply"
              legends={[
                {
                  anchor: "top-left",
                  direction: "column",
                  translateX: -50,
                  translateY: -40,
                  itemWidth: 80,
                  itemHeight: 20,
                  itemTextColor: isDark ? "#d1d5db" : "#64748b",
                  symbolSize: 12,
                  symbolShape: "circle",
                },
              ]}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Activity Calendar</h3>
          <div className="h-[400px]">
            <ResponsiveCalendar
              data={data.contributions.map((c) => ({
                day: format(c.date.toDate(), "yyyy-MM-dd"),
                value: c.amount,
              }))}
              from={subMonths(
                new Date(),
                period === "3m" ? 3 : period === "6m" ? 6 : 12
              )}
              to={new Date()}
              emptyColor={isDark ? "#374151" : "#f3f4f6"}
              colors={isDark ? ["#4c1d95", "#5b21b6", "#7c2d92", "#8b5cf6", "#a855f7"] : ["#c7d2fe", "#a5b4fc", "#818cf8", "#6366f1", "#4f46e5"]}
              theme={{
                labels: {
                  text: { fill: isDark ? "#f3f4f6" : "#1f2937" }
                }
              }}
              margin={{ top: 40, right: 40, bottom: 40, left: 40 }}
              yearSpacing={40}
              monthBorderColor={isDark ? "#4b5563" : "#ffffff"}
              dayBorderWidth={2}
              dayBorderColor={isDark ? "#4b5563" : "#ffffff"}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
