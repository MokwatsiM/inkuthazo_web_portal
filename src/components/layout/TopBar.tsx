import React from "react";
import { Search, Bell, Calendar } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { format } from "date-fns";

interface TopBarProps {
  onSearchChange?: (value: string) => void;
}

const TopBar: React.FC<TopBarProps> = ({ onSearchChange }) => {
  const { userDetails } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="bg-white dark:bg-surface-dark border-b border-gray-100 dark:border-gray-800 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left: Welcome Message */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {getGreeting()}, {userDetails?.full_name?.split(' ')[0] || 'User'}!
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Here are your activities today
          </p>
        </div>

        {/* Right: Date Badge, Search, Notifications */}
        <div className="flex items-center gap-4">
          {/* Date Badge */}
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-[12px] border border-gray-200 dark:border-gray-700">
            <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {format(new Date(), 'MMM dd, yyyy')}
            </span>
          </div>

          {/* Search Input */}
          <div className="relative hidden lg:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="pl-10 pr-4 py-2 w-64 rounded-[12px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Notification Bell */}
          <button className="relative p-2 rounded-[12px] bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all">
            <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            {/* Notification Badge */}
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-purple rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-white dark:border-gray-900">
              3
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
