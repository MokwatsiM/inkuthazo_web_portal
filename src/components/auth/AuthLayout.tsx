import React from "react";
import { Navigate, Outlet, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { ThemeToggle } from "../ui/ThemeToggle";
import Logo from "../ui/Logo";

const AuthLayout: React.FC = () => {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle variant="button" />
      </div>

      {/* Logo and Title */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex items-center justify-center mb-6">
          <Logo size="md" />
        </div>
        <h2 className="text-center text-3xl font-extrabold text-text-primary dark:text-text-primary-dark">
          Inkuthazo Social Club Portal
        </h2>
        <p className="mt-2 text-center text-sm text-text-secondary dark:text-text-secondary-dark">
          Manage your social society membership
        </p>
      </div>

      {/* Auth Form Container */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface dark:bg-surface-dark py-8 px-4 shadow-card rounded-base border border-line dark:border-line-dark sm:px-10">
          <Outlet />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center space-y-2">
        <div className="text-xs">
          <Link
            to="/privacy"
            className="text-text-secondary dark:text-text-secondary-dark hover:text-text-primary dark:hover:text-text-primary-dark"
          >
            Privacy Policy
          </Link>
          <span className="mx-2 text-text-tertiary dark:text-text-tertiary-dark">
            ·
          </span>
          <Link
            to="/terms"
            className="text-text-secondary dark:text-text-secondary-dark hover:text-text-primary dark:hover:text-text-primary-dark"
          >
            Terms of Service
          </Link>
        </div>
        <p className="text-xs text-text-secondary dark:text-text-secondary-dark">
          © 2026 Inkuthazo Social Club. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default AuthLayout;
