import { collection, addDoc, deleteDoc, doc, Timestamp, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { archiveMemberContributions } from '../utils/archivedUtils';

export const requestMemberDeletion = async (memberId: string, requesterId: string): Promise<void> => {
  try {
    // Get member details first
    const memberDoc = await getDoc(doc(db, 'members', memberId));
    if (!memberDoc.exists()) {
      throw new Error('Member not found');
    }

    // First archive all member contributions
    await archiveMemberContributions(memberId);

    // Create a deletion request
    await addDoc(collection(db, 'deletion_requests'), {
      member_id: memberId,
      requested_by: requesterId,
      requested_at: Timestamp.now(),
      status: 'pending',
      member_email: memberDoc.data().email, // Store email for reference
      auth_deleted: false
    });
  } catch (error) {
    console.error('Error requesting member deletion:', error);
    throw error;
  }
};

export const deleteMember = async (memberId: string): Promise<void> => {
  try {
    // Delete the member document
    const memberRef = doc(db, 'members', memberId);
    await deleteDoc(memberRef);
  } catch (error) {
    console.error('Error deleting member:', error);
    throw error;
  }
};