import { 
  collection, 
  addDoc, 
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { toFirestoreTimestamp } from '../utils/dateUtils';
import type { Contribution } from '../types';
import { fetchMemberDetails } from './memberService';

export const uploadProofOfPayment = async (file: File): Promise<string> => {
  const storageRef = ref(storage, `proof_of_payments/${Date.now()}_${file.name}`);
  const snapshot = await uploadBytes(storageRef, file);
  return getDownloadURL(snapshot.ref);
};

export const deleteProofOfPayment = async (url: string): Promise<void> => {
  try {
    const fileRef = ref(storage, url);
    await deleteObject(fileRef);
  } catch (error) {
    console.error('Error deleting proof of payment file:', error);
    throw error;
  }
};

export const addContribution = async (
  contribution: Omit<Contribution, 'id' | 'members'>,
  file?: File
): Promise<Contribution> => {
  let proof_of_payment: string | undefined;

  if (file) {
    proof_of_payment = await uploadProofOfPayment(file);
  }

  const contributionsRef = collection(db, 'contributions');
  const docRef = await addDoc(contributionsRef, {
    ...contribution,
    proof_of_payment,
    date: contribution.date
  });

  const memberDetails = await fetchMemberDetails(contribution.member_id);

  return {
    id: docRef.id,
    ...contribution,
    date: contribution.date,
    proof_of_payment,
    members: {
      full_name: memberDetails?.full_name || 'Unknown Member'
    }
  } as Contribution;
};

export const updateContribution = async (
  id: string,
  contribution: Partial<Contribution>,
  file?: File
): Promise<Partial<Contribution>> => {
  let proof_of_payment = contribution.proof_of_payment;

  if (file) {
    proof_of_payment = await uploadProofOfPayment(file);
  }

  const updateData = {
    ...contribution,
    ...(proof_of_payment && { proof_of_payment }),
    ...(contribution.date && { date: contribution.date })
  };

  const contributionRef = doc(db, 'contributions', id);
  await updateDoc(contributionRef, updateData);

  if (contribution.member_id) {
    const memberDetails = await fetchMemberDetails(contribution.member_id);
    updateData.members = {
      full_name: memberDetails?.full_name || 'Unknown Member'
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