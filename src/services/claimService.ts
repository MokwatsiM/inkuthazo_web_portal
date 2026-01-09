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
import { createPayoutFromClaim } from './payoutService';
import type { Claim, ClaimStatus } from '../types/claim';

export const uploadClaimDocument = async (file: File, memberId: string): Promise<string> => {
  const storageRef = ref(storage, `claim_documents/${memberId}/${Date.now()}_${file.name}`);
  const snapshot = await uploadBytes(storageRef, file);
  return getDownloadURL(snapshot.ref);
};

export const addClaim = async (
  claim: Omit<Claim, 'id' | 'members' | 'status'>,
  files?: File[]
): Promise<Claim> => {
  let documents_url: string[] = [];

  if (files?.length) {
    documents_url = await Promise.all(
      files.map((file) => uploadClaimDocument(file, claim.member_id))
    );
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

  // Log audit trail
  try {
    const { logAuditTrail } = await import('./auditService');
    await logAuditTrail(
      claim.member_id,
      'CLAIM_CREATE',
      {
        claim_type: claim.type,
        claimant_name: claim.claimant.full_name,
        member_name: memberName,
        amount: claim.amount
      },
      memberName
    );
  } catch (auditError) {
    console.error('Failed to log claim creation audit trail:', auditError);
  }

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
  try {
    const claimRef = doc(db, 'claims', id);
    
    // Fetch claimant name for audit log
    let claimantName = 'Unknown Claimant';
    try {
      const claimSnapshot = await getDoc(claimRef);
      if (claimSnapshot.exists()) {
        const claimData = claimSnapshot.data();
        claimantName = claimData.claimant?.full_name || 'Unknown Claimant';
      }
    } catch (e) {}

    await updateDoc(claimRef, {
      status,
      review_notes: notes,
      reviewed_by: reviewerId,
      reviewed_at: Timestamp.now()
    });

    // If claim is approved, create a pending payout
    if (status === 'approved') {
      const claimDoc = await getDoc(claimRef);
      if (claimDoc.exists()) {
        const claimData = { id: claimDoc.id, ...claimDoc.data() } as Claim;
        await createPayoutFromClaim(claimData);
      }
    }

    // Log audit trail
    try {
      const { logAuditTrail } = await import('./auditService');
      
      // Resolve reviewer name if possible (service doesn't have it, but we can resolve in UI)
      // For now, focus on target name
      await logAuditTrail(
        reviewerId,
        'CLAIM_REVIEW',
        {
          claim_id: id,
          claimant_name: claimantName,
          status,
          notes,
          timestamp: new Date().toISOString()
        }
      );
    } catch (auditError) {
      console.error('Failed to log claim review audit trail:', auditError);
    }
  } catch (error) {
    console.error('Error reviewing claim:', error);
    throw error;
  }
};
