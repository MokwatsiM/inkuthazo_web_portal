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
} from "lucide-react";
import { Settings } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import Button from "./ui/Button";
import Avatar from "./avatar/Avatar";

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
      console.error("Error signing out:", error);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const adminMenuItems = [
    { path: "/", icon: Home, label: "Home", color: "text-emerald-500" },
    { path: "/members", icon: Users, label: "Members", color: "text-blue-500" },
    {
      path: "/contributions",
      icon: CreditCard,
      label: "Contributions",
      color: "text-violet-500",
    },
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

  const menuItems = isAdmin ? adminMenuItems : memberMenuItems;

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
        className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ease-in-out
          ${
            active
              ? "bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300"
              : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          }
          ${mobile ? "flex-col justify-center items-center space-y-0.5" : ""}
        `}
        onClick={handleMenuItemClick}
      >
        <div
          className={`
          flex items-center justify-center ${
            mobile ? "w-5 h-5" : "w-8 h-8"
          } rounded-md transition-all duration-200
          ${
            active
              ? `${item.color} bg-white dark:bg-gray-800 shadow-sm`
              : "text-gray-400 group-hover:text-gray-600 dark:text-gray-400 dark:group-hover:text-gray-300"
          }
        `}
        >
          <Icon
            className={`${
              mobile ? "w-4 h-4" : "w-5 h-5"
            } transition-transform duration-200 ${
              active ? "scale-110" : "group-hover:scale-110"
            }`}
          />
        </div>
        <span
          className={`${
            mobile ? "text-[10px]" : "ml-3"
          } transition-colors duration-200 ${active ? "font-semibold" : ""}`}
        >
          {mobile ? item.label.split(" ")[0] : item.label}
        </span>
        {active && !mobile && (
          <span className="ml-auto w-1.5 h-5 rounded-full bg-brand-500" />
        )}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Navigation Bar */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              {isAdmin && (
                <button
                  onClick={toggleMobileMenu}
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-500 md:hidden"
                >
                  {isMobileMenuOpen ? (
                    <X className="block h-6 w-6" />
                  ) : (
                    <Menu className="block h-6 w-6" />
                  )}
                </button>
              )}
              <div className="flex items-center space-x-2">
                <img
                  src="/logo.png"
                  alt="Logo"
                  className="h-8 w-8 text-brand-600 dark:text-brand-400"
                />
                <h1 className="text-xl font-bold text-gray-900 dark:text-white ml-2 md:ml-0">
                  Inkuthazo Portal
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {userDetails && (
                <div className={`${isAdmin ? 'hidden md:flex' : 'flex'} items-center space-x-3`}>
                  <Link
                    to={`/members/${userDetails.id}`}
                    className="relative group"
                  >
                    <Avatar member={userDetails} size="sm" />
                    <div className="absolute inset-0 rounded-full ring-2 ring-transparent group-hover:ring-brand-500 transition-all duration-200" />
                  </Link>
                  <div className={`text-sm ${!isAdmin ? 'hidden md:block' : ''}`}>
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

      <div className="flex">
        {/* Mobile Sidebar for Admin */}
        {isAdmin && isMobileMenuOpen && (
          <aside className="fixed inset-0 z-40 md:hidden">
            <div
              className="fixed inset-0 bg-gray-600 bg-opacity-75 backdrop-blur-sm transition-opacity"
              onClick={toggleMobileMenu}
            />
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-gray-800 transform transition-transform duration-300 ease-in-out">
              <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                <nav className="mt-5 px-2 space-y-1">
                  {menuItems.map((item) => (
                    <MenuItem key={item.path} item={item} />
                  ))}
                </nav>
              </div>
              {userDetails && (
                <div className="flex-shrink-0 flex border-t border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center">
                    <Avatar member={userDetails} size="sm" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        {userDetails.full_name}
                      </p>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 capitalize">
                        {userDetails.role}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}

        {/* Desktop Sidebar */}
        <aside className="hidden md:flex md:flex-shrink-0">
          <div className="flex flex-col w-64">
            <div className="flex flex-col h-0 flex-1">
              <nav className="flex-1 px-3 py-4 bg-white dark:bg-gray-800 space-y-1 border-r border-gray-200 dark:border-gray-700">
                {menuItems.map((item) => (
                  <MenuItem key={item.path} item={item} />
                ))}
              </nav>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main
          className={`flex-1 relative overflow-y-auto focus:outline-none ${
            !isAdmin ? "pb-16" : "pb-6"
          }`}
        >
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation for Members Only */}
      {!isAdmin && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50">
          <div className="grid grid-cols-5 gap-1 px-2 py-1">
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
