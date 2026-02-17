// src/services/donationService.ts
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp,
  QueryConstraint,
  limit,
  startAfter,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { logAuditTrail } from './auditService';
import type {
  Donation,
  DonationReview,
  DonationFilter,
  DonationSummary,
  DonationType,
  DonationSource,
  DonationStatus,
} from '../types/donation';

/**
 * Create a new donation record
 */
export const createDonation = async (
  donationData: Omit<Donation, 'id' | 'created_at' | 'updated_at' | 'status'>,
  userId: string,
  userName?: string
): Promise<string> => {
  try {
    const donationsRef = collection(db, 'donations');

    // Remove undefined fields to avoid Firestore error
    const cleanedData = Object.fromEntries(
      Object.entries(donationData).filter(([_, value]) => value !== undefined)
    );

    const newDonation = {
      ...cleanedData,
      status: 'pending' as DonationStatus,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    };

    const docRef = await addDoc(donationsRef, newDonation);

    // Log audit trail
    await logAuditTrail(
      userId,
      'DONATION_CREATE',
      {
        donation_id: docRef.id,
        donor_name: donationData.donor_name,
        amount: donationData.amount,
        type: donationData.type,
        source: donationData.source,
        member_id: donationData.member_id,
      },
      userName
    );

    return docRef.id;
  } catch (error) {
    console.error('Error creating donation:', error);
    throw error;
  }
};

/**
 * Get a single donation by ID
 */
export const getDonation = async (donationId: string): Promise<Donation | null> => {
  try {
    const donationRef = doc(db, 'donations', donationId);
    const donationSnap = await getDoc(donationRef);

    if (!donationSnap.exists()) {
      return null;
    }

    return {
      id: donationSnap.id,
      ...donationSnap.data(),
    } as Donation;
  } catch (error) {
    console.error('Error fetching donation:', error);
    throw error;
  }
};

/**
 * Get all donations with optional filtering
 */
export const getDonations = async (
  filters: DonationFilter = {},
  limitCount: number = 50,
  lastDoc?: any
): Promise<{ donations: Donation[]; lastDoc: any }> => {
  try {
    const donationsRef = collection(db, 'donations');
    const constraints: QueryConstraint[] = [orderBy('date', 'desc')];

    // Apply filters
    if (filters.source) {
      constraints.push(where('source', '==', filters.source));
    }
    if (filters.type) {
      constraints.push(where('type', '==', filters.type));
    }
    if (filters.status) {
      constraints.push(where('status', '==', filters.status));
    }
    if (filters.member_id) {
      constraints.push(where('member_id', '==', filters.member_id));
    }
    if (filters.startDate) {
      constraints.push(where('date', '>=', Timestamp.fromDate(filters.startDate)));
    }
    if (filters.endDate) {
      constraints.push(where('date', '<=', Timestamp.fromDate(filters.endDate)));
    }

    constraints.push(limit(limitCount));

    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }

    const q = query(donationsRef, ...constraints);
    const snapshot = await getDocs(q);

    const donations = snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as Donation)
    );

    return {
      donations,
      lastDoc: snapshot.docs[snapshot.docs.length - 1],
    };
  } catch (error) {
    console.error('Error fetching donations:', error);
    throw error;
  }
};

/**
 * Update a donation
 */
export const updateDonation = async (
  donationId: string,
  updates: Partial<Donation>,
  userId: string,
  userName?: string
): Promise<void> => {
  try {
    const donationRef = doc(db, 'donations', donationId);
    const oldDonation = await getDonation(donationId);

    if (!oldDonation) {
      throw new Error('Donation not found');
    }

    // Remove undefined fields to avoid Firestore error
    const cleanedUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    const updatedData = {
      ...cleanedUpdates,
      updated_at: Timestamp.now(),
    };

    await updateDoc(donationRef, updatedData);

    // Log audit trail with changes
    const changes: Record<string, any> = {};
    Object.keys(updates).forEach((key) => {
      if (oldDonation[key as keyof Donation] !== updates[key as keyof Donation]) {
        changes[key] = {
          old: oldDonation[key as keyof Donation],
          new: updates[key as keyof Donation],
        };
      }
    });

    await logAuditTrail(
      userId,
      'DONATION_UPDATE',
      {
        donation_id: donationId,
        donor_name: oldDonation.donor_name,
        changes,
      },
      userName
    );
  } catch (error) {
    console.error('Error updating donation:', error);
    throw error;
  }
};

/**
 * Review a donation (approve/reject)
 */
export const reviewDonation = async (
  donationId: string,
  review: DonationReview,
  userId: string,
  userName?: string
): Promise<void> => {
  try {
    const donationRef = doc(db, 'donations', donationId);
    const donation = await getDonation(donationId);

    if (!donation) {
      throw new Error('Donation not found');
    }

    await updateDoc(donationRef, {
      status: review.status,
      review_notes: review.notes,
      reviewed_by: review.reviewer_id,
      reviewed_at: Timestamp.fromDate(review.reviewed_at),
      updated_at: Timestamp.now(),
    });

    // Log audit trail
    await logAuditTrail(
      userId,
      'DONATION_REVIEW',
      {
        donation_id: donationId,
        donor_name: donation.donor_name,
        amount: donation.amount,
        old_status: donation.status,
        new_status: review.status,
        review_notes: review.notes,
      },
      userName
    );
  } catch (error) {
    console.error('Error reviewing donation:', error);
    throw error;
  }
};

