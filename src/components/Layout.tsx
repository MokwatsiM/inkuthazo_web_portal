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
  BarChart2,
  UserX,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import Button from "./ui/Button";
import Avatar from "./avatar/Avatar";

const Layout: React.FC = () => {
  const navigate = useNavigate();
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
    { path: "/", icon: PieChart, label: "Dashboard" },
    { path: "/members", icon: Users, label: "Members" },
    { path: "/contributions", icon: CreditCard, label: "Contributions" },
    { path: "/payouts", icon: DollarSign, label: "Payouts" },
    { path: "/analytics", icon: BarChart2, label: "Analytics" },
    { path: "/reports", icon: FileText, label: "Reports" },
    { path: "/deletion-requests", icon: UserX, label: "Deletion Requests" },
  ];

  const memberMenuItems = [
    { path: "/", icon: PieChart, label: "Dashboard" },
    {
      path: `/members/${userDetails?.id}`,
      icon: UserCircle,
      label: "My Profile",
    },
    { path: "/my-contributions", icon: CreditCard, label: "My Contributions" },
  ];

  const menuItems = isAdmin ? adminMenuItems : memberMenuItems;

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
                Inkuthazo Social Club Portal
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {userDetails && (
                <div className="hidden md:flex items-center space-x-3">
                  <Link to={`/members/${userDetails.id}`}>
                    <Avatar member={userDetails} size="sm" />
                  </Link>
                  <div className="text-sm">
                    <p className="font-medium text-gray-700">
                      {userDetails.full_name}
                    </p>
                    <p className="text-gray-500 text-xs capitalize">
                      {userDetails.role}
                    </p>
                  </div>
                </div>
              )}
              <Button
                variant="secondary"
                icon={LogOut}
                onClick={handleSignOut}
                className="flex items-center"
              >
                <span className="hidden md:inline">Sign Out</span>
                <LogOut className="md:hidden h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Mobile Sidebar */}
        {isMobileMenuOpen && (
          <aside className="fixed inset-0 z-40 md:hidden">
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
                  {menuItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      onClick={toggleMobileMenu}
                    >
                      <item.icon className="mr-4 h-6 w-6" />
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </div>
              {userDetails && (
                <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
                  <div className="flex items-center">
                    <Avatar member={userDetails} size="sm" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-700">
                        {userDetails.full_name}
                      </p>
                      <p className="text-xs font-medium text-gray-500 capitalize">
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
              <nav className="flex-1 px-2 py-4 bg-white space-y-1">
                {menuItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  >
                    <item.icon className="mr-3 h-6 w-6" />
                    {item.label}
                  </Link>
                ))}
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
