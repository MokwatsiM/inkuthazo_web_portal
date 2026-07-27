import React from "react";
import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import LoadingSpinner from "./ui/LoadingSpinner";

/**
 * Gate for member-only feature routes. Sits inside ProtectedRoute (which
 * checks authentication) and enforces the *approval* lifecycle that
 * authentication alone does not:
 *
 *  - email not verified        -> /auth/verify-email
 *  - verified but still pending -> can only reach their own profile;
 *                                  every other route redirects there
 *  - approved / active          -> full access
 *
 * This is the single choke point for approval, so a pending member can
 * never reach a feature page regardless of the permissions their role
 * grants.
 */
const ApprovedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, userDetails, loading, detailsLoaded, signupInProgress } =
    useAuth();
  const params = useParams();

  if (loading) {
    return <LoadingSpinner />;
  }

  // Not authenticated is handled by ProtectedRoute; guard defensively.
  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  if (!user.emailVerified) {
    return <Navigate to="/auth/verify-email" replace />;
  }

  // Member details still resolving, or an email/password signup is mid-flight
  // (its member doc is about to be written). Wait rather than deciding on
  // incomplete data — that would flip-flop redirects and trip React's
  // update-depth guard.
  if (!detailsLoaded || signupInProgress) {
    return <LoadingSpinner />;
  }

  // The fetch completed and there is genuinely no member document — a Google
  // user who authenticated but hasn't supplied their profile yet. Send them
  // to complete it.
  if (!userDetails) {
    return <Navigate to="/auth/complete-profile" replace />;
  }

  const isApproved =
    userDetails.status === "approved" || userDetails.status === "active";

  if (!isApproved) {
    // Pending members may only view their own profile.
    const viewingOwnProfile = params.id === userDetails.id;
    if (!viewingOwnProfile) {
      return <Navigate to={`/members/${userDetails.id}`} replace />;
    }
  }

  return <>{children}</>;
};

export default ApprovedRoute;
