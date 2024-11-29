import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
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