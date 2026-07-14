import { describe, it, expect } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import {
  filterByPeriod,
  getStatementYears,
  computeStatementSummary,
  isStatementCredit,
  periodLabel,
  periodFileSuffix,
} from './statementHelpers';
import type { Contribution } from '../../types/contribution';
import type { Payout } from '../../types/payout';
import type { Credit } from '../../types/credit';

const ts = (iso: string) => Timestamp.fromDate(new Date(iso));

describe('filterByPeriod', () => {
  const items = [
    { date: ts('2025-01-01T00:00:00') },
    { date: ts('2025-12-31T23:59:59') },
    { date: ts('2026-01-01T00:00:00') },
    { date: undefined },
  ];

  it('keeps only items inside the selected year (inclusive boundaries)', () => {
    const result = filterByPeriod(items, (i) => i.date, { year: 2025 });
    expect(result).toHaveLength(2);
  });

  it("passes everything through for 'all'", () => {
    expect(filterByPeriod(items, (i) => i.date, 'all')).toHaveLength(4);
  });

  it('excludes items with missing dates for a year period', () => {
    const result = filterByPeriod(items, (i) => i.date, { year: 2026 });
    expect(result).toHaveLength(1);
  });

  it('accepts plain Date values too', () => {
    const dated = [{ when: new Date(2024, 5, 15) }];
    expect(filterByPeriod(dated, (i) => i.when, { year: 2024 })).toHaveLength(1);
    expect(filterByPeriod(dated, (i) => i.when, { year: 2025 })).toHaveLength(0);
  });
});

describe('getStatementYears', () => {
  const now = new Date(2026, 6, 15);

  it('spans from the current year down to the join year', () => {
    expect(getStatementYears(ts('2022-03-10'), now)).toEqual([
      2026, 2025, 2024, 2023, 2022,
    ]);
  });

  it('returns just the current year for a member who joined this year', () => {
    expect(getStatementYears(ts('2026-02-01'), now)).toEqual([2026]);
  });

  it('clamps missing or future join dates to the current year', () => {
    expect(getStatementYears(undefined, now)).toEqual([2026]);
    expect(getStatementYears(ts('2030-01-01'), now)).toEqual([2026]);
  });
});

const contribution = (
  status: Contribution['status'],
  amount: number
): Contribution =>
  ({
    id: 'c',
    member_id: 'm',
    amount,
    date: ts('2026-01-15'),
    type: 'monthly',
    status,
  } as Contribution);

const payout = (amount: number): Payout =>
  ({
    id: 'p',
    member_id: 'm',
    amount,
    date: ts('2026-02-01'),
    reason: 'claim',
    status: 'completed',
  } as unknown as Payout);

const credit = (
  status: Credit['status'],
  total: number,
  paid: number,
  balance: number
): Credit =>
  ({
    id: 'cr',
    member_id: 'm',
    member_name: 'M',
    reason: 'emergency',
    terms: { total_amount: total },
    status,
    total_paid: paid,
    remaining_balance: balance,
    created_at: ts('2026-01-05'),
  } as unknown as Credit);

describe('isStatementCredit', () => {
  it('includes only disbursed credits', () => {
    expect(isStatementCredit(credit('active', 100, 0, 100))).toBe(true);
    expect(isStatementCredit(credit('settled', 100, 100, 0))).toBe(true);
    expect(isStatementCredit(credit('defaulted', 100, 20, 80))).toBe(true);
    expect(isStatementCredit(credit('pending_review', 100, 0, 100))).toBe(false);
    expect(isStatementCredit(credit('rejected', 100, 0, 100))).toBe(false);
  });
});

describe('computeStatementSummary', () => {
  it('totals contributions by status and computes net balance', () => {
    const summary = computeStatementSummary(
      [
        contribution('approved', 250),
        contribution('approved', 250),
        contribution('pending', 100),
        contribution('rejected', 50),
      ],
      [payout(300)],
      []
    );
    expect(summary.totalApproved).toBe(500);
    expect(summary.totalPending).toBe(100);
    expect(summary.totalRejected).toBe(50);
    expect(summary.totalPayouts).toBe(300);
    expect(summary.netBalance).toBe(200);
  });

  it('aggregates disbursed credits only', () => {
    const summary = computeStatementSummary(
      [],
      [],
      [
        credit('active', 1000, 400, 600),
        credit('settled', 500, 500, 0),
        credit('pending_review', 999, 0, 999), // excluded
      ]
    );
    expect(summary.totalCredited).toBe(1500);
    expect(summary.totalCreditRepaid).toBe(900);
    expect(summary.outstandingCreditBalance).toBe(600);
  });

  it('returns zeros for empty inputs', () => {
    const summary = computeStatementSummary([], [], []);
    expect(summary.totalApproved).toBe(0);
    expect(summary.netBalance).toBe(0);
    expect(summary.outstandingCreditBalance).toBe(0);
  });
});

describe('period labels', () => {
  it('labels periods and file suffixes', () => {
    expect(periodLabel('all')).toBe('Full history');
    expect(periodLabel({ year: 2025 })).toContain('2025');
    expect(periodFileSuffix('all')).toBe('full-history');
    expect(periodFileSuffix({ year: 2025 })).toBe('2025');
  });
});
