import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
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
import RoleBasedRoute from "./components/RoleBasedRoute";

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
  const { user, userDetails } = useAuth();

  return (
    <Routes>
      {/* Auth routes */}
      <Route path="/auth" element={<AuthLayout />}>
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
      </Route>

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />

        {/* Admin-only routes */}
        <Route
          path="members"
          element={
            <RoleBasedRoute allowedRoles={["admin"]}>
              <Members />
            </RoleBasedRoute>
          }
        />

        {/* Member can view their own details */}
        <Route path="members/:id" element={<MemberDetail />} />

        {/* Admin-only routes */}
        <Route
          path="contributions"
          element={
            <RoleBasedRoute allowedRoles={["admin"]}>
              <Contributions />
            </RoleBasedRoute>
          }
        />

        {/* Member-only routes */}
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
          path="reports"
          element={
            <RoleBasedRoute allowedRoles={["admin"]}>
              <Reports />
            </RoleBasedRoute>
          }
        />
      </Route>

      {/* Redirect to dashboard if logged in, otherwise to login */}
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

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
