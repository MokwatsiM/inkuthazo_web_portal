import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { NotificationProvider } from "./context/NotificationContext";
import NotificationContainer from "./components/notifications/NotificationContainer";
import AnalyticsProvider from "./components/analytics/AnalyticsProvider";
import ConnectionStatus from "./components/ui/ConnectionStatus";
import { initializeConnectionHandler } from "./utils/firebaseConnection";
import Layout from "./components/Layout";
import AuthLayout from "./components/auth/AuthLayout";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import ForgotPassword from "./components/auth/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Members from "./pages/Members";
import MemberDetail from "./pages/MemberDetail";
import Contributions from "./pages/Contributions";
import MyContributions from "./pages/MyContributions";
import Reports from "./pages/Reports";
import Payouts from "./pages/Payouts";
import Analytics from "./pages/Analytics";
import RoleBasedRoute from "./components/RoleBasedRoute";
import DeletionRequests from "./pages/DeletionRequests";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/auth" element={<AuthLayout />}>
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
      </Route>

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />

        <Route
          path="members"
          element={
            <RoleBasedRoute allowedRoles={["admin"]}>
              <Members />
            </RoleBasedRoute>
          }
        />

        <Route path="members/:id" element={<MemberDetail />} />

        <Route
          path="contributions"
          element={
            <RoleBasedRoute allowedRoles={["admin"]}>
              <Contributions />
            </RoleBasedRoute>
          }
        />

        <Route
          path="my-contributions"
          element={
            <RoleBasedRoute allowedRoles={["member"]}>
              <MyContributions />
            </RoleBasedRoute>
          }
        />

        <Route
          path="payouts"
          element={
            <RoleBasedRoute allowedRoles={["admin"]}>
              <Payouts />
            </RoleBasedRoute>
          }
        />

        <Route
          path="analytics"
          element={
            <RoleBasedRoute allowedRoles={["admin"]}>
              <Analytics />
            </RoleBasedRoute>
          }
        />

        <Route
          path="reports"
          element={
            <RoleBasedRoute allowedRoles={["admin"]}>
              <Reports />
            </RoleBasedRoute>
          }
        />

        <Route
          path="deletion-requests"
          element={
            <RoleBasedRoute allowedRoles={["admin"]}>
              <DeletionRequests />
            </RoleBasedRoute>
          }
        />
      </Route>

      <Route
        path="*"
        element={
          user ? (
            <Navigate to="/" replace />
          ) : (
            <Navigate to="/auth/login" replace />
          )
        }
      />
    </Routes>
  );
};

const App: React.FC = () => {
  useEffect(() => {
    initializeConnectionHandler();
  }, []);

  return (
    <AuthProvider>
      <NotificationProvider>
        <AnalyticsProvider>
          <BrowserRouter>
            <NotificationContainer />
            <ConnectionStatus />
            <AppRoutes />
          </BrowserRouter>
        </AnalyticsProvider>
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;
