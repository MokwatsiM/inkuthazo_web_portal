import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import type { Member } from '../types';

interface AuthContextType {
  user: User | null;
  userDetails: Member | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, phone: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userDetails, setUserDetails] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const userDoc = await getDoc(doc(db, 'members', user.uid));
        if (userDoc.exists()) {
          setUserDetails({ id: user.uid, ...userDoc.data() } as Member);
        }
      } else {
        setUserDetails(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<void> => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await getDoc(doc(db, 'members', result.user.uid));
    if (userDoc.exists()) {
      setUserDetails({ id: result.user.uid, ...userDoc.data() } as Member);
    }
  };

  const signUp = async (email: string, password: string, fullName: string, phone: string): Promise<void> => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const newMember: Omit<Member, 'id'> = {
      full_name: fullName,
      email,
      phone,
      join_date: Timestamp.now(),
      status: 'active',
      role: 'member' // Default role for new signups
    };
    
    await setDoc(doc(db, 'members', result.user.uid), newMember);
    setUserDetails({ id: result.user.uid, ...newMember } as Member);
  };

  const signOut = async (): Promise<void> => {
    await firebaseSignOut(auth);
    setUserDetails(null);
  };

  const value = {
    user,
    userDetails,
    loading,
    signIn,
    signUp,
    signOut,
    isAdmin: userDetails?.role === 'admin'
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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};