import { Timestamp } from 'firebase/firestore';
import type { Contribution } from '../../types/contribution';
import type { Payout } from '../../types/payout';
import type { Credit } from '../../types/credit';

/**
 * Pure helpers for member statement generation — period filtering, year
 * options, and financial summary maths. No PDF or Firestore code, so
 * everything here is unit-testable.
 */

export type StatementPeriod = 'all' | { year: number };

const toDate = (value: Timestamp | Date | undefined): Date | undefined => {
  if (!value) return undefined;
  return value instanceof Date ? value : value.toDate();
};

/**
 * Filter items to the selected period. For a year period, items with a
 * missing date are excluded; for 'all' everything passes.
 */
export const filterByPeriod = <T>(
  items: T[],
  getDate: (item: T) => Timestamp | Date | undefined,
  period: StatementPeriod
): T[] => {
  if (period === 'all') return items;
  return items.filter((item) => {
    const date = toDate(getDate(item));
    return date !== undefined && date.getFullYear() === period.year;
  });
};

/**
 * Years available for the statement dropdown: current year down to the
 * member's join year. Clamps to just the current year when the join date
 * is missing or in the future.
 */
export const getStatementYears = (
  joinDate: Timestamp | undefined,
  now: Date = new Date()
): number[] => {
  const currentYear = now.getFullYear();
  const joined = toDate(joinDate);
  const joinYear =
    joined && joined.getFullYear() <= currentYear
      ? joined.getFullYear()
      : currentYear;

  const years: number[] = [];
  for (let year = currentYear; year >= joinYear; year--) {
    years.push(year);
  }
  return years;
};

/**
 * Credits shown on a statement: only those where money was actually
 * disbursed. Review-stage credits are not financial events.
 */
export const isStatementCredit = (credit: Credit): boolean =>
  credit.status === 'active' ||
  credit.status === 'settled' ||
  credit.status === 'defaulted';

export interface StatementSummary {
  totalApproved: number;
  totalPending: number;
  totalRejected: number;
  totalPayouts: number;
  /** approved contributions minus payouts */
  netBalance: number;
  /** sum of terms.total_amount of disbursed credits in the period */
  totalCredited: number;
  totalCreditRepaid: number;
  /** current outstanding balance across those credits (not period-scoped) */
  outstandingCreditBalance: number;
}

/** All inputs are expected to be period-filtered already. */
export const computeStatementSummary = (
  contributions: Contribution[],
  payouts: Payout[],
  credits: Credit[]
): StatementSummary => {
  const sumBy = <T>(items: T[], getAmount: (item: T) => number): number =>
    items.reduce((total, item) => total + (getAmount(item) || 0), 0);

  const byStatus = (status: Contribution['status']) =>
    sumBy(
      contributions.filter((c) => c.status === status),
      (c) => c.amount
    );

  const totalApproved = byStatus('approved');
  const totalPayouts = sumBy(payouts, (p) => p.amount);
  const statementCredits = credits.filter(isStatementCredit);

  return {
    totalApproved,
    totalPending: byStatus('pending'),
    totalRejected: byStatus('rejected'),
    totalPayouts,
    netBalance: totalApproved - totalPayouts,
    totalCredited: sumBy(statementCredits, (c) => c.terms?.total_amount ?? 0),
    totalCreditRepaid: sumBy(statementCredits, (c) => c.total_paid ?? 0),
    outstandingCreditBalance: sumBy(
      statementCredits,
      (c) => c.remaining_balance ?? 0
    ),
  };
};

export const periodLabel = (period: StatementPeriod): string =>
  period === 'all'
    ? 'Full history'
    : `January – December ${period.year}`;

export const periodFileSuffix = (period: StatementPeriod): string =>
  period === 'all' ? 'full-history' : String(period.year);
