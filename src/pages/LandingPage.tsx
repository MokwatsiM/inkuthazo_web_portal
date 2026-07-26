import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Banknote,
  BarChart3,
  Calendar,
  CalendarClock,
  ClipboardList,
  Code,
  CreditCard,
  FileText,
  Gift,
  HandCoins,
  Home,
  LogOut,
  QrCode,
  Receipt,
  Settings,
  Shield,
  ShieldCheck,
  TrendingUp,
  Users,
  UserX,
} from 'lucide-react';
import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Avatar from '../components/avatar/Avatar';
import Button from '../components/ui/Button';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import { ResourceType } from '../types/role';
import logger from '../utils/logger';

// All available navigation tiles with their resource permissions.
// Defined at module scope so it is a stable reference across renders
// (rebuilding it each render defeats the useMemo below and can feed render
// loops in consumers).
const allNavigationTiles = [
    { title: 'Home', description: 'Overview and quick insights', icon: Home, iconBg: 'bg-slate-50 dark:bg-slate-700', iconColor: 'text-slate-700 dark:text-slate-200', badge: null, link: '/home', resource: 'home' as ResourceType },
    { title: 'Members', description: 'Manage member records', icon: Users, iconBg: 'bg-indigo-50 dark:bg-indigo-900/50', iconColor: 'text-indigo-600 dark:text-indigo-300', badge: null, link: '/members', resource: 'members' as ResourceType },
    { title: 'Payouts', description: 'Disbursements and status', icon: Banknote, iconBg: 'bg-green-50 dark:bg-green-900/50', iconColor: 'text-green-600 dark:text-green-300', badge: null, link: '/payouts', resource: 'payouts' as ResourceType },
    { title: 'Claims', description: 'Approvals, reviews, audits', icon: ShieldCheck, iconBg: 'bg-amber-50 dark:bg-amber-900/50', iconColor: 'text-amber-600 dark:text-amber-300', badge: null, link: '/claims', resource: 'claims' as ResourceType },
    { title: 'Expenses', description: 'Track and reconcile', icon: Receipt, iconBg: 'bg-rose-50 dark:bg-rose-900/50', iconColor: 'text-rose-600 dark:text-rose-300', badge: null, link: '/expenses', resource: 'expenses' as ResourceType },
    { title: 'Donations', description: 'Investments & contributions', icon: Gift, iconBg: 'bg-purple-50 dark:bg-purple-900/50', iconColor: 'text-purple-600 dark:text-purple-300', badge: null, link: '/donations', resource: 'donations' as ResourceType },
    { title: 'Credits', description: 'Member loans & repayments', icon: HandCoins, iconBg: 'bg-green-50 dark:bg-green-900/50', iconColor: 'text-green-600 dark:text-green-300', badge: null, link: '/credits', resource: 'credits' as ResourceType },
    { title: 'Credit Reviews', description: 'Approve credit requests', icon: ClipboardList, iconBg: 'bg-teal-50 dark:bg-teal-900/50', iconColor: 'text-teal-600 dark:text-teal-300', badge: null, link: '/credit-reviews', resource: 'credit_reviews' as ResourceType },
    { title: 'Disciplinary', description: 'Cases and resolutions', icon: AlertTriangle, iconBg: 'bg-orange-50 dark:bg-orange-900/50', iconColor: 'text-orange-600 dark:text-orange-300', badge: null, link: '/disciplinary', resource: 'disciplinary' as ResourceType },
    { title: 'Calendar', description: 'Events and deadlines', icon: Calendar, iconBg: 'bg-sky-50 dark:bg-sky-900/50', iconColor: 'text-sky-600 dark:text-sky-300', badge: null, link: '/calendar', resource: 'calendar' as ResourceType },
    { title: 'Host Assignments', description: 'Scheduling & shifts', icon: CalendarClock, iconBg: 'bg-cyan-50 dark:bg-cyan-900/50', iconColor: 'text-cyan-600 dark:text-cyan-300', badge: null, link: '/host-assignments', resource: 'host_assignments' as ResourceType },
    { title: 'Attendance', description: 'QR check-ins & tracking', icon: QrCode, iconBg: 'bg-teal-50 dark:bg-teal-900/50', iconColor: 'text-teal-600 dark:text-teal-300', badge: 'New', link: '/attendance', resource: 'calendar' as ResourceType },
    { title: 'Analytics', description: 'Performance overview', icon: BarChart3, iconBg: 'bg-violet-50 dark:bg-violet-900/50', iconColor: 'text-violet-600 dark:text-violet-300', badge: null, link: '/analytics', resource: 'analytics' as ResourceType },
    { title: 'Advanced Analytics', description: 'Cohorts, funnels, forecasts', icon: TrendingUp, iconBg: 'bg-purple-50 dark:bg-purple-900/50', iconColor: 'text-purple-600 dark:text-purple-300', badge: 'Beta', link: '/advanced-analytics', resource: 'advanced_analytics' as ResourceType },
    { title: 'Reports', description: 'Exports and summaries', icon: FileText, iconBg: 'bg-slate-100 dark:bg-slate-700', iconColor: 'text-slate-700 dark:text-slate-200', badge: null, link: '/reports', resource: 'reports' as ResourceType },
    { title: 'Deletion Requests', description: 'Privacy and compliance', icon: UserX, iconBg: 'bg-pink-50 dark:bg-pink-900/50', iconColor: 'text-pink-600 dark:text-pink-300', badge: null, link: '/deletion-requests', resource: 'deletion_requests' as ResourceType },
    { title: 'Configuration', description: 'Preferences and setup', icon: Settings, iconBg: 'bg-slate-50 dark:bg-slate-700', iconColor: 'text-slate-700 dark:text-slate-200', badge: null, link: '/configuration', resource: 'configuration' as ResourceType },
    { title: 'Audit Log', description: 'Audit Trail', icon: Activity, iconBg: 'bg-indigo-50 dark:bg-indigo-900/50', iconColor: 'text-indigo-600 dark:text-indigo-300', badge: null, link: '/audit-logs', resource: 'audit_logs' as ResourceType },
    { title: 'Role Management', description: 'Manage roles & permissions', icon: Shield, iconBg: 'bg-blue-50 dark:bg-blue-900/50', iconColor: 'text-blue-600 dark:text-blue-300', badge: null, link: '/role-management', resource: 'role_management' as ResourceType },
    { title: 'My Contributions', description: 'View your payment history', icon: CreditCard, iconBg: 'bg-emerald-50 dark:bg-emerald-900/50', iconColor: 'text-emerald-600 dark:text-emerald-300', badge: null, link: '/my-contributions', resource: 'my_contributions' as ResourceType },
    { title: 'My Donations', description: 'My Investments & contributions', icon: Gift, iconBg: 'bg-purple-50 dark:bg-purple-900/50', iconColor: 'text-purple-600 dark:text-purple-300', badge: null, link: '/my-donations', resource: 'my_donations' as ResourceType },
    { title: 'My Credit', description: 'View your credit & payments', icon: HandCoins, iconBg: 'bg-green-50 dark:bg-green-900/50', iconColor: 'text-green-600 dark:text-green-300', badge: null, link: '/my-credit', resource: 'my_credit' as ResourceType },
  { title: 'My Hosting Schedule', description: 'View your hosting duties', icon: CalendarClock, iconBg: 'bg-cyan-50 dark:bg-cyan-900/50', iconColor: 'text-cyan-600 dark:text-cyan-300', badge: null, link: '/my-hosting-schedule', resource: 'my_hosting_schedule' as ResourceType },
];

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { signOut, userDetails } = useAuth();
  const { canView } = usePermissions();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth/login');
    } catch (error) {
      logger.error('Error signing out:', error);
    }
  };

  // Filter tiles based on user's permissions
  const navigationTiles = useMemo(() => {
    return allNavigationTiles.filter(tile => canView(tile.resource));
  }, [canView]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Navigation Bar - Same as original Layout */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="flex items-center space-x-2">
                <img
                  src="/logo.png"
                  alt="Logo"
                  className="h-8 w-8 text-brand-600 dark:text-brand-400"
                />
                <h1 className="text-xl font-bold text-text-primary dark:text-text-primary-dark">
                  Inkuthazo Portal
                </h1>
              </div>
              {/* Version Badge */}
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                <Code className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">
                  v{import.meta.env.VITE_APP_VERSION}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <ThemeToggle variant="button" />
              {userDetails && (
                <div className="flex items-center space-x-3">
                  <Link to={`/members/${userDetails.id}`} className="relative group">
                    <Avatar member={userDetails} size="sm" />
                    <div className="absolute inset-0 rounded-full ring-2 ring-transparent group-hover:ring-brand-500 transition-all duration-200" />
                  </Link>
                  <div className="hidden md:block text-sm">
                    <p className="font-medium text-gray-700 dark:text-gray-200">
                      {userDetails.full_name}
                    </p>
                    <p className="text-gray-500 dark:text-gray-400 text-xs capitalize">
                      {userDetails.role}
                    </p>
                  </div>
                </div>
              )}
              <Button
                variant="secondary"
                icon={LogOut}
                onClick={handleSignOut}
                className="flex items-center hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200"
              >
                <span className="hidden md:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-50 to-teal-50 dark:from-gray-800 dark:to-gray-900">
        <div className="absolute inset-0 -z-10">
          <img
            src="/group_photo.jpg"
            alt="Mountains"
            className="w-full h-full object-cover opacity-10 dark:opacity-5"
          />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-[24px] p-8 md:p-12 text-white shadow-xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-3">
              Welcome back, {userDetails?.full_name?.split(' ')[0] || "User"}!
            </h1>
            <p className="text-lg text-purple-100 mb-6">
              {userDetails?.role === 'admin'
                ? 'Administrator Dashboard'
                : userDetails?.role === 'chairperson'
                  ? 'Chairperson Dashboard'
                  : 'Member Portal'} •
              {userDetails?.join_date
                ? ` Member since ${new Date(userDetails.join_date.toDate()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
                : ''}
            </p>
            <div className="flex gap-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3">
                <p className="text-sm text-purple-100">Today</p>
                <p className="text-xl font-bold">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3">
                <p className="text-sm text-purple-100">Status</p>
                <p className="text-xl font-bold">Active</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Grid Navigation */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 -mt-8">
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Quick Access Menu</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Navigate to any section of the portal</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {navigationTiles.map((tile) => {
            const Icon = tile.icon;
            return (
              <Link
                key={tile.title}
                to={tile.link}
                className="group relative rounded-[20px] bg-white dark:bg-surface-dark p-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_35px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between">
                    <div className={`h-12 w-12 rounded-xl ${tile.iconBg} flex items-center justify-center shadow-md`}>
                      <Icon className={`h-6 w-6 ${tile.iconColor}`} />
                    </div>
                    <ArrowUpRight className="h-5 w-5 text-gray-300 dark:text-gray-600 group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white">{tile.title}</h3>
                      {tile.badge && (
                        <span
                          className="inline-flex items-center rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 text-[10px] font-medium px-2 py-0.5"
                        >
                          {tile.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{tile.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Visual Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="rounded-[20px] overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_35px_rgba(0,0,0,0.08)] transition-all duration-300">
            <img
              src="/group_photo.jpg"
              alt="Club photo"
              className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div className="rounded-[20px] overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_35px_rgba(0,0,0,0.08)] transition-all duration-300">
            <img
              src="/group_photo_2.jpg"
              alt="Club event"
              className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div className="rounded-[20px] overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_35px_rgba(0,0,0,0.08)] transition-all duration-300">
            <img
              src="/group_3.jpeg"
              alt="Club gathering"
              className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
