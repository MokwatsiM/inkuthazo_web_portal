import { 
 collection, 
  addDoc, 
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  query,
  where,
  getDocs,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { toFirestoreTimestamp } from '../../utils/dateUtils';
import { uploadProofOfPayment, deleteProofOfPayment } from './storage';
import type { Contribution, ContributionStatus } from '../../types/contribution';
import { hasDuplicateContribution } from '../../utils/contributionValidation';


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
  
  // Fetch contribution to get member_id for audit log
  let memberName = 'Unknown Member';
  try {
    const docSnap = await getDoc(contributionRef);
    if (docSnap.exists()) {
      memberName = await getMemberName(docSnap.data().member_id);
    }
  } catch (err) {
    console.error('Failed to fetch contribution for audit log:', err);
  }

  await updateDoc(contributionRef, {
    status,
    review_notes: notes,
    reviewed_by: reviewerId,
    reviewed_at: Timestamp.now()
  });

  // Log audit trail
  try {
    const { logAuditTrail } = await import('../auditService');
    await logAuditTrail(
      reviewerId,
      'CONTRIBUTION_REVIEW',
      {
        contribution_id: id,
        member_name: memberName,
        status,
        notes,
        timestamp: new Date().toISOString()
      }
    );
  } catch (auditError) {
    console.error('Failed to log contribution review audit trail:', auditError);
  }
};

export const addContribution = async (
  contribution: Omit<Contribution, 'id' | 'members' | 'status'>,
  file?: File | null
): Promise<Contribution> => {
 const contributionsRef = collection(db, 'contributions');
  const existingContributions = await getDocs(
    query(contributionsRef, where('member_id', '==', contribution.member_id))
  );

  const contributions = existingContributions.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Contribution[];

  if (hasDuplicateContribution(contributions, contribution)) {
    throw new Error(`A ${contribution.type} contribution has already been recorded for this month`);
  }

  let proof_of_payment: string | undefined;

  if (file) {
    proof_of_payment = file? await uploadProofOfPayment(file,contribution.member_id):undefined;
  }

  // const contributionsRef = collection(db, 'contributions');
  const docRef = await addDoc(contributionsRef, {
    ...contribution,
    date: toFirestoreTimestamp(contribution.date),
    ...(proof_of_payment && { proof_of_payment }),
    status: 'pending' as ContributionStatus
  });

  // Fetch member name
  const memberName = await getMemberName(contribution.member_id);

  // Log audit trail
  try {
    const { logAuditTrail } = await import('../auditService');
    await logAuditTrail(
      contribution.member_id,
      'CONTRIBUTION_CREATE',
      {
        type: contribution.type,
        amount: contribution.amount,
        member_name: memberName
      },
      memberName
    );
  } catch (auditError) {
    console.error('Failed to log contribution creation audit trail:', auditError);
  }

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
    proof_of_payment = await uploadProofOfPayment(file,contribution.member_id!);
  }

  const updateData = {
    ...contribution,
    ...(proof_of_payment && { proof_of_payment }),
    ...(contribution.date && { date: toFirestoreTimestamp(contribution.date) })
  };

  const contributionRef = doc(db, 'contributions', id);
  
  // Fetch current state for audit log
  let previousContribution: any = null;
  try {
    const docSnap = await getDoc(contributionRef);
    if (docSnap.exists()) {
      previousContribution = docSnap.data();
    }
  } catch (err) {
    console.error('Failed to fetch previous contribution state:', err);
  }

  await updateDoc(contributionRef, updateData);

  // Log audit trail
  try {
    const { logAuditTrail } = await import('../auditService');
    
    // Extract changes
    const changes: Record<string, { old: any; new: any }> = {};
    if (previousContribution) {
      Object.keys(updateData).forEach((key) => {
        if (JSON.stringify(previousContribution[key]) !== JSON.stringify((updateData as any)[key])) {
          changes[key] = {
            old: previousContribution[key],
            new: (updateData as any)[key]
          };
        }
      });
    }

    // Fetch member name for audit log
    const memberName = await getMemberName(previousContribution?.member_id || contribution.member_id || 'system');

    await logAuditTrail(
      contribution.member_id || 'system',
      'CONTRIBUTION_UPDATE',
      {
        contribution_id: id,
        member_name: memberName,
        changes
      },
      memberName !== 'Unknown Member' ? memberName : undefined
    );
  } catch (auditError) {
    console.error('Failed to log contribution update audit trail:', auditError);
  }

  if (contribution.member_id) {
    const memberName = await getMemberName(contribution.member_id);
    updateData.members = {
      full_name: memberName
    };
  }

  return updateData;
};

export const deleteContribution = async (id: string, proofOfPaymentUrl?: string): Promise<void> => {
  const contributionRef = doc(db, 'contributions', id);

  // Log audit trail BEFORE deletion so we can fetch the member_id
  try {
    const { logAuditTrail } = await import('../auditService');
    
    let memberName = 'Unknown Member';
    try {
      const docSnap = await getDoc(contributionRef);
      if (docSnap.exists()) {
        memberName = await getMemberName(docSnap.data().member_id);
      }
    } catch (e) {}

    await logAuditTrail(
      'admin', 
      'CONTRIBUTION_DELETE',
      {
        contribution_id: id,
        member_name: memberName
      },
      'Admin'
    );
  } catch (auditError) {
    console.error('Failed to log contribution deletion audit trail:', auditError);
  }

  if (proofOfPaymentUrl) {
    await deleteProofOfPayment(proofOfPaymentUrl);
  }

  await deleteDoc(contributionRef);
};