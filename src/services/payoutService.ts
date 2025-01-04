import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Claim } from '../types/claim';
import type { Payout } from '../types/payout';

export const createPayoutFromClaim = async (claim: Claim): Promise<void> => {
  try {
    const payoutData: Omit<Payout, 'id' | 'members'> = {
      member_id: claim.member_id,
      amount: claim.amount,
      date: Timestamp.now(),
      reason: `${claim.type.charAt(0).toUpperCase() + claim.type.slice(1)} claim payout for ${claim.claimant.full_name}`,
      status: 'pending'
    };

    await addDoc(collection(db, 'payouts'), payoutData);
  } catch (error) {
    console.error('Error creating payout from claim:', error);
    throw error;
  }
};