import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';
import StatCard from '../components/stats/StatCard';
import Button from '../components/ui/Button';

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const Dashboard: React.FC = () => {
  const { userDetails, isAdmin } = useAuth();
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    monthlyContributions: 0,
    pendingPayouts: 0,
    totalContributions: 0,
    totalPayouts: 0
  });
  const [contributionsByType, setContributionsByType] = useState<{ name: string; value: number }[]>([]);
  const [payoutsByStatus, setPayoutsByStatus] = useState<{ name: string; value: number }[]>([]);
  const [dateRange, setDateRange] = useState({
    startDate: format(subMonths(new Date(), 5), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });

  const fetchDashboardData = async () => {
    try {
      const start = startOfMonth(parseISO(dateRange.startDate));
      const end = endOfMonth(parseISO(dateRange.endDate));

      if (isAdmin) {
        // Admin dashboard data
        const membersRef = collection(db, 'members');
        const membersSnapshot = await getDocs(membersRef);
        const activeMembers = membersSnapshot.docs.filter(doc => doc.data().status === 'active').length;

        const contributionsRef = collection(db, 'contributions');
        const payoutsRef = collection(db, 'payouts');

        // Get all contributions and payouts
        const [allContributions, allPayouts] = await Promise.all([
          getDocs(contributionsRef),
          getDocs(payoutsRef)
        ]);

        // Calculate contributions by type
        const contributionTypes = new Map<string, number>();
        allContributions.docs.forEach(doc => {
          const data = doc.data();
          const type = data.type;
          contributionTypes.set(type, (contributionTypes.get(type) || 0) + data.amount);
        });

        setContributionsByType(Array.from(contributionTypes.entries()).map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value
        })));

        // Calculate payouts by status
        const payoutStatuses = new Map<string, number>();
        allPayouts.docs.forEach(doc => {
          const data = doc.data();
          const status = data.status;
          payoutStatuses.set(status, (payoutStatuses.get(status) || 0) + data.amount);
        });

        setPayoutsByStatus(Array.from(payoutStatuses.entries()).map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value
        })));

        // Calculate totals
        const totalContributions = allContributions.docs.reduce((sum, doc) => sum + doc.data().amount, 0);
        const totalPayouts = allPayouts.docs.reduce((sum, doc) => sum + doc.data().amount, 0);
        const pendingPayouts = allPayouts.docs
          .filter(doc => doc.data().status === 'pending')
          .reduce((sum, doc) => sum + doc.data().amount, 0);

        // Current month contributions
        const currentMonthStart = startOfMonth(new Date());
        const monthlyContributions = allContributions.docs
          .filter(doc => doc.data().date.toDate() >= currentMonthStart)
          .reduce((sum, doc) => sum + doc.data().amount, 0);

        setStats({
          totalMembers: membersSnapshot.size,
          activeMembers,
          monthlyContributions,
          pendingPayouts,
          totalContributions,
          totalPayouts
        });
      } else if (userDetails?.id) {
        // Member dashboard data
        const contributionsRef = collection(db, 'contributions');
        const payoutsRef = collection(db, 'payouts');

        const memberContributionsQuery = query(
          contributionsRef,
          where('member_id', '==', userDetails.id)
        );

        const memberPayoutsQuery = query(
          payoutsRef,
          where('member_id', '==', userDetails.id)
        );

        const [contributionsSnapshot, payoutsSnapshot] = await Promise.all([
          getDocs(memberContributionsQuery),
          getDocs(memberPayoutsQuery)
        ]);

        // Calculate member's contributions by type
        const contributionTypes = new Map<string, number>();
        contributionsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          const type = data.type;
          contributionTypes.set(type, (contributionTypes.get(type) || 0) + data.amount);
        });

        setContributionsByType(Array.from(contributionTypes.entries()).map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value
        })));

        // Calculate member's payouts by status
        const payoutStatuses = new Map<string, number>();
        payoutsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          const status = data.status;
          payoutStatuses.set(status, (payoutStatuses.get(status) || 0) + data.amount);
        });

        setPayoutsByStatus(Array.from(payoutStatuses.entries()).map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value
        })));

        // Calculate totals for member
        const totalContributions = contributionsSnapshot.docs.reduce(
          (sum, doc) => sum + doc.data().amount,
          0
        );

        const totalPayouts = payoutsSnapshot.docs.reduce(
          (sum, doc) => sum + doc.data().amount,
          0
        );

        const pendingPayouts = payoutsSnapshot.docs
          .filter(doc => doc.data().status === 'pending')
          .reduce((sum, doc) => sum + doc.data().amount, 0);

        setStats({
          totalMembers: 0,
          activeMembers: 0,
          monthlyContributions: 0,
          pendingPayouts,
          totalContributions,
          totalPayouts
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange, userDetails?.id, isAdmin]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded shadow">
          <p className="font-semibold">{payload[0].name}</p>
          <p className="text-gray-600">R {payload[0].value.toFixed(2)}</p>
        </div>
      );
    }
    return null;
  };

  const renderAdminDashboard = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Total Members" value={stats.totalMembers} />
        <StatCard title="Active Members" value={stats.activeMembers} />
        <StatCard title="Monthly Contributions" value={`R ${stats.monthlyContributions.toFixed(2)}`} />
        <StatCard title="Pending Payouts" value={`R ${stats.pendingPayouts.toFixed(2)}`} />
        <StatCard title="Total Contributions" value={`R ${stats.totalContributions.toFixed(2)}`} />
        <StatCard title="Total Payouts" value={`R ${stats.totalPayouts.toFixed(2)}`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Contributions by Type</h3>
          <div className="flex justify-center">
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
                {contributionsByType.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Payouts by Status</h3>
          <div className="flex justify-center">
            <PieChart width={400} height={300}>
              <Pie
                data={payoutsByStatus}
                cx={200}
                cy={150}
                innerRadius={60}
                outerRadius={100}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
                label={({ name, value }) => `${name}: R ${value.toFixed(2)}`}
              >
                {payoutsByStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </div>
        </div>
      </div>
    </>
  );

  const renderMemberDashboard = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <StatCard title="Total Contributions" value={`R ${stats.totalContributions.toFixed(2)}`} />
        <StatCard title="Total Payouts" value={`R ${stats.totalPayouts.toFixed(2)}`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">My Contributions by Type</h3>
          <div className="flex justify-center">
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
                {contributionsByType.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">My Payouts by Status</h3>
          <div className="flex justify-center">
            <PieChart width={400} height={300}>
              <Pie
                data={payoutsByStatus}
                cx={200}
                cy={150}
                innerRadius={60}
                outerRadius={100}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
                label={({ name, value }) => `${name}: R ${value.toFixed(2)}`}
              >
                {payoutsByStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        {isAdmin && (
          <div className="flex gap-4 items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div className="self-end">
              <Button onClick={fetchDashboardData}>
                Update
              </Button>
            </div>
          </div>
        )}
      </div>
      {isAdmin ? renderAdminDashboard() : renderMemberDashboard()}
    </div>
  );
};

export default Dashboard;