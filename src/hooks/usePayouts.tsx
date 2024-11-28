// src/hooks/usePayouts.tsx
import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  getDocs, 
  addDoc, 
  deleteDoc,
  updateDoc,
  doc,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Payout } from '../types';

interface UsePayoutsReturn {
  payouts: Payout[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  addPayout: (payout: Omit<Payout, 'id' | 'date'>) => Promise<void>;
  deletePayout: (id: string) => Promise<void>;
  updatePayoutStatus: (id: string, status: Payout['status']) => Promise<void>;
}

export const usePayouts = (): UsePayoutsReturn => {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayouts = async (): Promise<void> => {
    try {
      setLoading(true);
      const payoutsRef = collection(db, 'payouts');
      const q = query(payoutsRef, orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const payoutsData = await Promise.all(
        querySnapshot.docs.map(async doc => {
          const data = doc.data();
          const memberDoc = await getDocs(collection(db, 'members'));
          const member = memberDoc.docs.find(m => m.id === data.member_id);
          
          return {
            id: doc.id,
            ...data,
            date: data.date,
            members: {
              full_name: member?.data()?.full_name || 'Unknown Member'
            }
          } as Payout;
        })
      );
      
      setPayouts(payoutsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const addPayout = async (payout: Omit<Payout, 'id' | 'date'>): Promise<void> => {
    try {
      const payoutsRef = collection(db, 'payouts');
      const newPayout = {
        ...payout,
        date: Timestamp.now()
      };

      await addDoc(payoutsRef, newPayout);
      await fetchPayouts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  };

  const deletePayout = async (id: string): Promise<void> => {
    try {
      const payoutRef = doc(db, 'payouts', id);
      await deleteDoc(payoutRef);
      setPayouts(prev => prev.filter(payout => payout.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  };

  const updatePayoutStatus = async (id: string, status: Payout['status']): Promise<void> => {
    try {
      const payoutRef = doc(db, 'payouts', id);
      await updateDoc(payoutRef, { status });
      setPayouts(prev => prev.map(payout => 
        payout.id === id ? { ...payout, status } : payout
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, []);

  return {
    payouts,
    loading,
    error,
    refetch: fetchPayouts,
    addPayout,
    deletePayout,
    updatePayoutStatus
  };
};
