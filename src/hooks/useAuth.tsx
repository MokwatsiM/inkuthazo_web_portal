import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  AuthCredential,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  linkWithCredential,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { auth, db, googleProvider } from "../config/firebase";
import type { Member } from "../types";
import type { GoogleSignInResult } from "../types/auth";
import { useNotifications } from "./useNotifications";
import { FirebaseError } from "firebase/app";
import logger from "../utils/logger";
import { getFriendlyErrorMessage } from "../utils/errorMessages";

interface AuthContextType {
  user: User | null;
  userDetails: Member | null;
  loading: boolean;
  /** True once a member-doc fetch has completed (distinguishes loading from absent) */
  detailsLoaded: boolean;
  /** True while an email/password signUp is mid-flight (avoids complete-profile mis-route) */
  signupInProgress: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    phone: string
  ) => Promise<void>;
  signInWithGoogle: () => Promise<GoogleSignInResult>;
  linkGoogleToPassword: (
    email: string,
    password: string,
    pendingCred: AuthCredential
  ) => Promise<GoogleSignInResult>;
  completeGoogleProfile: (fullName: string, phone: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isApproved: boolean;
  refreshUserDetails: () => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * The member document every new signup starts with. Pure + exported for tests.
 */
export const buildNewMember = (
  fullName: string,
  email: string,
  phone: string
): Omit<Member, "id"> => ({
  full_name: fullName,
  email,
  phone,
  join_date: Timestamp.now(),
  status: "pending",
  role: "member",
});

/**
 * Create the members/{uid} document. The email MUST be the authenticated
 * account's email — Firestore rules require `email == request.auth.token.email`.
 */
export const createMemberDoc = async (
  uid: string,
  fullName: string,
  email: string,
  phone: string
): Promise<void> => {
  await setDoc(doc(db, "members", uid), buildNewMember(fullName, email, phone));
};

/**
 * Send a branded (Brevo) verification email via the Cloud Function, falling
 * back to Firebase's default email if the function is unavailable — signup
 * must never be blocked by the branded path failing.
 */
const sendVerificationEmail = async (user: User): Promise<void> => {
  try {
    const callable = httpsCallable(getFunctions(), "sendBrandedVerificationEmail");
    await callable();
  } catch (error) {
    logger.error("Branded verification email failed, using default:", error);
    await sendEmailVerification(user);
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [userDetails, setUserDetails] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoaded, setDetailsLoaded] = useState(false);
  const [signupInProgress, setSignupInProgress] = useState(false);
  const { showError, showSuccess } = useNotifications();

  const fetchUserDetails = async (user: User) => {
    setDetailsLoaded(false);
    try {
      const userDocRef = doc(db, "members", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const memberData = userDoc.data() as Omit<Member, "id">;
        const memberDetails = { id: user.uid, ...memberData } as Member;
        setUserDetails(memberDetails);
      } else {
        setUserDetails(null);
      }
    } catch (error) {
      logger.error("Error fetching user details:", error);
      showError("Failed to fetch user details. Please try again later.");
      setUserDetails(null);
    } finally {
      setDetailsLoaded(true);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        await fetchUserDetails(user);
      } else {
        setUserDetails(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await fetchUserDetails(result.user);
      // trackUserSignIn("email");
      showSuccess("Successfully signed in");
    } catch (error: unknown) {
      logger.error("Sign in error:", error);
      if (error instanceof FirebaseError) {
        showError(getFriendlyErrorMessage(error, "Failed to sign in"));
      }
      throw error;
    }
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    phone: string
  ): Promise<void> => {
    setSignupInProgress(true);
    try {
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      await createMemberDoc(result.user.uid, fullName, email, phone);

      // Send branded email verification (after the member doc exists, since
      // the function reads the account). Falls back to the default email.
      if (result.user) {
        await sendVerificationEmail(result.user);
      }

      // Fetch the newly created user details
      await fetchUserDetails(result.user);

      // Log audit trail
      try {
        const { logAuditTrail } = await import("../services/auditService");
        await logAuditTrail(
          result.user.uid,
          "MEMBER_SIGNUP",
          {
            email,
            full_name: fullName,
            phone,
            role: "member"
          }
        );
      } catch (auditError) {
        logger.error("Failed to log member signup audit trail:", auditError);
      }

      showSuccess("Account created successfully. Please verify your email.");
    } catch (error: unknown) {
      logger.error("Error during signup:", error);
      // If there's an error, attempt to delete the auth user if it was created
      if (auth.currentUser) {
        await auth.currentUser.delete();
      }
      if (error instanceof FirebaseError) {
        showError(getFriendlyErrorMessage(error, "Failed to create account"));
        throw error;
      } else {
        throw error;
      }
    } finally {
      setSignupInProgress(false);
    }
  };

  /**
   * Google sign-in via popup. Returns a discriminated result so the caller
   * navigates deterministically rather than racing the auth-state listener.
   */
  const signInWithGoogle = async (): Promise<GoogleSignInResult> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const memberSnap = await getDoc(doc(db, "members", result.user.uid));
      if (memberSnap.exists()) {
        await fetchUserDetails(result.user);
        showSuccess("Successfully signed in");
        return { status: "signed-in" };
      }
      // Authenticated, but no member record yet → collect profile details
      return { status: "needs-profile" };
    } catch (error: unknown) {
      if (
        error instanceof FirebaseError &&
        error.code === "auth/account-exists-with-different-credential"
      ) {
        const email = error.customData?.email as string | undefined;
        const pendingCred = GoogleAuthProvider.credentialFromError(error);
        if (email && pendingCred) {
          return { status: "account-exists", email, pendingCred };
        }
      }
      logger.error("Google sign-in error:", error);
      if (error instanceof FirebaseError) {
        showError(getFriendlyErrorMessage(error, "Google sign-in failed"));
      }
      throw error;
    }
  };

  /**
   * Link a pending Google credential to an existing email/password account:
   * the user proves ownership with their password, then Google is attached.
   */
  const linkGoogleToPassword = async (
    email: string,
    password: string,
    pendingCred: AuthCredential
  ): Promise<GoogleSignInResult> => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await linkWithCredential(result.user, pendingCred);
      const memberSnap = await getDoc(doc(db, "members", result.user.uid));
      if (memberSnap.exists()) {
        await fetchUserDetails(result.user);
        showSuccess("Google account linked");
        return { status: "signed-in" };
      }
      return { status: "needs-profile" };
    } catch (error: unknown) {
      logger.error("Account linking error:", error);
      if (error instanceof FirebaseError) {
        showError(getFriendlyErrorMessage(error, "Failed to link Google account"));
      }
      throw error;
    }
  };

  /**
   * Create the member document for a Google user who has just supplied the
   * profile fields Google does not provide (phone). Uses the authenticated
   * account email to satisfy the Firestore create rule. No verification email
   * is sent — Google accounts are already verified.
   */
  const completeGoogleProfile = async (
    fullName: string,
    phone: string
  ): Promise<void> => {
    const current = auth.currentUser;
    if (!current || !current.email) {
      throw new Error("Not signed in");
    }
    await createMemberDoc(current.uid, fullName, current.email, phone);
    await fetchUserDetails(current);

    try {
      const { logAuditTrail } = await import("../services/auditService");
      await logAuditTrail(current.uid, "MEMBER_SIGNUP", {
        email: current.email,
        full_name: fullName,
        phone,
        role: "member",
        provider: "google",
      });
    } catch (auditError) {
      logger.error("Failed to log member signup audit trail:", auditError);
    }

    showSuccess("Profile completed");
  };

  const signOut = async (): Promise<void> => {
    try {
      await firebaseSignOut(auth);
      setUserDetails(null);
      setDetailsLoaded(false);

      showSuccess("Successfully signed out");
    } catch (error: unknown) {
      logger.error("Sign out error:", error);
      if (error instanceof FirebaseError) {
        showError(getFriendlyErrorMessage(error, "Failed to sign out"));
        throw error;
      } else {
        throw error;
      }
    }
  };

  const refreshUserDetails = async (): Promise<void> => {
    if (user) {
      await fetchUserDetails(user);
    }
  };

  const resendVerificationEmail = async (): Promise<void> => {
    if (user) {
      try {
        await sendVerificationEmail(user);
        showSuccess("Verification email sent");
      } catch (error: unknown) {
        if (error instanceof FirebaseError) {
          showError(getFriendlyErrorMessage(error, "Failed to send verification email"));
          throw error;
        } else {
          throw error;
        }
      }
    }
  };
  const resetPassword = async (email: string): Promise<void> => {
    try {
      await sendPasswordResetEmail(auth, email);
      showSuccess("Password reset email sent");
    } catch (error: unknown) {
      if (error instanceof FirebaseError) {
        showError(getFriendlyErrorMessage(error, "Failed to send password reset email"));

        throw error;
      } else {
        throw error;
      }
    }
  };
  const value = {
    user,
    userDetails,
    loading,
    detailsLoaded,
    signupInProgress,
    signIn,
    signUp,
    signInWithGoogle,
    linkGoogleToPassword,
    completeGoogleProfile,
    signOut,
    isAdmin: userDetails?.role === "admin",
    isApproved:
      userDetails?.status === "approved" || userDetails?.status === "active",
    refreshUserDetails,
    resendVerificationEmail,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
