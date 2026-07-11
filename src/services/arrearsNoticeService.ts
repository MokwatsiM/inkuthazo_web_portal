import { collection, getDocs } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../config/firebase';
import { converter } from '../utils/firestoreConverter';
import { collectArrearsData } from './reportGenerationService';
import type { ArrearsReportData, MemberArrears } from './reportGenerationService';
import type { Member } from '../types';
import type { Contribution } from '../types/contribution';

/**
 * Admin feature: compute which members are in arrears (same logic as the
 * arrears report) and send them statement emails via the
 * `sendArrearsNotices` Cloud Function.
 */

export interface SendArrearsNoticesResult {
  sent: number;
  failed: { memberId: string; reason: string }[];
}

/** Full arrears computation across all members (explicit admin action). */
export const loadArrearsData = async (): Promise<ArrearsReportData> => {
  const [membersSnapshot, contributionsSnapshot] = await Promise.all([
    getDocs(collection(db, 'members').withConverter(converter<Member>())),
    getDocs(collection(db, 'contributions').withConverter(converter<Contribution>())),
  ]);

  return collectArrearsData(
    membersSnapshot.docs.map((doc) => doc.data()),
    contributionsSnapshot.docs.map((doc) => doc.data())
  );
};

/**
 * Send statement emails to the selected members. Recipient email addresses
 * are resolved server-side from the member documents.
 */
export const sendArrearsNotices = async (
  members: MemberArrears[]
): Promise<SendArrearsNoticesResult> => {
  const callable = httpsCallable<
    { notices: unknown[] },
    SendArrearsNoticesResult
  >(getFunctions(), 'sendArrearsNotices');

  const { data } = await callable({
    notices: members.map((member) => ({
      memberId: member.memberId,
      monthsOwed: member.monthsOwed,
      totalAmountOwed: member.totalAmountOwed,
      unpaidMonths: member.unpaidMonths,
    })),
  });

  return data;
};
