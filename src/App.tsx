import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { NotificationProvider } from "./context/NotificationContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import NotificationContainer from "./components/notifications/NotificationContainer";
import AnalyticsProvider from "./components/analytics/AnalyticsProvider";
import ConnectionStatus from "./components/ui/ConnectionStatus";
import ErrorBoundary from "./components/error/ErrorBoundary";
import { initializeConnectionHandler } from "./utils/firebaseConnection";
import Layout from "./components/Layout";
import FullScreenLayout from "./components/FullScreenLayout";
import AuthLayout from "./components/auth/AuthLayout";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import ForgotPassword from "./components/auth/ForgotPassword";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import Members from "./pages/Members";
import MemberDetail from "./pages/MemberDetail";
import MyContributions from "./pages/MyContributions";
import Reports from "./pages/Reports";
import Payouts from "./pages/Payouts";
import Analytics from "./pages/Analytics";
import AdvancedAnalytics from "./pages/AdvancedAnalytics";
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

      {/* Landing Page - Full Screen */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <LandingPage />
          </ProtectedRoute>
        }
      />

      {/* Home/Dashboard - Full Screen */}
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <FullScreenLayout>
              <Dashboard />
            </FullScreenLayout>
          </ProtectedRoute>
        }
      />

      {/* All other routes - Full Screen with TopNavBar */}
      <Route
        path="/members"
        element={
          <ProtectedRoute>
            <FullScreenLayout>
              <RoleBasedRoute allowedRoles={["admin"]}>
                <Members />
              </RoleBasedRoute>
            </FullScreenLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/members/:id"
        element={
          <ProtectedRoute>
            <FullScreenLayout>
              <MemberDetail />
            </FullScreenLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/my-contributions"
        element={
          <ProtectedRoute>
            <FullScreenLayout>
              <RoleBasedRoute allowedRoles={["member", "dc_member"]}>
                <MyContributions />
              </RoleBasedRoute>
            </FullScreenLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/payouts"
        element={
          <ProtectedRoute>
            <FullScreenLayout>
              <RoleBasedRoute allowedRoles={["admin"]}>
                <Payouts />
              </RoleBasedRoute>
            </FullScreenLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/claims"
        element={
          <ProtectedRoute>
            <FullScreenLayout>
              <RoleBasedRoute allowedRoles={["admin"]}>
                <Claims />
              </RoleBasedRoute>
            </FullScreenLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/expenses"
        element={
          <ProtectedRoute>
            <FullScreenLayout>
              <RoleBasedRoute allowedRoles={["admin"]}>
                <Expenses />
              </RoleBasedRoute>
            </FullScreenLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/disciplinary"
        element={
          <ProtectedRoute>
            <FullScreenLayout>
              <RoleBasedRoute allowedRoles={["admin", "member", "dc_member"]}>
                <Disciplinary />
              </RoleBasedRoute>
            </FullScreenLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <FullScreenLayout>
              <RoleBasedRoute allowedRoles={["admin"]}>
                <Analytics />
              </RoleBasedRoute>
            </FullScreenLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/advanced-analytics"
        element={
          <ProtectedRoute>
            <FullScreenLayout>
              <RoleBasedRoute allowedRoles={["admin"]}>
                <AdvancedAnalytics />
              </RoleBasedRoute>
            </FullScreenLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/calendar"
        element={
          <ProtectedRoute>
            <FullScreenLayout>
              <Calendar />
            </FullScreenLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <FullScreenLayout>
              <RoleBasedRoute allowedRoles={["admin"]}>
                <Reports />
              </RoleBasedRoute>
            </FullScreenLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/deletion-requests"
        element={
          <ProtectedRoute>
            <FullScreenLayout>
              <RoleBasedRoute allowedRoles={["admin"]}>
                <DeletionRequests />
              </RoleBasedRoute>
            </FullScreenLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/configuration"
        element={
          <ProtectedRoute>
            <FullScreenLayout>
              <RoleBasedRoute allowedRoles={["admin"]}>
                <Configuration />
              </RoleBasedRoute>
            </FullScreenLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/host-assignments"
        element={
          <ProtectedRoute>
            <FullScreenLayout>
              <RoleBasedRoute allowedRoles={["admin"]}>
                <HostAssignments />
              </RoleBasedRoute>
            </FullScreenLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/my-hosting-schedule"
        element={
          <ProtectedRoute>
            <FullScreenLayout>
              <RoleBasedRoute allowedRoles={["member"]}>
                <MemberHostView />
              </RoleBasedRoute>
            </FullScreenLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/attendance"
        element={
          <ProtectedRoute>
            <FullScreenLayout>
              <Attendance />
            </FullScreenLayout>
          </ProtectedRoute>
        }
      />

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
    <ErrorBoundary>
      <ThemeProvider>
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
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
