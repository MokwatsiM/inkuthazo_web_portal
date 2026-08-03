import React, { useState } from "react";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { getFriendlyErrorMessage } from "../../utils/errorMessages";
import { ThemeToggle } from "../ui/ThemeToggle";
import Button from "../ui/Button";
import logger from "../../utils/logger";

interface CompleteProfileState {
  invitedName?: string;
  invitedPhone?: string;
}

/**
 * Shown to a signed-in user who has no member document yet (i.e. someone who
 * authenticated with Google). Collects the fields Google does not provide
 * (phone) before the member record is created. Lives OUTSIDE AuthLayout,
 * which would otherwise redirect any signed-in user to "/".
 */
const CompleteProfile: React.FC = () => {
  const { user, userDetails, completeGoogleProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as CompleteProfileState | null) ?? {};

  const [fullName, setFullName] = useState(
    state.invitedName ?? user?.displayName ?? ""
  );
  const [phone, setPhone] = useState(state.invitedPhone ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // No session — nothing to complete.
  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  // Member doc already exists (e.g. they refreshed after completing) — leave.
  if (userDetails) {
    return <Navigate to="/" replace />;
  }

  const inputClass =
    "appearance-none block w-full px-3 py-2 border border-line dark:border-line-dark rounded-input shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark sm:text-sm";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!fullName.trim() || !phone.trim()) {
      setError("Please provide your full name and phone number.");
      return;
    }
    setLoading(true);
    try {
      await completeGoogleProfile(fullName.trim(), phone.trim());
      navigate("/", { replace: true });
    } catch (err) {
      logger.error("Failed to complete profile:", err);
      setError(
        getFriendlyErrorMessage(err, "Failed to complete your profile")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle variant="button" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex items-center justify-center mb-6">
          <img src="/logo-512.png" alt="Inkuthazo Social Club" className="h-12 w-12" />
        </div>
        <h2 className="text-center text-3xl font-extrabold text-text-primary dark:text-text-primary-dark">
          Complete your profile
        </h2>
        <p className="mt-2 text-center text-sm text-text-secondary dark:text-text-secondary-dark">
          We just need a couple more details to finish setting up your membership.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface dark:bg-surface-dark py-8 px-4 shadow-card rounded-base border border-line dark:border-line-dark sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-base">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="cp-email"
                className="block text-sm font-medium text-text-primary dark:text-text-primary-dark"
              >
                Email address
              </label>
              <input
                id="cp-email"
                type="email"
                value={user.email ?? ""}
                disabled
                className={`${inputClass} mt-1 opacity-70 cursor-not-allowed`}
              />
            </div>

            <div>
              <label
                htmlFor="cp-name"
                className="block text-sm font-medium text-text-primary dark:text-text-primary-dark"
              >
                Full Name
              </label>
              <input
                id="cp-name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={`${inputClass} mt-1`}
              />
            </div>

            <div>
              <label
                htmlFor="cp-phone"
                className="block text-sm font-medium text-text-primary dark:text-text-primary-dark"
              >
                Phone Number
              </label>
              <input
                id="cp-phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={`${inputClass} mt-1`}
              />
            </div>

            <Button
              type="submit"
              className="w-full flex justify-center"
              disabled={loading}
            >
              {loading ? "Saving..." : "Continue"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfile;
