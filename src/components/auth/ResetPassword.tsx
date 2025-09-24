import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { confirmPasswordReset } from "firebase/auth";
import { Lock } from "lucide-react";
import { auth } from "../../config/firebase";
import { ThemeToggle } from "../ui/ThemeToggle";
import Button from "../ui/Button";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const oobCode = searchParams.get("oobCode");

  useEffect(() => {
    if (!oobCode) {
      //   toast.error("Invalid password reset link");
      navigate("/");
    }
  }, [oobCode, navigate]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      //   toast.error("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      //   toast.error("Password should be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      await confirmPasswordReset(auth, oobCode!, password);
      //   toast.success("Password has been reset successfully!");
      navigate("/");
    } catch (error) {
      //   toast.error("Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle variant="button" />
      </div>

      <div className="max-w-md w-full space-y-8 bg-surface dark:bg-surface-dark p-8 rounded-base shadow-card border border-line dark:border-line-dark">
        <div>
          <div className="flex items-center justify-center mb-6">
            <img
              src="/logo.png"
              alt="Inkuthazo Social Club"
              className="h-12 w-12"
            />
          </div>
          <h2 className="text-center text-3xl font-extrabold text-text-primary dark:text-text-primary-dark">
            Set new password
          </h2>
          <p className="mt-2 text-center text-sm text-text-secondary dark:text-text-secondary-dark">
            Please enter your new password below.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
          <div className="space-y-4">
            <div className="relative">
              <label htmlFor="password" className="block text-sm font-medium text-text-primary dark:text-text-primary-dark mb-2">
                New Password
              </label>
              <Lock className="absolute top-10 left-3 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <input
                id="password"
                type="password"
                required
                className="appearance-none block w-full px-10 py-3 border border-line dark:border-line-dark rounded-input shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark sm:text-sm"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="relative">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-primary dark:text-text-primary-dark mb-2">
                Confirm New Password
              </label>
              <Lock className="absolute top-10 left-3 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <input
                id="confirmPassword"
                type="password"
                required
                className="appearance-none block w-full px-10 py-3 border border-line dark:border-line-dark rounded-input shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark sm:text-sm"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center"
            >
              {loading ? "Resetting..." : "Reset password"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
