import React, { useEffect, useState } from "react";
import DashboardBarChart from "../components/dashboard/DashboardBarChart";
import DashboardPieChart from "../components/dashboard/DashboardPieChart";
import { useAuth } from "../hooks/useAuth";
import { useDashboardData } from "../hooks/useDashboardData";
import KPICard from "../components/ui/KPICard";
import ActivityFeed from "../components/dashboard/ActivityFeed";
import QuickActions from "../components/dashboard/QuickActions";
import UpcomingEvents from "../components/dashboard/UpcomingEvents";
import AttendanceStats from "../components/dashboard/AttendanceStats";
import BulkImportModal from "../components/contributions/BulkImportModal";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import {
  Users, DollarSign, TrendingUp, Calendar, UserPlus,
  PlusCircle, BarChart3, Settings, Mail, Clock,
  AlertTriangle, Eye, Activity, ArrowUp, ArrowDown,
  Database
} from "lucide-react";

const COLORS = ["#4F46E5", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

const Dashboard: React.FC = () => {
  const { userDetails, isAdmin } = useAuth();
  const {
    stats,
    contributionsByType,
    monthlyData,
    recentActivities,
    upcomingEvents,
    loading,
    refetch,
  } = useDashboardData();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

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
            <DashboardBarChart data={monthlyData} color="#7C5CFC" />
          </div>
        </div>

        {/* Contributions by Type */}
        <div className="bg-white dark:bg-surface-dark rounded-[20px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
            Contributions by Type
          </h3>
          <div className="h-[300px]">
            <DashboardPieChart data={contributionsByType} colors={COLORS} />
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
              <DashboardPieChart data={contributionsByType} colors={COLORS} />
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
            <DashboardBarChart data={monthlyData} color="#10B981" />
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
        onSuccess={() => refetch()}
      />
    </div>
  );
};

export default Dashboard;
