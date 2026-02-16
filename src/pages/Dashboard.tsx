import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../config/firebase";
import { useAuth } from "../hooks/useAuth";
import KPICard from "../components/ui/KPICard";
import ActivityFeed from "../components/dashboard/ActivityFeed";
import QuickActions from "../components/dashboard/QuickActions";
import UpcomingEvents from "../components/dashboard/UpcomingEvents";
import AttendanceStats from "../components/dashboard/AttendanceStats";
import BulkImportModal from "../components/contributions/BulkImportModal";
import type { Contribution } from "../types/contribution";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import {
  Users, DollarSign, TrendingUp, Calendar, UserPlus,
  PlusCircle, BarChart3, Settings, Mail, Clock,
  AlertTriangle, Eye, Activity, ArrowUp, ArrowDown,
  Database
} from "lucide-react";
import { href } from "react-router-dom";

const COLORS = ["#4F46E5", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  pendingMembers: number;
  totalContributions: number;
  approvedContributions: number;
  pendingContributions: number;
  rejectedContributions: number;
  monthlyContributions: number;
  totalPayouts: number;
  thisMonthContributions: number;
  lastMonthContributions: number;
  contributionGrowth: number;
  memberGrowth: number;
}

interface ContributionsByType {
  name: string;
  value: number;
}

interface MonthlyData {
  month: string;
  contributions: number;
  members: number;
}

