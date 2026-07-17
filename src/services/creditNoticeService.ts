import { getFunctions, httpsCallable } from 'firebase/functions';
import { getCredits } from './creditService';
import { formatDate } from '../utils/dateUtils';
import type { Credit } from '../types/credit';

/**
 * Admin feature: find members with unsettled credit and send them
 * statement emails via the `sendCreditNotices` Cloud Function
 * (mirrors the arrears-notice flow).
 */

export interface OutstandingCreditGroup {
  memberId: string;
  memberName: string;
  totalOutstanding: number;
  credits: Credit[];
}

export interface SendCreditNoticesResult {
  sent: number;
  failed: { memberId: string; reason: string }[];
}

/** A credit still owes money when disbursed and not fully repaid. */
const isOutstanding = (credit: Credit): boolean =>
  (credit.status === 'active' || credit.status === 'defaulted') &&
  (credit.remaining_balance ?? 0) > 0;

/** All unsettled credits, grouped per member with their total owed. */
export const loadOutstandingCredits = async (): Promise<
  OutstandingCreditGroup[]
> => {
  const credits = await getCredits();
  const groups = new Map<string, OutstandingCreditGroup>();

  for (const credit of credits.filter(isOutstanding)) {
    const existing = groups.get(credit.member_id);
    if (existing) {
      existing.credits.push(credit);
      existing.totalOutstanding += credit.remaining_balance ?? 0;
    } else {
      groups.set(credit.member_id, {
        memberId: credit.member_id,
        memberName: credit.member_name,
        totalOutstanding: credit.remaining_balance ?? 0,
        credits: [credit],
      });
    }
  }

  return Array.from(groups.values()).sort(
    (a, b) => b.totalOutstanding - a.totalOutstanding
  );
};

/**
 * Send statement emails to the selected members. Recipient email addresses
 * are resolved server-side from the member documents.
 */
export const sendCreditNotices = async (
  groups: OutstandingCreditGroup[]
): Promise<SendCreditNoticesResult> => {
  const callable = httpsCallable<
    { notices: unknown[] },
    SendCreditNoticesResult
  >(getFunctions(), 'sendCreditNotices');

  const { data } = await callable({
    notices: groups.map((group) => ({
      memberId: group.memberId,
      totalOutstanding: group.totalOutstanding,
      credits: group.credits.map((credit) => ({
        reason: credit.reason,
        issuedDate: formatDate(credit.created_at),
        totalAmount: credit.terms?.total_amount ?? 0,
        totalPaid: credit.total_paid ?? 0,
        remainingBalance: credit.remaining_balance ?? 0,
      })),
    })),
  });

  return data;
};
