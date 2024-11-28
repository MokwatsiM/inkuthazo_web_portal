import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Users, CreditCard, PieChart, FileText, LogOut, DollarSign, UserCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Button from './ui/Button';

const Layout: React.FC = () => {
  const { signOut, userDetails, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">Burial Society Portal</h1>
              </div>
            </div>
            <div className="flex items-center">
              <span className="mr-4 text-sm text-gray-600">
                {userDetails?.full_name} ({userDetails?.role})
              </span>
              <Button 
                variant="secondary"
                icon={LogOut}
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        <aside className="w-64 bg-white h-screen border-r">
          <nav className="mt-5 px-2">
            <Link to="/" className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900">
              <PieChart className="mr-4 h-6 w-6" />
              Dashboard
            </Link>
            
            {isAdmin ? (
              // Admin navigation items
              <>
                <Link to="/members" className="mt-1 group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900">
                  <Users className="mr-4 h-6 w-6" />
                  Members
                </Link>
                <Link to="/contributions" className="mt-1 group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900">
                  <CreditCard className="mr-4 h-6 w-6" />
                  Contributions
                </Link>
                <Link to="/payouts" className="mt-1 group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900">
                  <DollarSign className="mr-4 h-6 w-6" />
                  Payouts
                </Link>
                <Link to="/reports" className="mt-1 group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900">
                  <FileText className="mr-4 h-6 w-6" />
                  Reports
                </Link>
              </>
            ) : (
              // Member navigation items
              <>
                <Link to={`/members/${userDetails?.id}`} className="mt-1 group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900">
                  <UserCircle className="mr-4 h-6 w-6" />
                  My Profile
                </Link>
                <Link to="/my-contributions" className="mt-1 group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900">
                  <CreditCard className="mr-4 h-6 w-6" />
                  My Contributions
                </Link>
              </>
            )}
          </nav>
        </aside>

        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;