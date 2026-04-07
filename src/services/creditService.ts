// src/services/creditService.ts
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type {
  CreateCreditData,
  Credit,
  CreditFilter,
  CreditReviewAction,
  CreditStatus,
  CreditSummary,
} from '../types/credit';
import { addExpense } from './expenseService';
import logger from '../utils/logger';

const COLLECTION_NAME = 'credits';

/**
 * Create a new credit request
 */
export const createCredit = async (
  data: CreateCreditData,
  createdBy: string,
  createdByName: string
): Promise<string> => {
  try {
    // Calculate terms
    const total_amount = data.principal_amount + data.additional_fee;
    const installment_amount = total_amount / data.installments;

    const creditData = {
      member_id: data.member_id,
      member_name: data.member_name,
      reason: data.reason,
      description: data.description || '',
      terms: {
        principal_amount: data.principal_amount,
        additional_fee: data.additional_fee,
        total_amount,
        installments: data.installments,
        installment_amount,
      },
      status: 'pending_review' as CreditStatus,
      created_by: createdBy,
      created_by_name: createdByName,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
      payments: [],
      total_paid: 0,
      remaining_balance: total_amount,
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), creditData);

    // Log audit trail
    // await logAuditTrail(
    //   createdBy,
    //   'CREDIT_CREATED',
    //   {
    //     credit_id: docRef.id,
    //     member_id: data.member_id,
    //     member_name: data.member_name,
    //     amount: total_amount,
    //     reason: data.reason,
    //   },
    //   createdByName
    // );

    return docRef.id;
  } catch (error) {
    logger.error('Error creating credit:', error);
    throw error;
  }
};

/**
 * Get a single credit by ID
 */
export const getCredit = async (creditId: string): Promise<Credit | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, creditId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Credit;
    }
    return null;
  } catch (error) {
    logger.error('Error getting credit:', error);
    throw error;
  }
};

/**
 * Get all credits with optional filters
 */
export const getCredits = async (filter?: CreditFilter): Promise<Credit[]> => {
  try {
    let q = query(collection(db, COLLECTION_NAME), orderBy('created_at', 'desc'));

    // Apply filters
    if (filter?.member_id) {
      q = query(q, where('member_id', '==', filter.member_id));
    }
    if (filter?.status) {
      q = query(q, where('status', '==', filter.status));
    }
    if (filter?.created_by) {
      q = query(q, where('created_by', '==', filter.created_by));
    }

    const snapshot = await getDocs(q);
    const credits = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Credit[];

    // Apply date filters (client-side since Firestore requires index for multiple where clauses)
    let filteredCredits = credits;
    if (filter?.startDate) {
      filteredCredits = filteredCredits.filter(
        (c) => c.created_at.toDate() >= filter.startDate!
      );
    }
    if (filter?.endDate) {
      filteredCredits = filteredCredits.filter(
        (c) => c.created_at.toDate() <= filter.endDate!
      );
    }

    return filteredCredits;
  } catch (error) {
    logger.error('Error getting credits:', error);
    throw error;
  }
};

/**
 * Get credits pending review (for chairperson)
 */
export const getPendingCredits = async (): Promise<Credit[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('status', 'in', ['pending_review', 'needs_info']),
      orderBy('created_at', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Credit[];
  } catch (error) {
    logger.error('Error getting pending credits:', error);
    throw error;
  }
};

/**
 * Get member's active credit (only one active credit allowed per member)
 */
export const getMemberActiveCredit = async (
  memberId: string
): Promise<Credit | null> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('member_id', '==', memberId),
      where('status', '==', 'active')
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      logger.debug(`No active credit found for member: ${memberId}`);
      return null;
    }

    const doc = snapshot.docs[0];
    const credit = { id: doc.id, ...doc.data() } as Credit;
    logger.debug(`Active credit found for member ${memberId}:`, credit);
    return credit;
  } catch (error) {
    logger.error('Error getting member active credit:', error);
    // Return null instead of throwing to prevent breaking the UI
    return null;
  }
};

/**
 * Review a credit (Chairperson action)
 */
export const reviewCredit = async (
  creditId: string,
  action: CreditReviewAction,
  notes: string,
  reviewedBy: string,
  reviewerName: string,
  additionalInfoRequested?: string
): Promise<void> => {
  try {
    const creditRef = doc(db, COLLECTION_NAME, creditId);
    const creditSnap = await getDoc(creditRef);

    if (!creditSnap.exists()) {
      throw new Error('Credit not found');
    }

    const credit = creditSnap.data() as Credit;

    // Validate current status
    if (credit.status !== 'pending_review' && credit.status !== 'needs_info') {
      throw new Error('Credit is not in a reviewable state');
    }

    let newStatus: CreditStatus;
    let expenseId: string | undefined;

    switch (action) {
      case 'approve':
        // Create expense entry
        expenseId = await addExpense(
          {
            title: `Credit to ${credit.member_name}`,
            description: credit.reason,
            amount: credit.terms.total_amount,
            type: 'one-off',
            category: 'others',
            status: 'paid',
            date: Timestamp.now(),
            payment_date: Timestamp.now(),
            payment_reference: `CREDIT-${creditId}`,
            created_by: reviewedBy,
          },
          reviewedBy
        );

        newStatus = 'active';
        break;

      case 'reject':
        newStatus = 'rejected';
        break;

      case 'request_info':
        newStatus = 'needs_info';
        break;

      default:
        throw new Error('Invalid review action');
    }

    const updateData: Partial<Credit> = {
      status: newStatus,
      review: {
        reviewed_by: reviewedBy,
        reviewer_name: reviewerName,
        action,
        notes,
        reviewed_at: Timestamp.now(),
        ...(additionalInfoRequested && { additional_info_requested: additionalInfoRequested }),
      },
      updated_at: Timestamp.now(),
    };

    if (expenseId) {
      updateData.expense_id = expenseId;
    }

    await updateDoc(creditRef, updateData);

    // Log audit trail
    // await logAuditTrail(
    //   reviewedBy,
    //   'CREDIT_REVIEWED',
    //   {
    //     credit_id: creditId,
    //     member_id: credit.member_id,
    //     member_name: credit.member_name,
    //     action,
    //     notes,
    //     amount: credit.terms.total_amount,
    //   },
    //   reviewerName
    // );
  } catch (error) {
    logger.error('Error reviewing credit:', error);
    throw error;
  }
};

