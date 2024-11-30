import React, { useState, useEffect } from "react";
import { subMonths } from "date-fns";
import {
  getContributionAnalytics,
  getMemberAnalytics,
  getFinancialMetrics,
} from "../services/analyticsService";
import ContributionChart from "../components/analytics/ContributionChart";
import MembershipChart from "../components/analytics/MembershipChart";
import StatCard from "../components/stats/StatCard";
import Button from "../components/ui/Button";
import type {
  ContributionAnalytics,
  MemberAnalytics,
  FinancialMetrics,
} from "../types/analytics";

const Analytics: React.FC = () => {
  const [period, setPeriod] = useState<"3m" | "6m" | "12m">("3m");
  const [contributionData, setContributionData] =
    useState<ContributionAnalytics | null>(null);
  const [memberData, setMemberData] = useState<MemberAnalytics | null>(null);
  const [financialData, setFinancialData] = useState<FinancialMetrics | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const months = period === "3m" ? 3 : period === "6m" ? 6 : 12;
        const startDate = subMonths(new Date(), months);
        const endDate = new Date();

        const [contributions, members, finances] = await Promise.all([
          getContributionAnalytics(startDate, endDate),
          getMemberAnalytics(),
          getFinancialMetrics(startDate, endDate),
        ]);

        setContributionData(contributions);
        setMemberData(members);
        setFinancialData(finances);
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [period]);

  if (loading) {
    return <div className="p-8">Loading analytics...</div>;
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
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Contributions"
          value={`R ${contributionData?.totalAmount.toFixed(2) || "0.00"}`}
        />
        <StatCard
          title="Total Members"
          value={memberData?.totalMembers.toString() || "0"}
        />
        <StatCard
          title="Current Balance"
          value={`R ${financialData?.balance.toFixed(2) || "0.00"}`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Contribution Trends</h3>
          {contributionData && (
            <ContributionChart data={contributionData.monthlyTrends} />
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Membership Growth</h3>
          {memberData && <MembershipChart data={memberData.memberGrowth} />}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Financial Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-500">
              Average Contribution
            </h4>
            <p className="text-2xl font-semibold">
              R {contributionData?.averageAmount.toFixed(2) || "0.00"}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Total Payouts</h4>
            <p className="text-2xl font-semibold">
              R {financialData?.totalPayouts.toFixed(2) || "0.00"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
