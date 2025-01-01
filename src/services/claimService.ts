import { 
  collection, 
  addDoc, 
  updateDoc,
  doc,
  getDoc,
  Timestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import type { Claim, ClaimStatus } from '../types/claim';

export const uploadClaimDocument = async (file: File): Promise<string> => {
  const storageRef = ref(storage, `claim_documents/${Date.now()}_${file.name}`);
  const snapshot = await uploadBytes(storageRef, file);
  return getDownloadURL(snapshot.ref);
};

export const addClaim = async (
  claim: Omit<Claim, 'id' | 'members' | 'status'>,
  files?: File[]
): Promise<Claim> => {
  let documents_url: string[] = [];

  if (files?.length) {
    documents_url = await Promise.all(files.map(uploadClaimDocument,));
  }

  const claimsRef = collection(db, 'claims');
  const docRef = await addDoc(claimsRef, {
    ...claim,
    documents_url,
    status: 'pending' as ClaimStatus,
    date: Timestamp.now()
  });

  const memberDoc = await getDoc(doc(db, 'members', claim.member_id));
  const memberName = memberDoc.exists() ? memberDoc.data().full_name : 'Unknown Member';

  return {
    id: docRef.id,
    ...claim,
    documents_url,
    status: 'pending',
    date: Timestamp.now(),
    members: {
      full_name: memberName
    }
  } as Claim;
};

export const reviewClaim = async (
  id: string,
  status: ClaimStatus,
  notes: string,
  reviewerId: string
): Promise<void> => {
  const claimRef = doc(db, 'claims', id);
  await updateDoc(claimRef, {
    status,
    review_notes: notes,
    reviewed_by: reviewerId,
    reviewed_at: Timestamp.now()
  });
};