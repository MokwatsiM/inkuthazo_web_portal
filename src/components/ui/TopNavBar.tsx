import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Sparkles, Bell } from 'lucide-react';

interface TopNavBarProps {
  showBackButton?: boolean;
}

const TopNavBar: React.FC<TopNavBarProps> = ({ showBackButton = true }) => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 bg-white/70 backdrop-blur border-b border-slate-200 dark:bg-gray-800/70 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBackButton && (
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700 transition text-slate-700 dark:text-gray-300"
              title="Back to home"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="hidden sm:inline text-sm font-medium">Home</span>
            </button>
          )}
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500"></div>
          <span className="text-lg md:text-xl font-semibold tracking-tight text-slate-900 dark:text-white">Portal</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search members, claims, reports…"
              className="w-[320px] rounded-lg border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 pl-9 pr-3 py-2 text-sm placeholder:text-slate-400 dark:placeholder:text-gray-500 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            />
          </div>
          <button className="hidden lg:flex items-center gap-2 rounded-lg border border-slate-200 dark:border-gray-600 px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-gray-700 transition">
            <Sparkles className="h-4 w-4 text-indigo-500" />
            <span className="text-slate-700 dark:text-gray-300">Quick Actions</span>
          </button>
          <button className="relative p-2 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition">
            <Bell className="h-5 w-5 text-slate-600 dark:text-gray-400" />
            <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
              3
            </span>
          </button>
          <img
            src="/group_photo.jpg"
            alt="Avatar"
            className="h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-600 object-cover"
          />
        </div>
      </div>
    </header>
  );
};

export default TopNavBar;
