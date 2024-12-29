import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { requestMemberDeletion } from './deletionService';
import type { Member } from '../types';

export const fetchMemberDetails = async (memberId: string): Promise<Member | null> => {
  try {
    const memberDoc = await getDocs(collection(db, 'members'));
    const member = memberDoc.docs.find(m => m.id === memberId);
    return member ? { id: member.id, ...member.data() } as Member : null;
  } catch (error) {
    console.error('Error fetching member details:', error);
    return null;
  }
};

export const deleteMemberWithAuth = async (memberId: string, requesterId: string): Promise<void> => {
  try {
    // Create deletion request instead of direct deletion
    await requestMemberDeletion(memberId, requesterId);
    
    // Delete Firestore document
    const memberRef = doc(db, 'members', memberId);
    await deleteDoc(memberRef);
  } catch (error) {
    console.error('Error deleting member:', error);
    throw error;
  }
};