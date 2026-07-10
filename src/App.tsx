import React, { useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { NotificationProvider } from "./contexts/NotificationContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import NotificationContainer from "./components/notifications/NotificationContainer";
import AnalyticsProvider from "./components/analytics/AnalyticsProvider";
import ConnectionStatus from "./components/ui/ConnectionStatus";
import ErrorBoundary from "./components/error/ErrorBoundary";
import { initializeConnectionHandler } from "./utils/firebaseConnection";
// import Layout from "./components/Layout";
import FullScreenLayout from "./components/FullScreenLayout";
import AuthLayout from "./components/auth/AuthLayout";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import ForgotPassword from "./components/auth/ForgotPassword";
import ResetPassword from "./components/auth/ResetPassword";
import PermissionBasedRoute from "./components/PermissionBasedRoute";
import SessionProvider from "./components/session/SessionProvider";
import LoadingSpinner from "./components/ui/LoadingSpinner";

// Pages are lazy-loaded so each route becomes its own chunk and heavy
// dependencies (charts, PDF/Excel exports, QR scanning) are only downloaded
// when the page that needs them is opened.
const LandingPage = lazy(() => import("./pages/LandingPage"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Members = lazy(() => import("./pages/Members"));
const MemberDetail = lazy(() => import("./pages/MemberDetail"));
const MyContributions = lazy(() => import("./pages/MyContributions"));
const Reports = lazy(() => import("./pages/Reports"));
const Payouts = lazy(() => import("./pages/Payouts"));
const Analytics = lazy(() => import("./pages/Analytics"));
const AdvancedAnalytics = lazy(() => import("./pages/AdvancedAnalytics"));
const DeletionRequests = lazy(() => import("./pages/DeletionRequests"));
const Claims = lazy(() => import("./pages/Claims"));
const Calendar = lazy(() => import("./pages/Calendar"));
const Expenses = lazy(() => import("./pages/Expenses"));
const Disciplinary = lazy(() => import("./pages/Disciplinary"));
const Configuration = lazy(() => import("./pages/Configuration"));
const HostAssignments = lazy(() => import("./pages/HostAssignments"));
const MemberHostView = lazy(
  () => import("./components/hostAssignments/MemberHostView")
);
const Attendance = lazy(() => import("./pages/Attendance"));
const AuditLogs = lazy(() => import("./pages/AuditLogs"));
const Donations = lazy(() => import("./pages/Donations"));
const MyDonations = lazy(() => import("./pages/MyDonations"));
const Credits = lazy(() => import("./pages/Credits"));
const CreditReviews = lazy(() => import("./pages/CreditReviews"));
const MyCredit = lazy(() => import("./pages/MyCredit"));
const RoleManagement = lazy(() => import("./pages/RoleManagement"));

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
    <Suspense fallback={<LoadingSpinner />}>
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
              <PermissionBasedRoute resource="members">
                <Members />
              </PermissionBasedRoute>
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
              <PermissionBasedRoute resource="my_contributions">
                <MyContributions />
              </PermissionBasedRoute>
            </FullScreenLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/my-donations"
        element={
          <ProtectedRoute>
            <FullScreenLayout>
              <PermissionBasedRoute resource="my_donations">
                <MyDonations />
              </PermissionBasedRoute>
            </FullScreenLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/my-credit"
        element={
          <ProtectedRoute>
            <FullScreenLayout>
              <PermissionBasedRoute resource="my_credit">
                <MyCredit />
              </PermissionBasedRoute>
            </FullScreenLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/payouts"
        element={
          <ProtectedRoute>
            <FullScreenLayout>
              <PermissionBasedRoute resource="payouts">
                <Payouts />
              </PermissionBasedRoute>
            </FullScreenLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/claims"
        element={
          <ProtectedRoute>
            <FullScreenLayout>
              <PermissionBasedRoute resource="claims">
                <Claims />
              </PermissionBasedRoute>
            </FullScreenLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/expenses"
        element={
          <ProtectedRoute>
            <FullScreenLayout>
              <PermissionBasedRoute resource="expenses">
                <Expenses />
              </PermissionBasedRoute>
            </FullScreenLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/donations"
        element={
          <ProtectedRoute>
            <FullScreenLayout>
              <PermissionBasedRoute resource="donations">
                <Donations />
              </PermissionBasedRoute>
            </FullScreenLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/credits"
        element={
          <ProtectedRoute>
            <FullScreenLayout>
              <PermissionBasedRoute resource="credits">
                <Credits />
              </PermissionBasedRoute>
            </FullScreenLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/credit-reviews"
        element={
          <ProtectedRoute>
            <FullScreenLayout>
              <PermissionBasedRoute resource="credit_reviews">
                <CreditReviews />
              </PermissionBasedRoute>
            </FullScreenLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/disciplinary"
        element={
          <ProtectedRoute>
            <FullScreenLayout>
              <PermissionBasedRoute resource="disciplinary">
                <Disciplinary />
              </PermissionBasedRoute>
            </FullScreenLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <FullScreenLayout>
              <PermissionBasedRoute resource="analytics">
                <Analytics />
              </PermissionBasedRoute>
            </FullScreenLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/advanced-analytics"
        element={
          <ProtectedRoute>
            <FullScreenLayout>
              <PermissionBasedRoute resource="analytics">
                <AdvancedAnalytics />
              </PermissionBasedRoute>
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
              <PermissionBasedRoute resource="reports">
                <Reports />
              </PermissionBasedRoute>
            </FullScreenLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/deletion-requests"
        element={
          <ProtectedRoute>
            <FullScreenLayout>
              <PermissionBasedRoute resource="members" action="delete">
                <DeletionRequests />
              </PermissionBasedRoute>
            </FullScreenLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/configuration"
        element={
          <ProtectedRoute>
            <FullScreenLayout>
              <PermissionBasedRoute resource="configuration">
                <Configuration />
              </PermissionBasedRoute>
            </FullScreenLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/host-assignments"
        element={
          <ProtectedRoute>
            <FullScreenLayout>
              <PermissionBasedRoute resource="host_assignments">
                <HostAssignments />
              </PermissionBasedRoute>
            </FullScreenLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/my-hosting-schedule"
        element={
          <ProtectedRoute>
            <FullScreenLayout>
              <PermissionBasedRoute resource="my_hosting_schedule">
                <MemberHostView />
              </PermissionBasedRoute>
            </FullScreenLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/audit-logs"
        element={
          <ProtectedRoute>
            <FullScreenLayout>
              <PermissionBasedRoute resource="audit_logs">
                <AuditLogs />
              </PermissionBasedRoute>
            </FullScreenLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/role-management"
        element={
          <ProtectedRoute>
            <FullScreenLayout>
              <PermissionBasedRoute resource="role_management">
                <RoleManagement />
              </PermissionBasedRoute>
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
    </Suspense>
  );
};

// Server-state cache: queries stay fresh for a minute and are shared
// across pages, replacing per-hook manual fetch/refetch state
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
    },
  },
});

const App: React.FC = () => {
  useEffect(() => {
    initializeConnectionHandler();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
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
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
