import type { AuthCredential } from "firebase/auth";

/**
 * Outcome of a Google sign-in attempt, so callers can navigate
 * deterministically instead of racing the onAuthStateChanged listener.
 */
export type GoogleSignInResult =
  | { status: "signed-in" } // member doc exists → go to "/"
  | { status: "needs-profile" } // authenticated, no member doc → complete profile
  | {
      // that email already has a password account; link the Google credential
      status: "account-exists";
      email: string;
      pendingCred: AuthCredential;
    };