const Dashboard: React.FC = () => {
  const { userDetails, isAdmin } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalMembers: 0,
    activeMembers: 0,
    pendingMembers: 0,
    totalContributions: 0,
    approvedContributions: 0,
    pendingContributions: 0,
    rejectedContributions: 0,
    monthlyContributions: 0,
    totalPayouts: 0,
    thisMonthContributions: 0,
    lastMonthContributions: 0,
    contributionGrowth: 0,
    memberGrowth: 0,
  });
  const [contributionsByType, setContributionsByType] = useState<
    ContributionsByType[]
  >([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true); const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const contributionsRef = collection(db, "contributions");
      const membersRef = collection(db, "members");

      // Query for contributions based on user role
      const contributionsQuery = isAdmin
        ? query(contributionsRef)
        : query(contributionsRef, where("member_id", "==", userDetails?.id));

      const [contributionsSnapshot, membersSnapshot] = await Promise.all([
        getDocs(contributionsQuery),
        isAdmin ? getDocs(membersRef) : Promise.resolve(null)
      ]);

      // Process contributions
      const contributions = await Promise.all(
        contributionsSnapshot.docs.map(async (doc) => {
          const data = doc.data();
          let memberName = "Unknown Member";

          if (membersSnapshot) {
            const member = membersSnapshot.docs.find((m) => m.id === data.member_id);
            memberName = member?.data()?.full_name || "Unknown Member";
          }

          return {
            id: doc.id,
            ...data,
            members: { full_name: memberName },
          } as Contribution;
        })
      );

      // Calculate stats
      const approved = contributions.filter((c) => c.status === "approved");
      const pending = contributions.filter((c) => c.status === "pending");
      const rejected = contributions.filter((c) => c.status === "rejected");

      // Time-based calculations
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      const thisMonthContributions = approved.filter(c =>
        c.date.toDate() >= thisMonth
      ).reduce((sum, c) => sum + c.amount, 0);

      const lastMonthContributions = approved.filter(c =>
        c.date.toDate() >= lastMonth && c.date.toDate() <= lastMonthEnd
      ).reduce((sum, c) => sum + c.amount, 0);

      const contributionGrowth = lastMonthContributions > 0
        ? ((thisMonthContributions - lastMonthContributions) / lastMonthContributions * 100)
        : 0;

      // Calculate contributions by type
      const typeMap = new Map<string, number>();
      approved.forEach((contribution) => {
        const current = typeMap.get(contribution.type) || 0;
        typeMap.set(contribution.type, current + contribution.amount);
      });

      const chartData = Array.from(typeMap.entries()).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      }));

      // Generate monthly data for the last 6 months
      const monthlyData: MonthlyData[] = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        const monthName = monthStart.toLocaleDateString('en-US', { month: 'short' });

        const monthContributions = approved.filter(c => {
          const date = c.date.toDate();
          return date >= monthStart && date <= monthEnd;
        }).reduce((sum, c) => sum + c.amount, 0);

        monthlyData.push({
          month: monthName,
          contributions: monthContributions,
          members: 0 // Could add member count tracking
        });
      }

      // Generate mock recent activities
      const activities = contributions
        .sort((a, b) => b.date.toDate().getTime() - a.date.toDate().getTime())
        .slice(0, 10)
        .map(c => ({
          id: c.id,
          type: 'contribution' as const,
          title: `Contribution ${c.status}`,
          description: `${c.type} contribution of R${c.amount.toFixed(2)}`,
          timestamp: c.date.toDate(),
          status: c.status,
          amount: c.amount,
          user: c.members?.full_name
        }));

      // Mock upcoming events (you can replace with real data)
      const mockEvents = [
        {
          id: '1',
          title: 'Monthly Society Meeting',
          description: 'Regular monthly meeting to discuss society matters',
          date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          type: 'meeting' as const,
          venue: 'Community Hall',
          attendees: 25
        },
        {
          id: '2',
          title: 'Contribution Due Date',
          description: 'Monthly contributions are due',
          date: new Date(now.getFullYear(), now.getMonth() + 1, 1), // Next month
          type: 'reminder' as const
        }
      ];

      // Update all state
      setContributionsByType(chartData);
      setMonthlyData(monthlyData);
      setRecentActivities(activities);
      setUpcomingEvents(mockEvents);

      // Calculate member stats for admin
      let memberStats = { total: 0, active: 0, pending: 0, growth: 0 };
      if (isAdmin && membersSnapshot) {
        const members = membersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Array<{ id: string; status?: string;[key: string]: any }>;

        memberStats.total = members.length;
        memberStats.active = members.filter(m =>
          m.status === 'active' || m.status === 'approved'
        ).length;
        memberStats.pending = members.filter(m => m.status === 'pending').length;

        // Mock growth calculation - you could implement real tracking
        memberStats.growth = 5.2; // Mock 5.2% growth
      }

      setStats({
        totalMembers: memberStats.total,
        activeMembers: memberStats.active,
        pendingMembers: memberStats.pending,
        totalContributions: approved.reduce((sum, c) => sum + c.amount, 0),
        approvedContributions: approved.length,
        pendingContributions: pending.length,
        rejectedContributions: rejected.length,
        monthlyContributions: approved
          .filter((c) => c.type === "monthly")
          .reduce((sum, c) => sum + c.amount, 0),
        totalPayouts: 0,
        thisMonthContributions,
        lastMonthContributions,
        contributionGrowth,
        memberGrowth: memberStats.growth,
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('import') === 'true' && isAdmin) {
      setIsImportModalOpen(true);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [isAdmin]);
  const adminQuickActions = [
    {
      title: "Add New Member",
      description: "Invite a new member to the society",
      icon: UserPlus,
      href: "/members",
      color: 'blue' as const
    },
    {
      title: "Review Contributions",
      description: "Approve or reject pending contributions",
      icon: DollarSign,
      href: "/contributions",
      color: 'green' as const
    },
    {
      title: "Generate Reports",
      description: "Create financial and member reports",
      icon: BarChart3,
      href: "/reports",
      color: 'purple' as const
    },
    {
      title: "Schedule Meeting",
      description: "Plan upcoming society meetings",
      icon: Calendar,
      href: "/calendar",
      color: 'orange' as const
    },
    {
      title: "Manage Settings",
      description: "Configure society preferences",
      icon: Settings,
      href: "/configuration",
      color: 'red' as const
    },
    {
      title: "Audit Logs",
      description: "View system audit trail",
      icon: Activity,
      href: "/audit-logs",
      color: 'blue' as const
    }
    ,
    {
      title: "Bulk Migration",
      description: "Setup club with historical records",
      icon: Database,
      onClick: () => setIsImportModalOpen(true),
      color: 'indigo' as const
    }
  ];

  const renderAdminDashboard = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Members"
          value={stats.totalMembers}
          subtitle={`${stats.activeMembers} active`}
          icon={Users}
          gradient="blue"
          trend={{
            value: `${Math.abs(Math.round(stats.memberGrowth))}%`,
            isPositive: stats.memberGrowth > 0,
            icon: stats.memberGrowth > 0 ? ArrowUp : ArrowDown
          }}
        />
        <KPICard
          title="This Month"
          value={`R ${stats.thisMonthContributions.toFixed(2)}`}
          subtitle={`R ${stats.totalContributions.toFixed(2)} total`}
          icon={DollarSign}
          gradient="green"
          trend={{
            value: `${Math.abs(Math.round(stats.contributionGrowth))}%`,
            isPositive: stats.contributionGrowth > 0,
            icon: stats.contributionGrowth > 0 ? ArrowUp : ArrowDown
          }}
        />
        <KPICard
          title="Pending Reviews"
          value={stats.pendingContributions}
          subtitle={`${stats.pendingMembers} member approvals`}
          icon={AlertTriangle}
          gradient="amber"
        />
        <KPICard
          title="Monthly Contributions"
          value={`R ${stats.monthlyContributions.toFixed(2)}`}
          subtitle={`${stats.approvedContributions} approved`}
          icon={TrendingUp}
          gradient="purple"
        />
      </div>

      {/* Quick Actions */}
      <QuickActions actions={adminQuickActions} />

      {/* Attendance Statistics */}
      <div className="bg-white dark:bg-surface-dark rounded-[20px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Attendance Tracking
        </h3>
        <AttendanceStats />
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <div className="bg-white dark:bg-surface-dark rounded-[20px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
            Monthly Contribution Trends
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="month"
                  className="text-gray-600 dark:text-gray-400"
                />
                <YAxis className="text-gray-600 dark:text-gray-400" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '12px'
                  }}
                />
                <Bar dataKey="contributions" fill="url(#colorGradient)" radius={[8, 8, 0, 0]} />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7C5CFC" stopOpacity={1} />
                    <stop offset="100%" stopColor="#6D28D9" stopOpacity={1} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Contributions by Type */}
        <div className="bg-white dark:bg-surface-dark rounded-[20px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
            Contributions by Type
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={contributionsByType}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
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
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity and Upcoming Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityFeed
          activities={recentActivities.map(activity => ({
            id: activity.id,
            type: activity.type,
            title: activity.title,
            description: activity.description,
            timestamp: activity.timestamp,
            user: activity.user
          }))}
          maxItems={8}
        />
        <UpcomingEvents events={upcomingEvents} />
      </div>
    </div>
  );

  const memberQuickActions = [
    {
      title: "Add Contribution",
      description: "Record a new contribution",
      icon: PlusCircle,
      href: "/my-contributions",
      color: 'green' as const
    },
    {
      title: "View My Contributions",
      description: "See your contribution history",
      icon: Eye,
      href: "/my-contributions",
      color: 'blue' as const
    },
    // {
    //   title: "Bulk Migration",
    //   description: "Setup club with historical records",
    //   icon: Database,
    //   onClick: () => setIsImportModalOpen(true),
    //   color: 'indigo' as const
    // },
    {
      title: "Upcoming Events",
      description: "Check events and meetings",
      icon: Calendar,
      href: "/calendar",
      color: 'purple' as const
    },
    {
      title: "Contact Support",
      description: "Get help from administrators",
      icon: Mail,
      onClick: () => {
        window.location.href = 'mailto:inkuthazoburialclub@gmail.com';
      },
      color: 'orange' as const
    }
  ];

  const renderMemberDashboard = () => (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-[20px] p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {userDetails?.full_name?.split(' ')[0] || "Member"}!
        </h1>
        <p className="text-purple-100">
          {userDetails?.join_date
            ? `Member since ${new Date(userDetails.join_date.toDate()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
            : "Member"}
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <KPICard
          title="Total Contributions"
          value={`R ${stats.totalContributions.toFixed(2)}`}
          subtitle={`${stats.approvedContributions} approved`}
          icon={DollarSign}
          gradient="green"
        />
        <KPICard
          title="Pending Reviews"
          value={stats.pendingContributions}
          subtitle="Awaiting approval"
          icon={Clock}
          gradient="amber"
        />
        <KPICard
          title="This Month"
          value={`R ${stats.thisMonthContributions.toFixed(2)}`}
          subtitle="Your contributions"
          icon={TrendingUp}
          gradient="blue"
        />
      </div>

      {/* Quick Actions */}
      <QuickActions actions={memberQuickActions} title="What would you like to do?" />

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contributions by Type */}
        <div className="bg-white dark:bg-surface-dark rounded-[20px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
            My Contributions by Type
          </h3>
          {contributionsByType.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={contributionsByType}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
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
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px] text-center">
              <DollarSign className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                No contributions recorded yet
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                Start by adding your first contribution
              </p>
            </div>
          )}
        </div>

        {/* Monthly Progress */}
        <div className="bg-white dark:bg-surface-dark rounded-[20px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
            Monthly Progress
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="month"
                  className="text-gray-600 dark:text-gray-400"
                />
                <YAxis className="text-gray-600 dark:text-gray-400" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '12px'
                  }}
                />
                <Bar dataKey="contributions" fill="url(#colorGradientGreen)" radius={[8, 8, 0, 0]} />
                <defs>
                  <linearGradient id="colorGradientGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={1} />
                    <stop offset="100%" stopColor="#059669" stopOpacity={1} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity and Upcoming Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityFeed
          activities={recentActivities.map(activity => ({
            id: activity.id,
            type: activity.type,
            title: activity.title,
            description: activity.description,
            timestamp: activity.timestamp,
            user: activity.user
          }))}
          maxItems={8}
        />
        <UpcomingEvents
          events={upcomingEvents}
          title="Upcoming Society Events"
        />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isAdmin ? renderAdminDashboard() : renderMemberDashboard()}

      <BulkImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => fetchDashboardData()}
      />
    </div>
  );
};

export default Dashboard;
