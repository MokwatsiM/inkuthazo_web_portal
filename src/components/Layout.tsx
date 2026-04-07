import React, { useState } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Users,
  CreditCard,
  // PieChart,
  FileText,
  LogOut,
  DollarSign,
  Menu,
  X,
  BarChart2,
  UserX,
  FileCheck,
  Calendar,
  Receipt,
  Home,
  AlertTriangle,
  CalendarDays,
  TrendingUp,
  Activity,
  Gift,
  HandCoins,
  ClipboardList,
} from "lucide-react";
import { Settings } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import Button from "./ui/Button";
import Avatar from "./avatar/Avatar";
import { ThemeToggle } from "./ui/ThemeToggle";
import TopBar from "./layout/TopBar";
import ProfileSummary from "./layout/ProfileSummary";
import logger from "../utils/logger";

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, userDetails, isAdmin } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/auth/login");
    } catch (error) {
      logger.error("Error signing out:", error);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const adminMenuItems = [
    { path: "/", icon: Home, label: "Home", color: "text-emerald-500" },
    { path: "/members", icon: Users, label: "Members", color: "text-blue-500" },
    {
      path: "/payouts",
      icon: DollarSign,
      label: "Payouts",
      color: "text-amber-500",
    },
    {
      path: "/claims",
      icon: FileCheck,
      label: "Claims",
      color: "text-rose-500",
    },
    {
      path: "/expenses",
      icon: Receipt,
      label: "Expenses",
      color: "text-pink-500",
    },
    {
      path: "/donations",
      icon: Gift,
      label: "Donations",
      color: "text-purple-500",
    },
    {
      path: "/credits",
      icon: HandCoins,
      label: "Credits",
      color: "text-green-500",
    },
    {
      path: "/credit-reviews",
      icon: ClipboardList,
      label: "Credit Reviews",
      color: "text-teal-500",
    },
    {
      path: "/disciplinary",
      icon: AlertTriangle,
      label: "Disciplinary",
      color: "text-orange-500",
    },
    {
      path: "/calendar",
      icon: Calendar,
      label: "Calendar",
      color: "text-sky-500",
    },
    {
      path: "/host-assignments",
      icon: CalendarDays,
      label: "Host Assignments",
      color: "text-purple-500",
    },
    {
      path: "/analytics",
      icon: BarChart2,
      label: "Analytics",
      color: "text-indigo-500",
    },
    {
      path: "/advanced-analytics",
      icon: TrendingUp,
      label: "Advanced Analytics",
      color: "text-cyan-500",
    },
    {
      path: "/reports",
      icon: FileText,
      label: "Reports",
      color: "text-teal-500",
    },
    {
      path: "/deletion-requests",
      icon: UserX,
      label: "Deletion Requests",
      color: "text-red-500",
    },
    {
      path: "/configuration",
      icon: Settings,
      label: "Configuration",
      color: "text-gray-500",
    },
    {
      path: "/audit-logs",
      icon: Activity,
      label: "Audit Logs",
      color: "text-blue-600",
    },
  ];

  const memberMenuItems = [
    { path: "/", icon: Home, label: "Home", color: "text-emerald-500" },

    {
      path: "/my-contributions",
      icon: CreditCard,
      label: "Contributions",
      color: "text-violet-500",
    },

    {
      path: "/my-donations",
      icon: Gift,
      label: "My Donations",
      color: "text-purple-500",
    },

    {
      path: "/my-credit",
      icon: HandCoins,
      label: "My Credit",
      color: "text-green-500",
    },

    {
      path: "/calendar",
      icon: Calendar,
      label: "Calendar",
      color: "text-sky-500",
    },
    {
      path: "/my-hosting-schedule",
      icon: CalendarDays,
      label: "Hosting",
      color: "text-purple-500",
    },
    {
      path: "/disciplinary",
      icon: AlertTriangle,
      label: "Disciplinary",
      color: "text-orange-500",
    },
  ];

  const chairpersonMenuItems = [
    { path: "/", icon: Home, label: "Home", color: "text-emerald-500" },
    {
      path: "/credit-reviews",
      icon: ClipboardList,
      label: "Credit Reviews",
      color: "text-teal-500",
    },
    {
      path: "/my-contributions",
      icon: CreditCard,
      label: "Contributions",
      color: "text-violet-500",
    },

    {
      path: "/my-donations",
      icon: Gift,
      label: "My Donations",
      color: "text-purple-500",
    },

    {
      path: "/my-credit",
      icon: HandCoins,
      label: "My Credit",
      color: "text-green-500",
    },

    {
      path: "/calendar",
      icon: Calendar,
      label: "Calendar",
      color: "text-sky-500",
    },
    {
      path: "/my-hosting-schedule",
      icon: CalendarDays,
      label: "Hosting",
      color: "text-purple-500",
    },
    {
      path: "/disciplinary",
      icon: AlertTriangle,
      label: "Disciplinary",
      color: "text-orange-500",
    },
  ];

  const menuItems = isAdmin
    ? adminMenuItems
    : userDetails?.role === "chairperson"
      ? chairpersonMenuItems
      : memberMenuItems;

  const isActive = (path: string) => location.pathname === path;

  const handleMenuItemClick = () => {
    setIsMobileMenuOpen(false);
  };

  const MenuItem = ({
    item,
    mobile = false,
  }: {
    item: (typeof menuItems)[0];
    mobile?: boolean;
  }) => {
    const active = isActive(item.path);
    const Icon = item.icon;

    return (
      <Link
        to={item.path}
        className={`group flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-[12px] transition-all duration-200 ease-in-out
          ${active
            ? "bg-gradient-purple text-white shadow-lg"
            : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          }
          ${mobile ? "flex-col justify-center items-center space-y-0.5 gap-1 px-2 py-2" : ""}
        `}
        onClick={handleMenuItemClick}
      >
        <div
          className={`
          flex items-center justify-center ${mobile ? "w-5 h-5" : "w-10 h-10"
            } rounded-xl transition-all duration-200
          ${active
              ? "bg-white/20 backdrop-blur-sm"
              : `${item.color} bg-gray-100 dark:bg-gray-800`
            }
        `}
        >
          <Icon
            className={`${mobile ? "w-4 h-4" : "w-5 h-5"
              } transition-transform duration-200 ${active ? "scale-110 text-white" : "group-hover:scale-110"
              }`}
          />
        </div>
        <span
          className={`${mobile ? "text-[10px]" : "flex-1"
            } transition-colors duration-200 ${active ? "font-semibold" : ""}`}
        >
          {mobile ? item.label.split(" ")[0] : item.label}
        </span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <aside className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity"
            onClick={toggleMobileMenu}
          />
          <div className="relative flex flex-col w-72 max-w-xs h-full bg-white dark:bg-surface-dark shadow-2xl transform transition-transform duration-300 ease-in-out">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <img
                  src="/logo.png"
                  alt="Logo"
                  className="h-10 w-10"
                />
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    Inkuthazo
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Social Club Portal
                  </p>
                </div>
              </div>
              <button
                onClick={toggleMobileMenu}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
              {menuItems.map((item) => (
                <MenuItem key={item.path} item={item} />
              ))}
            </nav>

            {/* Sidebar Footer */}
            <div className="border-t border-gray-100 dark:border-gray-800 p-4">
              <div className="flex items-center gap-3 mb-3">
                <ThemeToggle variant="button" />
                <Button
                  variant="secondary"
                  icon={LogOut}
                  onClick={handleSignOut}
                  className="flex-1"
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-72 bg-white dark:bg-surface-dark border-r border-gray-100 dark:border-gray-800">
          {/* Sidebar Header */}
          <div className="flex items-center gap-3 px-6 py-6 border-b border-gray-100 dark:border-gray-800">
            <img
              src="/logo.png"
              alt="Logo"
              className="h-10 w-10"
            />
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Inkuthazo
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Social Club Portal
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {menuItems.map((item) => (
              <MenuItem key={item.path} item={item} />
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="border-t border-gray-100 dark:border-gray-800 p-4">
            <div className="flex items-center gap-3">
              <ThemeToggle variant="button" />
              <Button
                variant="secondary"
                icon={LogOut}
                onClick={handleSignOut}
                className="flex-1"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <TopBar />

        {/* Content Wrapper */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Content */}
          <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
            <div className="p-6">
              <Outlet />
            </div>
          </main>

          {/* Right Panel - Profile Summary (Desktop Only) */}
          <aside className="hidden xl:block">
            <ProfileSummary />
          </aside>
        </div>
      </div>

      {/* Mobile Menu Button (Floating) */}
      <button
        onClick={toggleMobileMenu}
        className="lg:hidden fixed bottom-6 right-6 z-40 w-14 h-14 bg-gradient-purple text-white rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all duration-200 hover:scale-110"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Mobile Bottom Navigation for Members Only */}
      {!isAdmin && (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-surface-dark border-t border-gray-100 dark:border-gray-800 z-40 shadow-lg">
          <div className="grid grid-cols-5 gap-1 px-2 py-2">
            {menuItems.map((item) => (
              <MenuItem key={item.path} item={item} mobile />
            ))}
          </div>
        </nav>
      )}
    </div>
  );
};

export default Layout;
