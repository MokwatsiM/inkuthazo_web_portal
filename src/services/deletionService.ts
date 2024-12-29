import { collection, addDoc, deleteDoc, doc, Timestamp, getDoc,updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { archiveMemberContributions } from '../utils/archivedUtils';
import type { DeletionRequestStatus } from '../types/deletion';
import type { Member } from '../types';


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
      member_email: memberDoc.data().email,
      auth_deleted: false,
      member_data: memberDoc.data() // Store member data for potential restoration
    });
  } catch (error) {
    console.error('Error requesting member deletion:', error);
    throw error;
  }
};

export const updateDeletionRequestStatus = async (
  requestId: string, 
  status: DeletionRequestStatus
): Promise<void> => {
  const requestRef = doc(db, 'deletion_requests', requestId);
  await updateDoc(requestRef, {
    status,
    updated_at: Timestamp.now()
  });
};

export const restoreMemberData = async (memberId: string, memberData: Partial<Member>): Promise<void> => {
  try {
    const memberRef = doc(db, 'members', memberId);
    await updateDoc(memberRef, {
      ...memberData,
      status: 'active', // Ensure member is set to active when restored
      restored_at: Timestamp.now()
    });
  } catch (error) {
    console.error('Error restoring member data:', error);
    throw error;
  }
};

export const rejectDeletionRequest = async (requestId: string): Promise<void> => {
  try {
    // Get the deletion request
    const requestRef = doc(db, 'deletion_requests', requestId);
    const requestDoc = await getDoc(requestRef);
    
    if (!requestDoc.exists()) {
      throw new Error('Deletion request not found');
    }

    const requestData = requestDoc.data();
    
    // Restore member data
    if (requestData.member_data) {
      await restoreMemberData(requestData.member_id, requestData.member_data);
    }

    // Update request status
    await updateDeletionRequestStatus(requestId, 'rejected');
  } catch (error) {
    console.error('Error rejecting deletion request:', error);
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