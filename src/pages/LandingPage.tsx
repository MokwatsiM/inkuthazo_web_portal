import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Home,
  Users,
  CreditCard,
  Banknote,
  ShieldCheck,
  Receipt,
  AlertTriangle,
  Calendar,
  CalendarClock,
  BarChart3,
  TrendingUp,
  FileText,
  UserX,
  Settings,
  ArrowUpRight,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/ui/Button';
import Avatar from '../components/avatar/Avatar';
import { ThemeToggle } from '../components/ui/ThemeToggle';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { signOut, userDetails, isAdmin } = useAuth();

  useEffect(() => {
    // Add external scripts for fonts if needed
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const adminNavigationTiles = [
    {
      title: 'Home',
      description: 'Overview and quick insights',
      icon: Home,
      iconBg: 'bg-slate-50 dark:bg-slate-700',
      iconColor: 'text-slate-700 dark:text-slate-200',
      badge: null,
      link: '/home',
    },
    {
      title: 'Members',
      description: 'Manage member records',
      icon: Users,
      iconBg: 'bg-indigo-50 dark:bg-indigo-900/50',
      iconColor: 'text-indigo-600 dark:text-indigo-300',
      badge: null,
      badgeBg: 'bg-indigo-50',
      badgeColor: 'text-indigo-600',
      link: '/members',
    },
    {
      title: 'Payouts',
      description: 'Disbursements and status',
      icon: Banknote,
      iconBg: 'bg-green-50 dark:bg-green-900/50',
      iconColor: 'text-green-600 dark:text-green-300',
      badge: null,
      badgeBg: 'bg-green-50',
      badgeColor: 'text-green-600',
      link: '/payouts',
    },
    {
      title: 'Claims',
      description: 'Approvals, reviews, audits',
      icon: ShieldCheck,
      iconBg: 'bg-amber-50 dark:bg-amber-900/50',
      iconColor: 'text-amber-600 dark:text-amber-300',
      badge: null,
      badgeBg: 'bg-amber-50',
      badgeColor: 'text-amber-700',
      link: '/claims',
    },
    {
      title: 'Expenses',
      description: 'Track and reconcile',
      icon: Receipt,
      iconBg: 'bg-rose-50 dark:bg-rose-900/50',
      iconColor: 'text-rose-600 dark:text-rose-300',
      badge: null,
      link: '/expenses',
    },
    {
      title: 'Disciplinary',
      description: 'Cases and resolutions',
      icon: AlertTriangle,
      iconBg: 'bg-orange-50 dark:bg-orange-900/50',
      iconColor: 'text-orange-600 dark:text-orange-300',
      badge: null,
      badgeBg: 'bg-orange-50',
      badgeColor: 'text-orange-700',
      link: '/disciplinary',
    },
    {
      title: 'Calendar',
      description: 'Events and deadlines',
      icon: Calendar,
      iconBg: 'bg-sky-50 dark:bg-sky-900/50',
      iconColor: 'text-sky-600 dark:text-sky-300',
      badge: null,
      link: '/calendar',
    },
    {
      title: 'Host Assignments',
      description: 'Scheduling & shifts',
      icon: CalendarClock,
      iconBg: 'bg-cyan-50 dark:bg-cyan-900/50',
      iconColor: 'text-cyan-600 dark:text-cyan-300',
      badge: null,
      badgeBg: 'bg-cyan-50',
      badgeColor: 'text-cyan-700',
      link: '/host-assignments',
    },
    {
      title: 'Analytics',
      description: 'Performance overview',
      icon: BarChart3,
      iconBg: 'bg-violet-50 dark:bg-violet-900/50',
      iconColor: 'text-violet-600 dark:text-violet-300',
      badge: null,
      link: '/analytics',
    },
    {
      title: 'Advanced Analytics',
      description: 'Cohorts, funnels, forecasts',
      icon: TrendingUp,
      iconBg: 'bg-purple-50 dark:bg-purple-900/50',
      iconColor: 'text-purple-600 dark:text-purple-300',
      badge: 'Beta',
      badgeBg: 'bg-purple-100',
      badgeColor: 'text-purple-700',
      link: '/advanced-analytics',
    },
    {
      title: 'Reports',
      description: 'Exports and summaries',
      icon: FileText,
      iconBg: 'bg-slate-100 dark:bg-slate-700',
      iconColor: 'text-slate-700 dark:text-slate-200',
      badge: null,
      link: '/reports',
    },
    {
      title: 'Deletion Requests',
      description: 'Privacy and compliance',
      icon: UserX,
      iconBg: 'bg-pink-50 dark:bg-pink-900/50',
      iconColor: 'text-pink-600 dark:text-pink-300',
      badge: null,
      badgeBg: 'bg-pink-50',
      badgeColor: 'text-pink-700',
      link: '/deletion-requests',
    },
    {
      title: 'Configuration',
      description: 'Preferences and setup',
      icon: Settings,
      iconBg: 'bg-slate-50 dark:bg-slate-700',
      iconColor: 'text-slate-700 dark:text-slate-200',
      badge: null,
      link: '/configuration',
    },
  ];

  const memberNavigationTiles = [
    {
      title: 'Home',
      description: 'Overview and quick insights',
      icon: Home,
      iconBg: 'bg-slate-50 dark:bg-slate-700',
      iconColor: 'text-slate-700 dark:text-slate-200',
      badge: null,
      link: '/home',
    },
    {
      title: 'My Contributions',
      description: 'View your payment history',
      icon: CreditCard,
      iconBg: 'bg-emerald-50 dark:bg-emerald-900/50',
      iconColor: 'text-emerald-600 dark:text-emerald-300',
      badge: null,
      link: '/my-contributions',
    },
    {
      title: 'Calendar',
      description: 'Events and deadlines',
      icon: Calendar,
      iconBg: 'bg-sky-50 dark:bg-sky-900/50',
      iconColor: 'text-sky-600 dark:text-sky-300',
      badge: null,
      link: '/calendar',
    },
    {
      title: 'My Hosting Schedule',
      description: 'View your hosting duties',
      icon: CalendarClock,
      iconBg: 'bg-cyan-50 dark:bg-cyan-900/50',
      iconColor: 'text-cyan-600 dark:text-cyan-300',
      badge: null,
      badgeBg: 'bg-cyan-50',
      badgeColor: 'text-cyan-700',
      link: '/my-hosting-schedule',
    },
    {
      title: 'Disciplinary',
      description: 'Cases and resolutions',
      icon: AlertTriangle,
      iconBg: 'bg-orange-50 dark:bg-orange-900/50',
      iconColor: 'text-orange-600 dark:text-orange-300',
      badge: null,
      badgeBg: 'bg-orange-50',
      badgeColor: 'text-orange-700',
      link: '/disciplinary',
    },
  ];

  const navigationTiles = isAdmin ? adminNavigationTiles : memberNavigationTiles;

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
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img
           src="/group_photo.jpg"
            alt="Mountains"
            className="w-full h-full object-cover opacity-30 dark:opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white dark:from-gray-900 via-white/80 dark:via-gray-900/80 to-white dark:to-gray-900"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-gray-900 dark:text-white">Welcome</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Navigate the portal with quick-access tiles. Everything you need, organized in a responsive grid.
            </p>
          </div>
        </div>
      </section>

      {/* Grid Navigation */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="mt-2 mb-4 flex items-center justify-between">
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">Quick Access</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {navigationTiles.map((tile) => {
            const Icon = tile.icon;
            return (
              <Link
                key={tile.title}
                to={tile.link}
                className="group relative rounded-2xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 hover:shadow-md dark:hover:shadow-gray-900/50 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-xl ${tile.iconBg} flex items-center justify-center`}>
                      <Icon className={`h-5 w-5 ${tile.iconColor}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="text-base font-medium text-slate-900 dark:text-gray-100">{tile.title}</div>
                        {tile.badge && (
                          <span
                            className={`inline-flex items-center rounded-full ${tile.badgeBg} ${tile.badgeColor} dark:bg-purple-900/50 dark:text-purple-300 text-[10px] px-2 py-0.5`}
                          >
                            {tile.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 dark:text-gray-400">{tile.description}</p>
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-slate-300 dark:text-gray-600 group-hover:text-slate-400 dark:group-hover:text-gray-500" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Visual Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-8">
          <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-gray-700">
            <img
           src="/group_photo.jpg"
              alt="Minimal render"
              className="w-full h-40 object-cover dark:opacity-80"
            />
          </div>
          <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-gray-700">
            <img
             src="/group_photo_2.jpg"
              alt="3D abstract"
              className="w-full h-40 object-cover dark:opacity-80"
            />
          </div>
          <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-gray-700">
            <img
             src="/group_3.jpeg"
              alt="Mountains"
              className="w-full h-40 object-cover dark:opacity-80"
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
