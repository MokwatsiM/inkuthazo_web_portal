import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { converter } from '../utils/firestoreConverter';
import { getCredits } from './creditService';
import type { StatementData } from '../utils/reportGenerator/memberStatement';
import type { Member } from '../types';
import type { Contribution } from '../types/contribution';
import type { Payout } from '../types/payout';

/**
 * Assemble everything a member statement needs. Callers pass whatever they
 * already have loaded (e.g. MemberDetail has contributions + payouts); the
 * rest is fetched with owner-scoped queries that members are allowed to
 * run under the security rules.
 */
export const loadStatementData = async (
  member: Member,
  preloaded: { contributions?: Contribution[]; payouts?: Payout[] } = {}
): Promise<StatementData> => {
  const [contributions, payouts, credits] = await Promise.all([
    preloaded.contributions ?? fetchOwnContributions(member.id),
    preloaded.payouts ?? fetchOwnPayouts(member.id),
    getCredits({ member_id: member.id }),
  ]);

  return { member, contributions, payouts, credits };
};

const fetchOwnContributions = async (
  memberId: string
): Promise<Contribution[]> => {
  const snapshot = await getDocs(
    query(
      collection(db, 'contributions').withConverter(converter<Contribution>()),
      where('member_id', '==', memberId),
      orderBy('date', 'desc')
    )
  );
  return snapshot.docs.map((doc) => doc.data());
};

const fetchOwnPayouts = async (memberId: string): Promise<Payout[]> => {
  // No orderBy: avoids needing the composite index; sorted client-side
  const snapshot = await getDocs(
    query(
      collection(db, 'payouts').withConverter(converter<Payout>()),
      where('member_id', '==', memberId)
    )
  );
  return snapshot.docs
    .map((doc) => doc.data())
    .sort((a, b) => b.date.toMillis() - a.date.toMillis());
};
