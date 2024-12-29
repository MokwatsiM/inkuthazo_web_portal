import { 
  collection, 
  addDoc, 
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { toFirestoreTimestamp } from '../../utils/dateUtils';
import { uploadProofOfPayment, deleteProofOfPayment } from './storage';
import type { Contribution, ContributionStatus } from '../../types/contribution';

const getMemberName = async (memberId: string): Promise<string> => {
  try {
    const memberDoc = await getDoc(doc(db, 'members', memberId));
    if (memberDoc.exists()) {
      return memberDoc.data().full_name;
    }
    return 'Unknown Member';
  } catch (error) {
    console.error('Error fetching member name:', error);
    return 'Unknown Member';
  }
};

export const reviewContribution = async (
  id: string,
  status: ContributionStatus,
  notes: string,
  reviewerId: string
): Promise<void> => {
  const contributionRef = doc(db, 'contributions', id);
  await updateDoc(contributionRef, {
    status,
    review_notes: notes,
    reviewed_by: reviewerId,
    reviewed_at: Timestamp.now()
  });
};

export const addContribution = async (
  contribution: Omit<Contribution, 'id' | 'members' | 'status'>,
  file?: File | null
): Promise<Contribution> => {
  let proof_of_payment: string | undefined;

  if (file) {
    proof_of_payment = await uploadProofOfPayment(file);
  }

  const contributionsRef = collection(db, 'contributions');
  const docRef = await addDoc(contributionsRef, {
    ...contribution,
    date: toFirestoreTimestamp(contribution.date),
    proof_of_payment,
    status: 'pending' as ContributionStatus
  });

  // Fetch member name
  const memberName = await getMemberName(contribution.member_id);

  return {
    id: docRef.id,
    ...contribution,
    date: toFirestoreTimestamp(contribution.date),
    status: 'pending',
    proof_of_payment,
    members: {
      full_name: memberName
    }
  } as Contribution;
};

export const updateContribution = async (
  id: string,
  contribution: Partial<Contribution>,
  file?: File | null
): Promise<Partial<Contribution>> => {
  let proof_of_payment = contribution.proof_of_payment;

  if (file) {
    proof_of_payment = await uploadProofOfPayment(file);
  }

  const updateData = {
    ...contribution,
    ...(proof_of_payment && { proof_of_payment }),
    ...(contribution.date && { date: toFirestoreTimestamp(contribution.date) })
  };

  const contributionRef = doc(db, 'contributions', id);
  await updateDoc(contributionRef, updateData);

  if (contribution.member_id) {
    const memberName = await getMemberName(contribution.member_id);
    updateData.members = {
      full_name: memberName
    };
  }

  return updateData;
};

export const deleteContribution = async (id: string, proofOfPaymentUrl?: string): Promise<void> => {
  if (proofOfPaymentUrl) {
    await deleteProofOfPayment(proofOfPaymentUrl);
  }

  const contributionRef = doc(db, 'contributions', id);
  await deleteDoc(contributionRef);
};