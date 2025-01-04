import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { useAuth } from "../hooks/useAuth";
import StatCard from "../components/stats/StatCard";
import Button from "../components/ui/Button";
import Table from "../components/ui/Table";
import { formatDate } from "../utils/dateUtils";
import type { Contribution } from "../types/contribution";
import LoadingSpinner from "../components/ui/LoadingSpinner";

const COLORS = ["#4F46E5", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  totalContributions: number;
  approvedContributions: number;
  pendingContributions: number;
  rejectedContributions: number;
  monthlyContributions: number;
  totalPayouts: number;
}

interface ContributionsByType {
  name: string;
  value: number;
}

const Dashboard: React.FC = () => {
  const { userDetails, isAdmin } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalMembers: 0,
    activeMembers: 0,
    totalContributions: 0,
    approvedContributions: 0,
    pendingContributions: 0,
    rejectedContributions: 0,
    monthlyContributions: 0,
    totalPayouts: 0,
  });
  const [contributionsByType, setContributionsByType] = useState<
    ContributionsByType[]
  >([]);
  const [pendingContributions, setPendingContributions] = useState<
    Contribution[]
  >([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const contributionsRef = collection(db, "contributions");

      // Query for contributions based on user role
      const contributionsQuery = isAdmin
        ? query(contributionsRef)
        : query(contributionsRef, where("member_id", "==", userDetails?.id));

      const contributionsSnapshot = await getDocs(contributionsQuery);
      const contributions = await Promise.all(
        contributionsSnapshot.docs.map(async (doc) => {
          const data = doc.data();
          const memberDoc = await getDocs(collection(db, "members"));
          const member = memberDoc.docs.find((m) => m.id === data.member_id);

          return {
            id: doc.id,
            ...data,
            members: {
              full_name: member?.data()?.full_name || "Unknown Member",
            },
          } as Contribution;
        })
      );

      // Calculate stats
      const approved = contributions.filter((c) => c.status === "approved");
      const pending = contributions.filter((c) => c.status === "pending");
      const rejected = contributions.filter((c) => c.status === "rejected");

      // Calculate contributions by type (only approved contributions)
      const typeMap = new Map<string, number>();
      approved.forEach((contribution) => {
        const current = typeMap.get(contribution.type) || 0;
        typeMap.set(contribution.type, current + contribution.amount);
      });

      const chartData = Array.from(typeMap.entries()).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      }));

      setContributionsByType(chartData);
      setPendingContributions(pending);

      // Update stats
      setStats({
        totalMembers: isAdmin
          ? (await getDocs(collection(db, "members"))).size
          : 0,
        activeMembers: isAdmin
          ? (
              await getDocs(
                query(
                  collection(db, "members"),
                  where("status", "==", "active")
                )
              )
            ).size
          : 0,
        totalContributions: approved.reduce((sum, c) => sum + c.amount, 0),
        approvedContributions: approved.length,
        pendingContributions: pending.length,
        rejectedContributions: rejected.length,
        monthlyContributions: approved
          .filter((c) => c.type === "monthly")
          .reduce((sum, c) => sum + c.amount, 0),
        totalPayouts: 0, // You can add payout calculation here if needed
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userDetails?.id) {
      fetchDashboardData();
    }
  }, [userDetails?.id, isAdmin]);

  const renderAdminDashboard = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Members" value={stats.totalMembers.toString()} />
        <StatCard
          title="Active Members"
          value={stats.activeMembers.toString()}
        />
        <StatCard
          title="Total Contributions"
          value={`R ${stats.totalContributions.toFixed(2)}`}
        />
        <StatCard
          title="Monthly Contributions"
          value={`R ${stats.monthlyContributions.toFixed(2)}`}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Pending Contributions"
          value={stats.pendingContributions.toString()}
          className="bg-yellow-50"
        />
        <StatCard
          title="Approved Contributions"
          value={stats.approvedContributions.toString()}
          className="bg-green-50"
        />
        <StatCard
          title="Rejected Contributions"
          value={stats.rejectedContributions.toString()}
          className="bg-red-50"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">
            Approved Contributions by Type
          </h3>
          <div className="h-[300px]">
            <PieChart width={400} height={300}>
              <Pie
                data={contributionsByType}
                cx={200}
                cy={150}
                innerRadius={60}
                outerRadius={100}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
                label={({ name, value }) => `${name}: R ${value.toFixed(2)}`}
              >
                {contributionsByType.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">
            Recent Pending Contributions
          </h3>
          <Table headers={["Date", "Member", "Type", "Amount"]}>
            {pendingContributions.slice(0, 5).map((contribution) => (
              <tr key={contribution.id}>
                <td className="px-6 py-4">{formatDate(contribution.date)}</td>
                <td className="px-6 py-4">{contribution.members?.full_name}</td>
                <td className="px-6 py-4 capitalize">{contribution.type}</td>
                <td className="px-6 py-4">
                  R {contribution.amount.toFixed(2)}
                </td>
              </tr>
            ))}
          </Table>
        </div>
      </div>
    </>
  );

  const renderMemberDashboard = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total Approved Contributions"
          value={`R ${stats.totalContributions.toFixed(2)}`}
        />
        <StatCard
          title="Pending Contributions"
          value={stats.pendingContributions.toString()}
          className="bg-yellow-50"
        />
        <StatCard
          title="Rejected Contributions"
          value={stats.rejectedContributions.toString()}
          className="bg-red-50"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">
            My Contributions by Type
          </h3>
          <div className="h-[300px]">
            <PieChart width={400} height={300}>
              <Pie
                data={contributionsByType}
                cx={200}
                cy={150}
                innerRadius={60}
                outerRadius={100}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
                label={({ name, value }) => `${name}: R ${value.toFixed(2)}`}
              >
                {contributionsByType.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">
            My Pending Contributions
          </h3>
          <Table headers={["Date", "Type", "Amount"]}>
            {pendingContributions.slice(0, 5).map((contribution) => (
              <tr key={contribution.id}>
                <td className="px-6 py-4">{formatDate(contribution.date)}</td>
                <td className="px-6 py-4 capitalize">{contribution.type}</td>
                <td className="px-6 py-4">
                  R {contribution.amount.toFixed(2)}
                </td>
              </tr>
            ))}
          </Table>
        </div>
      </div>
    </>
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Dashboard</h2>
      </div>
      {isAdmin ? renderAdminDashboard() : renderMemberDashboard()}
    </div>
  );
};

export default Dashboard;
