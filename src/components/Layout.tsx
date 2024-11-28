import React, { useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import {
  Users,
  CreditCard,
  PieChart,
  FileText,
  LogOut,
  DollarSign,
  UserCircle,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import Button from "./ui/Button";

const Layout: React.FC = () => {
  const { signOut, userDetails, isAdmin } = useAuth();
  const navigate = useNavigate();
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={toggleMobileMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 md:hidden"
              >
                {isMobileMenuOpen ? (
                  <X className="block h-6 w-6" />
                ) : (
                  <Menu className="block h-6 w-6" />
                )}
              </button>
              <h1 className="text-xl font-bold text-gray-900 ml-2 md:ml-0">
                Burial Society Portal
              </h1>
            </div>
            <div className="flex items-center">
              <span className="hidden md:block mr-4 text-sm text-gray-600">
                {userDetails?.full_name} ({userDetails?.role})
              </span>
              <Button
                variant="secondary"
                icon={LogOut}
                onClick={handleSignOut}
                className="hidden md:flex"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Mobile Sidebar */}
        <aside
          className={`${
            isMobileMenuOpen ? "block" : "hidden"
          } fixed inset-0 z-40 md:hidden`}
        >
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={toggleMobileMenu}
          ></div>
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                onClick={toggleMobileMenu}
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <nav className="mt-5 px-2 space-y-1">
                <Link
                  to="/"
                  className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  onClick={toggleMobileMenu}
                >
                  <PieChart className="mr-4 h-6 w-6" />
                  Dashboard
                </Link>

                {isAdmin ? (
                  <>
                    <Link
                      to="/members"
                      className="mt-1 group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      onClick={toggleMobileMenu}
                    >
                      <Users className="mr-4 h-6 w-6" />
                      Members
                    </Link>
                    <Link
                      to="/contributions"
                      className="mt-1 group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      onClick={toggleMobileMenu}
                    >
                      <CreditCard className="mr-4 h-6 w-6" />
                      Contributions
                    </Link>
                    <Link
                      to="/payouts"
                      className="mt-1 group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      onClick={toggleMobileMenu}
                    >
                      <DollarSign className="mr-4 h-6 w-6" />
                      Payouts
                    </Link>
                    <Link
                      to="/reports"
                      className="mt-1 group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      onClick={toggleMobileMenu}
                    >
                      <FileText className="mr-4 h-6 w-6" />
                      Reports
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to={`/members/${userDetails?.id}`}
                      className="mt-1 group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      onClick={toggleMobileMenu}
                    >
                      <UserCircle className="mr-4 h-6 w-6" />
                      My Profile
                    </Link>
                    <Link
                      to="/my-contributions"
                      className="mt-1 group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      onClick={toggleMobileMenu}
                    >
                      <CreditCard className="mr-4 h-6 w-6" />
                      My Contributions
                    </Link>
                  </>
                )}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="flex items-center">
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700">
                    {userDetails?.full_name}
                  </p>
                  <p className="text-xs font-medium text-gray-500">
                    {userDetails?.role}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Desktop Sidebar */}
        <aside className="hidden md:flex md:flex-shrink-0">
          <div className="flex flex-col w-64">
            <div className="flex flex-col h-0 flex-1">
              <nav className="flex-1 px-2 py-4 bg-white space-y-1">
                <Link
                  to="/"
                  className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                >
                  <PieChart className="mr-3 h-6 w-6" />
                  Dashboard
                </Link>

                {isAdmin ? (
                  <>
                    <Link
                      to="/members"
                      className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    >
                      <Users className="mr-3 h-6 w-6" />
                      Members
                    </Link>
                    <Link
                      to="/contributions"
                      className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    >
                      <CreditCard className="mr-3 h-6 w-6" />
                      Contributions
                    </Link>
                    <Link
                      to="/payouts"
                      className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    >
                      <DollarSign className="mr-3 h-6 w-6" />
                      Payouts
                    </Link>
                    <Link
                      to="/reports"
                      className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    >
                      <FileText className="mr-3 h-6 w-6" />
                      Reports
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to={`/members/${userDetails?.id}`}
                      className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    >
                      <UserCircle className="mr-3 h-6 w-6" />
                      My Profile
                    </Link>
                    <Link
                      to="/my-contributions"
                      className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    >
                      <CreditCard className="mr-3 h-6 w-6" />
                      My Contributions
                    </Link>
                  </>
                )}
              </nav>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
