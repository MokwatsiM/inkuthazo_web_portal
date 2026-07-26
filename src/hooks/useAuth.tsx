import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { auth, db } from "../config/firebase";
import type { Member } from "../types";
import { useNotifications } from "./useNotifications";
import { FirebaseError } from "firebase/app";
import logger from "../utils/logger";

interface AuthContextType {
  user: User | null;
  userDetails: Member | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    phone: string
  ) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isApproved: boolean;
  refreshUserDetails: () => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
  const { showError, showSuccess } = useNotifications();

  const fetchUserDetails = async (user: User) => {
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
        showError(error.message || "Failed to sign in");
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
    try {
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const newMember: Omit<Member, "id"> = {
        full_name: fullName,
        email,
        phone,
        join_date: Timestamp.now(),
        status: "pending",
        role: "member",
      };

      const userDocRef = doc(db, "members", result.user.uid);
      await setDoc(userDocRef, newMember);

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
        showError(error.message || "Failed to create account");
        throw error;
      } else {
        throw error;
      }
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      await firebaseSignOut(auth);
      setUserDetails(null);

      showSuccess("Successfully signed out");
    } catch (error: unknown) {
      logger.error("Sign out error:", error);
      if (error instanceof FirebaseError) {
        showError(error.message || "Failed to sign out");
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
          showError(error.message || "Failed to send verification email");
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
        showError(error.message || "Failed to send password reset email");

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
    signIn,
    signUp,
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
