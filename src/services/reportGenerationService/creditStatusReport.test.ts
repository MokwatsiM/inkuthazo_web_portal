import { describe, it, expect } from 'vitest';
import { collectCreditStatusData } from './creditStatusReport';
import type { Credit, CreditStatus } from '../../types/credit';
import type { Member } from '../../types';

// Minimal Timestamp stand-in: the collector only calls .toDate()
const ts = (iso: string) => ({ toDate: () => new Date(iso) });

const credit = (
  id: string,
  memberId: string,
  status: CreditStatus,
  over: Partial<Credit> = {}
): Credit =>
  ({
    id,
    member_id: memberId,
    member_name: `Name ${memberId}`,
    reason: 'Emergency',
    terms: {
      principal_amount: 1000,
      additional_fee: 0,
      total_amount: 1000,
      installments: 4,
      installment_amount: 250,
    },
    status,
    created_by: 'admin',
    created_by_name: 'Admin',
    created_at: ts('2026-01-10'),
    updated_at: ts('2026-01-10'),
    payments: [],
    total_paid: 0,
    remaining_balance: 1000,
    ...over,
  }) as unknown as Credit;

const members = [
  { id: 'm1', full_name: 'Thandi Nkosi', email: 't@x.co', phone: '0821111111' },
  { id: 'm2', full_name: 'Sipho Dlamini', email: 's@x.co', phone: '0822222222' },
] as unknown as Member[];

const credits: Credit[] = [
  credit('c1', 'm1', 'active', {
    total_paid: 250,
    remaining_balance: 750,
    payments: [
      { id: 'p1', contribution_id: 'x', amount: 250, payment_number: 1, paid_at: ts('2026-02-01'), status: 'approved' },
    ],
  } as Partial<Credit>),
  credit('c2', 'm1', 'defaulted', { total_paid: 0, remaining_balance: 1000 }),
  credit('c3', 'm2', 'settled', {
    total_paid: 1000,
    remaining_balance: 0,
    settled_at: ts('2026-05-01'),
    override: {
      overridden_by: 'admin',
      overridden_by_name: 'Admin',
      reason: 'Funeral',
      overridden_at: ts('2026-01-10'),
      previous_active_credit_id: 'c1',
    },
  } as Partial<Credit>),
  // Not disbursed — must never appear
  credit('c4', 'm2', 'pending_review'),
  credit('c5', 'm2', 'rejected'),
];

describe('collectCreditStatusData', () => {
  it('excludes credits that were never disbursed', () => {
    const data = collectCreditStatusData(credits, members, 'all');
    expect(data.credits.map((c) => c.creditId).sort()).toEqual(['c1', 'c2', 'c3']);
  });

  it('outstanding filter returns active and defaulted credits only', () => {
    const data = collectCreditStatusData(credits, members, 'outstanding');
    expect(data.credits.map((c) => c.creditId)).toEqual(['c2', 'c1']); // biggest balance first
    expect(data.credits.every((c) => c.status !== 'settled')).toBe(true);
  });

  it('settled filter returns settled credits only', () => {
    const data = collectCreditStatusData(credits, members, 'settled');
    expect(data.credits.map((c) => c.creditId)).toEqual(['c3']);
  });

  it('computes summary totals regardless of filter', () => {
    const data = collectCreditStatusData(credits, members, 'settled');
    expect(data.outstandingCount).toBe(2);
    expect(data.outstandingBalance).toBe(1750);
    expect(data.defaultedCount).toBe(1);
    expect(data.membersWithOutstanding).toBe(1); // both outstanding credits belong to m1
    expect(data.settledCount).toBe(1);
    expect(data.settledAmount).toBe(1000);
  });

  it('enriches lines with member contact details, payments and override flag', () => {
    const data = collectCreditStatusData(credits, members, 'all');
    const c1 = data.credits.find((c) => c.creditId === 'c1')!;
    expect(c1.memberName).toBe('Thandi Nkosi');
    expect(c1.phoneNumber).toBe('0821111111');
    expect(c1.installmentsPaid).toBe(1);
    expect(c1.lastPaymentDate?.toISOString().slice(0, 10)).toBe('2026-02-01');

    const c3 = data.credits.find((c) => c.creditId === 'c3')!;
    expect(c3.overridden).toBe(true);
    expect(c3.remainingBalance).toBe(0);
  });

  it('lists outstanding credits before settled ones', () => {
    const data = collectCreditStatusData(credits, members, 'all');
    expect(data.credits.map((c) => c.status)).toEqual(['defaulted', 'active', 'settled']);
  });
});
