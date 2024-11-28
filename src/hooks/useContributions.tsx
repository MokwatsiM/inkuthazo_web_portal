// src/hooks/useContributions.tsx
import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  getDocs, 
  addDoc, 
  updateDoc,
  deleteDoc,
  doc,
  Timestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import type { Contribution } from '../types';

interface UseContributionsReturn {
  contributions: Contribution[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  addContribution: (contribution: Omit<Contribution, 'id' | 'members'>, file?: File) => Promise<Contribution>;
  updateContribution: (id: string, contribution: Partial<Contribution>, file?: File) => Promise<void>;
  deleteContribution: (id: string, proofOfPaymentUrl?: string) => Promise<void>;
}

export const useContributions = (): UseContributionsReturn => {
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContributions = async (): Promise<void> => {
    try {
      setLoading(true);
      const contributionsRef = collection(db, 'contributions');
      const q = query(contributionsRef, orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const contributionsData = await Promise.all(
        querySnapshot.docs.map(async doc => {
          const data = doc.data();
          const memberDoc = await getDocs(collection(db, 'members'));
          const member = memberDoc.docs.find(m => m.id === data.member_id);
          
          return {
            id: doc.id,
            ...data,
            members: {
              full_name: member?.data().full_name || 'Unknown Member'
            }
          };
        })
      ) as Contribution[];
      
      setContributions(contributionsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const addContribution = async (
    contribution: Omit<Contribution, 'id' | 'members'>,
    file?: File
  ): Promise<Contribution> => {
    try {
      let proof_of_payment: string | undefined;

      if (file) {
        const storageRef = ref(storage, `proof_of_payments/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        proof_of_payment = await getDownloadURL(snapshot.ref);
      }

      const contributionsRef = collection(db, 'contributions');
      const docRef = await addDoc(contributionsRef, {
        ...contribution,
        proof_of_payment,
        date: Timestamp.now()
      });

      const memberDoc = await getDocs(collection(db, 'members'));
      const member = memberDoc.docs.find(m => m.id === contribution.member_id);

      const newContribution = {
        id: docRef.id,
        ...contribution,
        proof_of_payment,
        members: {
          full_name: member?.data().full_name || 'Unknown Member'
        }
      } as Contribution;

      setContributions(prev => [newContribution, ...prev]);
      return newContribution;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  };

  const updateContribution = async (
    id: string,
    contribution: Partial<Contribution>,
    file?: File
  ): Promise<void> => {
    try {
      let proof_of_payment = contribution.proof_of_payment;

      if (file) {
        const storageRef = ref(storage, `proof_of_payments/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        proof_of_payment = await getDownloadURL(snapshot.ref);
      }

      const contributionRef = doc(db, 'contributions', id);
      await updateDoc(contributionRef, {
        ...contribution,
        ...(proof_of_payment && { proof_of_payment })
      });

      const memberDoc = await getDocs(collection(db, 'members'));
      const member = memberDoc.docs.find(m => m.id === contribution.member_id);

      setContributions(prev => prev.map(c => {
        if (c.id === id) {
          return {
            ...c,
            ...contribution,
            ...(proof_of_payment && { proof_of_payment }),
            members: {
              full_name: member?.data().full_name || 'Unknown Member'
            }
          };
        }
        return c;
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  };

  const deleteContribution = async (id: string, proofOfPaymentUrl?: string): Promise<void> => {
    try {
      // Delete the proof of payment file from storage if it exists
      if (proofOfPaymentUrl) {
        try {
          const fileRef = ref(storage, proofOfPaymentUrl);
          await deleteObject(fileRef);
        } catch (error) {
          console.error('Error deleting proof of payment file:', error);
        }
      }

      // Delete the contribution document
      const contributionRef = doc(db, 'contributions', id);
      await deleteDoc(contributionRef);

      // Update local state
      setContributions(prev => prev.filter(contribution => contribution.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  };

  useEffect(() => {
    fetchContributions();
  }, []);

  return {
    contributions,
    loading,
    error,
    refetch: fetchContributions,
    addContribution,
    updateContribution,
    deleteContribution
  };
};
