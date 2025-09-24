import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { ThemeToggle } from "../ui/ThemeToggle";

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
          <img
            src="/logo.png"
            alt="Inkuthazo Social Club"
            className="h-12 w-12"
          />
        </div>
        <h2 className="text-center text-3xl font-extrabold text-text-primary dark:text-text-primary-dark">
          Inkuthazo Social Club Portal
        </h2>
        <p className="mt-2 text-center text-sm text-text-secondary dark:text-text-secondary-dark">
          Manage your burial society membership
        </p>
      </div>

      {/* Auth Form Container */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface dark:bg-surface-dark py-8 px-4 shadow-card rounded-base border border-line dark:border-line-dark sm:px-10">
          <Outlet />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-xs text-text-secondary dark:text-text-secondary-dark">
          © 2024 Inkuthazo Social Club. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default AuthLayout;
