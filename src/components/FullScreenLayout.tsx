import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, ArrowLeft } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Button from './ui/Button';
import Avatar from './avatar/Avatar';
import { ThemeToggle } from './ui/ThemeToggle';

interface FullScreenLayoutProps {
  children: React.ReactNode;
  showBackButton?: boolean;
}

const FullScreenLayout: React.FC<FullScreenLayoutProps> = ({
  children,
  showBackButton = true
}) => {
  const navigate = useNavigate();
  const { signOut, userDetails } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Navigation Bar - Same as original Layout */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              {showBackButton && (
                <button
                  onClick={() => navigate('/')}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                  title="Back to home"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span className="hidden sm:inline text-sm font-medium">Home</span>
                </button>
              )}
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

      {/* Main Content with proper padding */}
      <main className="flex-1 relative overflow-y-auto focus:outline-none">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default FullScreenLayout;
