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
import Claims from "./pages/Claims";
import SessionProvider from "./components/session/SessionProvider";
import LoadingSpinner from "./components/ui/LoadingSpinner";
import Calendar from "./pages/Calendar";
import Expenses from "./pages/Expenses";
import Disciplinary from "./pages/Disciplinary";
import ResetPassword from "./components/auth/ResetPassword";
import Configuration from "./pages/Configuration";
import HostAssignments from "./pages/HostAssignments";
import MemberHostView from "./components/hostAssignments/MemberHostView";
import Meetings from "./pages/Meetings";
import Attendance from "./pages/Attendance";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
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
        <Route path="reset-password" element={<ResetPassword />} />
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
            <RoleBasedRoute allowedRoles={["admin", ]}>
              <Contributions />
            </RoleBasedRoute>
          }
        />

        <Route
          path="my-contributions"
          element={
            <RoleBasedRoute allowedRoles={["member","dc_member"]}>
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
          path="claims"
          element={
            <RoleBasedRoute allowedRoles={["admin"]}>
              <Claims />
            </RoleBasedRoute>
          }
        />

        <Route
          path="expenses"
          element={
            <RoleBasedRoute allowedRoles={["admin"]}>
              <Expenses />
            </RoleBasedRoute>
          }
        />
        <Route
          path="disciplinary"
          element={
            <RoleBasedRoute allowedRoles={["admin", "member", "dc_member"]}>
              <Disciplinary />
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

        <Route path="calendar" element={<Calendar />} />

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

        <Route
          path="configuration"
          element={
            <RoleBasedRoute allowedRoles={["admin"]}>
              <Configuration />
            </RoleBasedRoute>
          }
        />

        <Route
          path="host-assignments"
          element={
            <RoleBasedRoute allowedRoles={["admin"]}>
              <HostAssignments />
            </RoleBasedRoute>
          }
        />

        <Route
          path="my-hosting-schedule"
          element={
            <RoleBasedRoute allowedRoles={["member"]}>
              <MemberHostView />
            </RoleBasedRoute>
          }
        />

        <Route
          path="meetings"
          element={
            <RoleBasedRoute allowedRoles={["admin"]}>
              <Meetings />
            </RoleBasedRoute>
          }
        />

        <Route
          path="attendance"
          element={
            <RoleBasedRoute allowedRoles={["member", "dc_member"]}>
              <Attendance />
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
    <NotificationProvider>
      <AuthProvider>
        <AnalyticsProvider>
          <BrowserRouter>
            <SessionProvider>
              <NotificationContainer />
              <ConnectionStatus />
              <AppRoutes />
            </SessionProvider>
          </BrowserRouter>
        </AnalyticsProvider>
      </AuthProvider>
    </NotificationProvider>
  );
};

export default App;