/**
 * Delete a donation
 */
export const deleteDonation = async (
  donationId: string,
  userId: string,
  userName?: string
): Promise<void> => {
  try {
    const donation = await getDonation(donationId);

    if (!donation) {
      throw new Error('Donation not found');
    }

    const donationRef = doc(db, 'donations', donationId);
    await deleteDoc(donationRef);

    // Log audit trail
    await logAuditTrail(
      userId,
      'DONATION_DELETE',
      {
        donation_id: donationId,
        donor_name: donation.donor_name,
        amount: donation.amount,
        type: donation.type,
        source: donation.source,
      },
      userName
    );
  } catch (error) {
    console.error('Error deleting donation:', error);
    throw error;
  }
};

/**
 * Get donation summary/statistics
 */
export const getDonationSummary = async (
  startDate?: Date,
  endDate?: Date
): Promise<DonationSummary> => {
  try {
    const donationsRef = collection(db, 'donations');
    const constraints: QueryConstraint[] = [where('status', '==', 'approved')];

    if (startDate) {
      constraints.push(where('date', '>=', Timestamp.fromDate(startDate)));
    }
    if (endDate) {
      constraints.push(where('date', '<=', Timestamp.fromDate(endDate)));
    }

    const q = query(donationsRef, ...constraints);
    const snapshot = await getDocs(q);

    const donations = snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as Donation)
    );

    // Initialize summary
    const summary: DonationSummary = {
      totalDonations: donations.length,
      totalAmount: 0,
      byType: {
        investment: { count: 0, amount: 0 },
        donation: { count: 0, amount: 0 },
        sponsorship: { count: 0, amount: 0 },
        grant: { count: 0, amount: 0 },
        other: { count: 0, amount: 0 },
      },
      bySource: {
        member: { count: 0, amount: 0 },
        outsider: { count: 0, amount: 0 },
        organization: { count: 0, amount: 0 },
      },
      byStatus: {
        pending: { count: 0, amount: 0 },
        approved: { count: 0, amount: 0 },
        rejected: { count: 0, amount: 0 },
      },
      topDonors: [],
    };

    // Process donations
    const donorMap = new Map<string, { amount: number; count: number }>();

    donations.forEach((donation) => {
      summary.totalAmount += donation.amount;

      // By type
      summary.byType[donation.type].count++;
      summary.byType[donation.type].amount += donation.amount;

      // By source
      summary.bySource[donation.source].count++;
      summary.bySource[donation.source].amount += donation.amount;

      // By status
      summary.byStatus[donation.status].count++;
      summary.byStatus[donation.status].amount += donation.amount;

      // Top donors
      const donorKey = donation.donor_name;
      if (!donorMap.has(donorKey)) {
        donorMap.set(donorKey, { amount: 0, count: 0 });
      }
      const donor = donorMap.get(donorKey)!;
      donor.amount += donation.amount;
      donor.count++;
    });

    // Convert donor map to sorted array
    summary.topDonors = Array.from(donorMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10); // Top 10 donors

    return summary;
  } catch (error) {
    console.error('Error fetching donation summary:', error);
    throw error;
  }
};

/**
 * Get donations for a specific member
 */
export const getMemberDonations = async (
  memberId: string
): Promise<Donation[]> => {
  try {
    const donationsRef = collection(db, 'donations');
    const q = query(
      donationsRef,
      where('member_id', '==', memberId),
      orderBy('date', 'desc')
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as Donation)
    );
  } catch (error) {
    console.error('Error fetching member donations:', error);
    throw error;
  }
};

/**
 * Issue a receipt for a donation
 */
export const issueDonationReceipt = async (
  donationId: string,
  receiptNumber: string,
  userId: string,
  userName?: string
): Promise<void> => {
  try {
    const donationRef = doc(db, 'donations', donationId);
    const donation = await getDonation(donationId);

    if (!donation) {
      throw new Error('Donation not found');
    }

    await updateDoc(donationRef, {
      receipt_issued: true,
      receipt_number: receiptNumber,
      updated_at: Timestamp.now(),
    });

    // Log audit trail
    await logAuditTrail(
      userId,
      'DONATION_RECEIPT_ISSUED',
      {
        donation_id: donationId,
        donor_name: donation.donor_name,
        amount: donation.amount,
        receipt_number: receiptNumber,
      },
      userName
    );
  } catch (error) {
    console.error('Error issuing donation receipt:', error);
    throw error;
  }
};

/**
 * Bulk approve donations
 */
export const bulkApproveDonations = async (
  donationIds: string[],
  reviewerId: string,
  notes: string,
  userId: string,
  userName?: string
): Promise<void> => {
  try {
    const batch = writeBatch(db);
    const reviewedAt = Timestamp.now();

    donationIds.forEach((id) => {
      const donationRef = doc(db, 'donations', id);
      batch.update(donationRef, {
        status: 'approved' as DonationStatus,
        review_notes: notes,
        reviewed_by: reviewerId,
        reviewed_at: reviewedAt,
        updated_at: reviewedAt,
      });
    });

    await batch.commit();

    // Log audit trail
    await logAuditTrail(
      userId,
      'DONATION_BULK_APPROVE',
      {
        donation_count: donationIds.length,
        donation_ids: donationIds,
        review_notes: notes,
      },
      userName
    );
  } catch (error) {
    console.error('Error bulk approving donations:', error);
    throw error;
  }
};
