import React, { useState } from "react";
import { MailCheck, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import Button from "../ui/Button";

/**
 * Shown to a signed-in user whose email is not yet verified. They cannot
 * reach any feature until they verify (ApprovedRoute enforces this).
 */
const VerifyEmail: React.FC = () => {
  const { user, resendVerificationEmail, refreshUserDetails, signOut } =
    useAuth();
  const navigate = useNavigate();
  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(false);

  const handleResend = async () => {
    setResending(true);
    try {
      await resendVerificationEmail();
    } finally {
      setResending(false);
    }
  };

  const handleRefresh = async () => {
    setChecking(true);
    try {
      // Pull the latest emailVerified flag from Firebase
      await user?.reload();
      await refreshUserDetails();
      if (user?.emailVerified) {
        navigate("/", { replace: true });
      }
    } finally {
      setChecking(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth/login");
  };

  return (
    <div className="text-center space-y-6">
      <div className="mx-auto w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
        <MailCheck className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-text-primary dark:text-text-primary-dark">
          Verify your email
        </h2>
        <p className="mt-2 text-sm text-text-secondary dark:text-text-secondary-dark">
          We sent a verification link to{" "}
          <span className="font-medium">{user?.email}</span>. Click the link,
          then come back and continue.
        </p>
      </div>

      <div className="space-y-3">
        <Button className="w-full" onClick={handleRefresh} loading={checking}>
          I&apos;ve verified — continue
        </Button>
        <Button
          variant="secondary"
          className="w-full"
          onClick={handleResend}
          loading={resending}
        >
          Resend verification email
        </Button>
        <button
          onClick={handleSignOut}
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary dark:text-text-secondary-dark hover:text-text-primary dark:hover:text-text-primary-dark"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </div>
  );
};

export default VerifyEmail;
