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
import { auth, db } from "../config/firebase";
import type { Member } from "../types";
import { useNotifications } from "./useNotifications";

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
        setUserDetails({ id: user.uid, ...memberData } as Member);
      } else {
        setUserDetails(null);
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
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
    } catch (error) {
      console.error("Sign in error:", error);
      showError((error as string) || "Failed to sign in");
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

      // Send email verification
      if (result.user) {
        await sendEmailVerification(result.user);
      }

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

      // Fetch the newly created user details
      await fetchUserDetails(result.user);
      showSuccess("Account created successfully. Please verify your email.");
    } catch (error) {
      console.error("Error during signup:", error);
      // If there's an error, attempt to delete the auth user if it was created
      if (auth.currentUser) {
        await auth.currentUser.delete();
      }
      showError((error as string) || "Failed to create account");
      throw error;
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      await firebaseSignOut(auth);
      setUserDetails(null);
      showSuccess("Successfully signed out");
    } catch (error) {
      console.error("Sign out error:", error);
      showError((error as string) || "Failed to sign out");
      throw error;
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
        await sendEmailVerification(user);
        showSuccess("Verification email sent");
      } catch (error) {
        showError((error as string) || "Failed to send verification email");
        throw error;
      }
    }
  };
  const resetPassword = async (email: string): Promise<void> => {
    try {
      await sendPasswordResetEmail(auth, email);
      showSuccess("Password reset email sent");
    } catch (error) {
      showError((error as string) || "Failed to send password reset email");
      throw error;
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
