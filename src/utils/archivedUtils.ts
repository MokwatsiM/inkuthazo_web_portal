// src/utils/archiveUtils.ts
import { collection, getDocs, query, where, addDoc, deleteDoc, doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Contribution, Member } from '../types';
import type { ArchivedContribution } from '../types/archived';

export const archiveMemberContributions = async (memberId: string): Promise<void> => {
  try {
    // Get member details
    const memberDoc = await getDoc(doc(db, 'members', memberId));
    if (!memberDoc.exists()) {
      throw new Error('Member not found');
    }
    const memberData = memberDoc.data() as Member;

    // Get all contributions for the member
    const contributionsRef = collection(db, 'contributions');
    const contributionsQuery = query(contributionsRef, where('member_id', '==', memberId));
    const contributionsSnapshot = await getDocs(contributionsQuery);

    // Archive each contribution
    const archivePromises = contributionsSnapshot.docs.map(async (contributionDoc) => {
      const contributionData = contributionDoc.data() as Contribution;

      // Create archived contribution document
      const archivedContribution: ArchivedContribution = {
        id: contributionDoc.id,
        member: {
          id: memberId,
          full_name: memberData.full_name,
          email: memberData.email,
          phone: memberData.phone,
          join_date: memberData.join_date,
          status: memberData.status
        },
        contribution: {
          amount: contributionData.amount,
          date: contributionData.date,
          type: contributionData.type,
          proof_of_payment: contributionData.proof_of_payment
        },
        archived_at: Timestamp.now()
      };

      // Add to archived_contributions collection
      await addDoc(collection(db, 'archived_contributions'), archivedContribution);

      // Delete original contribution
      await deleteDoc(doc(db, 'contributions', contributionDoc.id));
    });

    // Wait for all archiving operations to complete
    await Promise.all(archivePromises);
  } catch (error) {
    console.error('Error archiving member contributions:', error);
    throw error;
  }
};
