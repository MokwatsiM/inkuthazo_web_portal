// src/hooks/usePayouts.tsx
import {
  collection,
  query,
  orderBy,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '../config/firebase';
import { converter } from '../utils/firestoreConverter';
import { batchFetchMembers } from '../services/memberService';
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

const payoutsCollection = () =>
  collection(db, 'payouts').withConverter(converter<Payout>());

const fetchPayouts = async (): Promise<Payout[]> => {
  const snapshot = await getDocs(query(payoutsCollection(), orderBy('date', 'desc')));
  const payouts = snapshot.docs.map((docSnapshot) => docSnapshot.data());

  // Batch fetch member details to avoid N+1 query problem
  const memberIds = [...new Set(payouts.map((p) => p.member_id))];
  const membersMap = await batchFetchMembers(memberIds);

  return payouts.map((payout) => ({
    ...payout,
    members: {
      full_name: membersMap.get(payout.member_id)?.full_name || 'Unknown Member',
    },
  }));
};

export const usePayouts = (): UsePayoutsReturn => {
  const queryClient = useQueryClient();

  const {
    data: payouts = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['payouts'],
    queryFn: fetchPayouts,
  });

  const invalidatePayouts = () =>
    queryClient.invalidateQueries({ queryKey: ['payouts'] });

  const addPayoutMutation = useMutation({
    mutationFn: async (payout: Omit<Payout, 'id' | 'date'>): Promise<void> => {
      await addDoc(collection(db, 'payouts'), {
        ...payout,
        date: Timestamp.now(),
      });
    },
    onSuccess: invalidatePayouts,
  });

  const deletePayoutMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await deleteDoc(doc(db, 'payouts', id));
    },
    onSuccess: invalidatePayouts,
  });

  const updatePayoutStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: Payout['status'];
    }): Promise<void> => {
      await updateDoc(doc(db, 'payouts', id), { status });
    },
    onSuccess: invalidatePayouts,
  });

  return {
    payouts,
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    refetch: async () => {
      await refetch();
    },
    addPayout: (payout) => addPayoutMutation.mutateAsync(payout),
    deletePayout: (id) => deletePayoutMutation.mutateAsync(id),
    updatePayoutStatus: (id, status) =>
      updatePayoutStatusMutation.mutateAsync({ id, status }),
  };
};
