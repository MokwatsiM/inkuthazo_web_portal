import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { AuthCredential } from "firebase/auth";
import { useAuth } from "../../hooks/useAuth";
import type { GoogleSignInResult } from "../../types/auth";
import Button from "../ui/Button";
import logger from "../../utils/logger";

interface GoogleAuthButtonProps {
  /** Present on the Register page when arriving via an invitation link */
  invitation?: { full_name: string; email: string; phone: string };
}

const GoogleIcon: React.FC = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09a6.6 6.6 0 0 1 0-4.18V7.07H2.18a11 11 0 0 0 0 9.86l3.66-2.84z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.61 0 3.06.55 4.2 1.64l3.15-3.15C17.45 1.44 14.97.5 12 .5A11 11 0 0 0 2.18 7.07l3.66 2.84C6.71 6.68 9.14 4.75 12 4.75z"
    />
  </svg>
);

/**
 * "Continue with Google" button shared by Login and Register. Handles the
 * three outcomes of a Google sign-in and, when the email already has a
 * password account, prompts to link it.
 */
const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({ invitation }) => {
  const { signInWithGoogle, linkGoogleToPassword } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Link-modal state
  const [linkEmail, setLinkEmail] = useState<string | null>(null);
  const [pendingCred, setPendingCred] = useState<AuthCredential | null>(null);
  const [linkPassword, setLinkPassword] = useState("");

  const route = (result: GoogleSignInResult) => {
    if (result.status === "signed-in") {
      navigate("/", { replace: true });
    } else if (result.status === "needs-profile") {
      navigate("/auth/complete-profile", {
        state: invitation
          ? { invitedName: invitation.full_name, invitedPhone: invitation.phone }
          : undefined,
      });
    } else if (result.status === "account-exists") {
      setLinkEmail(result.email);
      setPendingCred(result.pendingCred);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setBusy(true);
    try {
      route(await signInWithGoogle());
    } catch (err) {
      const code = err instanceof Object && "code" in err ? (err as { code: string }).code : "";
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        // User dismissed the popup — not an error worth surfacing
      } else if (code === "auth/popup-blocked") {
        setError("Your browser blocked the sign-in popup. Please allow popups and try again.");
      } else {
        setError("Google sign-in failed. Please try again.");
      }
      logger.error("Google auth button error:", err);
    } finally {
      setBusy(false);
    }
  };

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkEmail || !pendingCred) return;
    setError(null);
    setBusy(true);
    try {
      route(await linkGoogleToPassword(linkEmail, linkPassword, pendingCred));
      setLinkEmail(null);
      setPendingCred(null);
      setLinkPassword("");
    } catch {
      setError("Could not link your account. Check your password and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-6">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-line dark:border-line-dark" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-surface dark:bg-surface-dark text-text-secondary dark:text-text-secondary-dark">
            or
          </span>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-base text-sm">
          {error}
        </div>
      )}

      {linkEmail ? (
        <form onSubmit={handleLink} className="mt-4 space-y-3">
          <p className="text-sm text-text-secondary dark:text-text-secondary-dark">
            An account already exists for <span className="font-medium">{linkEmail}</span>.
            Enter your password to link Google to it.
          </p>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={linkPassword}
            onChange={(e) => setLinkPassword(e.target.value)}
            placeholder="Password"
            className="appearance-none block w-full px-3 py-2 border border-line dark:border-line-dark rounded-input shadow-sm bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark sm:text-sm"
          />
          <div className="flex gap-2">
            <Button type="submit" className="flex-1 justify-center" disabled={busy}>
              {busy ? "Linking..." : "Link account"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="flex-1 justify-center"
              onClick={() => {
                setLinkEmail(null);
                setPendingCred(null);
                setLinkPassword("");
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className="mt-4">
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={handleGoogle}
            loading={busy}
          >
            <span className="inline-flex items-center justify-center gap-2">
              <GoogleIcon />
              Continue with Google
            </span>
          </Button>
        </div>
      )}
    </div>
  );
};

export default GoogleAuthButton;