/**
 * Provide additional information (Admin response to info request)
 */
export const provideAdditionalInfo = async (
  creditId: string,
  additionalInfo: string,
  userId: string
): Promise<void> => {
  try {
    const creditRef = doc(db, COLLECTION_NAME, creditId);
    const creditSnap = await getDoc(creditRef);

    if (!creditSnap.exists()) {
      throw new Error('Credit not found');
    }

    const credit = creditSnap.data() as Credit;

    if (credit.status !== 'needs_info') {
      throw new Error('Credit is not awaiting additional information');
    }

    await updateDoc(creditRef, {
      status: 'pending_review',
      additional_info_response: additionalInfo,
      additional_info_updated_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    });

    // Log audit trail
    // await logAuditTrail(
    //   userId,
    //   'CREDIT_INFO_PROVIDED',
    //   {
    //     credit_id: creditId,
    //     member_id: credit.member_id,
    //     member_name: credit.member_name,
    //   }
    // );
  } catch (error) {
    logger.error('Error providing additional info:', error);
    throw error;
  }
};

/**
 * Record a credit payment (linked to contribution)
 */
export const recordCreditPayment = async (
  creditId: string,
  contributionId: string,
  amount: number,
  userId: string
): Promise<void> => {
  try {
    const creditRef = doc(db, COLLECTION_NAME, creditId);
    const creditSnap = await getDoc(creditRef);

    if (!creditSnap.exists()) {
      throw new Error('Credit not found');
    }

    const credit = creditSnap.data() as Credit;

    if (credit.status !== 'active') {
      throw new Error('Credit is not active');
    }

    // Calculate new payment
    const paymentNumber = credit.payments.length + 1;
    const newPayment = {
      id: `PAY-${Date.now()}`,
      contribution_id: contributionId,
      amount,
      payment_number: paymentNumber,
      paid_at: Timestamp.now(),
      status: 'approved' as const,
      approved_at: Timestamp.now(),
    };

    const newTotalPaid = credit.total_paid + amount;
    const newRemainingBalance = credit.terms.total_amount - newTotalPaid;

    // Check if credit is now settled
    const isSettled = newRemainingBalance <= 0;

    const updateData: any = {
      payments: [...credit.payments, newPayment],
      total_paid: newTotalPaid,
      remaining_balance: Math.max(0, newRemainingBalance),
      updated_at: Timestamp.now(),
    };

    if (isSettled) {
      updateData.status = 'settled';
      updateData.settled_at = Timestamp.now();
    }

    await updateDoc(creditRef, updateData);

    // Log audit trail
    // await logAuditTrail(
    //   userId,
    //   'CREDIT_PAYMENT_RECORDED',
    //   {
    //     credit_id: creditId,
    //     member_id: credit.member_id,
    //     member_name: credit.member_name,
    //     payment_number: paymentNumber,
    //     amount,
    //     contribution_id: contributionId,
    //     settled: isSettled,
    //   }
    // );
  } catch (error) {
    logger.error('Error recording credit payment:', error);
    throw error;
  }
};

/**
 * Get credit summary statistics
 */
export const getCreditSummary = async (): Promise<CreditSummary> => {
  try {
    const snapshot = await getDocs(collection(db, COLLECTION_NAME));
    const credits = snapshot.docs.map((doc) => doc.data()) as Credit[];

    const summary: CreditSummary = {
      totalCredits: credits.length,
      totalAmount: credits.reduce((sum, c) => sum + c.terms.total_amount, 0),
      activeCredits: credits.filter((c) => c.status === 'active').length,
      activeAmount: credits
        .filter((c) => c.status === 'active')
        .reduce((sum, c) => sum + c.remaining_balance, 0),
      settledCredits: credits.filter((c) => c.status === 'settled').length,
      settledAmount: credits
        .filter((c) => c.status === 'settled')
        .reduce((sum, c) => sum + c.terms.total_amount, 0),
      pendingReview: credits.filter((c) => c.status === 'pending_review').length,
      defaultedCredits: credits.filter((c) => c.status === 'defaulted').length,
    };

    return summary;
  } catch (error) {
    logger.error('Error getting credit summary:', error);
    throw error;
  }
};

/**
 * Delete a credit (only if no payments made)
 */
export const deleteCredit = async (creditId: string, userId: string): Promise<void> => {
  try {
    const creditRef = doc(db, COLLECTION_NAME, creditId);
    const creditSnap = await getDoc(creditRef);

    if (!creditSnap.exists()) {
      throw new Error('Credit not found');
    }

    const credit = creditSnap.data() as Credit;

    // Cannot delete if payments have been made
    if (credit.payments.length > 0) {
      throw new Error('Cannot delete credit with existing payments');
    }

    await deleteDoc(creditRef);

    // Log audit trail
    // await logAuditTrail(
    //   userId,
    //   'CREDIT_DELETED',
    //   {
    //     credit_id: creditId,
    //     member_id: credit.member_id,
    //     member_name: credit.member_name,
    //     amount: credit.terms.total_amount,
    //   }
    // );
  } catch (error) {
    logger.error('Error deleting credit:', error);
    throw error;
  }
};
