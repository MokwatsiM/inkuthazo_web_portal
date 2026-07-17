import { describe, it, expect } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import {
  normalizeText,
  parseAmount,
  parseFlexibleDate,
  scoreMemberMatch,
  matchTransaction,
  parseBankStatementRows,
  toAggregatedContributions,
  AUTO_MATCH_THRESHOLD,
  BankTransaction,
} from './bankStatement';
import type { Member } from '../../types';

const member = (
  id: string,
  full_name: string,
  phone = '',
  email = ''
): Member =>
  ({
    id,
    full_name,
    phone,
    email,
    join_date: Timestamp.now(),
    status: 'approved',
    role: 'member',
  } as Member);

const txn = (description: string, amount = 250): BankTransaction => ({
  rowNumber: 1,
  date: new Date(2026, 5, 15),
  description,
  amount,
});

describe('normalizeText', () => {
  it('uppercases and strips punctuation', () => {
    expect(normalizeText('  Thabo-Mokoena / FNB *TRF ')).toBe(
      'THABO MOKOENA FNB TRF'
    );
  });
});

describe('parseAmount', () => {
  it('parses plain numbers and currency strings', () => {
    expect(parseAmount(250)).toBe(250);
    expect(parseAmount('250.00')).toBe(250);
    expect(parseAmount('R 1,250.00')).toBe(1250);
    expect(parseAmount('1 250,00')).toBe(1250);
    expect(parseAmount('1.250,00')).toBe(1250);
  });

  it('handles negatives (minus sign and parentheses)', () => {
    expect(parseAmount('-250.00')).toBe(-250);
    expect(parseAmount('(250.00)')).toBe(-250);
  });

  it('returns null for garbage', () => {
    expect(parseAmount('abc')).toBeNull();
    expect(parseAmount('')).toBeNull();
    expect(parseAmount(undefined)).toBeNull();
  });
});

describe('parseFlexibleDate', () => {
  it('parses common bank formats', () => {
    expect(parseFlexibleDate('2026-06-15')?.getMonth()).toBe(5);
    expect(parseFlexibleDate('15/06/2026')?.getDate()).toBe(15);
    expect(parseFlexibleDate('15 Jun 2026')?.getFullYear()).toBe(2026);
  });

  it('parses Excel serial dates', () => {
    // 45000 ≈ 2023-03-15
    const date = parseFlexibleDate(45000);
    expect(date?.getFullYear()).toBe(2023);
  });

  it('returns null for unparseable values', () => {
    expect(parseFlexibleDate('not a date')).toBeNull();
    expect(parseFlexibleDate('')).toBeNull();
  });
});

describe('scoreMemberMatch', () => {
  const thabo = member('m1', 'Thabo Mokoena', '082 123 4567', 'thabo.m@example.com');

  it('matches a full name in the description', () => {
    const result = scoreMemberMatch('FNB TRF THABO MOKOENA MONTHLY', thabo);
    expect(result?.score).toBe(1.0);
  });

  it('matches name parts in any order', () => {
    const result = scoreMemberMatch('MOKOENA THABO ABSA', thabo);
    expect(result?.score).toBeGreaterThanOrEqual(0.9);
  });

  it('matches by phone digits', () => {
    const result = scoreMemberMatch('CAPITEC 0821234567 PAYMENT', thabo);
    expect(result?.score).toBe(0.95);
    expect(result?.matchedOn).toBe('phone number');
  });

  it('matches surname plus first initial', () => {
    const result = scoreMemberMatch('EFT T MOKOENA', thabo);
    expect(result?.score).toBeGreaterThanOrEqual(0.75);
  });

  it('gives a weak, below-auto-threshold score for a single name token', () => {
    const result = scoreMemberMatch('TRANSFER MOKOENA', thabo);
    expect(result?.score).toBe(0.5);
    expect(result!.score).toBeLessThan(AUTO_MATCH_THRESHOLD);
  });

  it('returns null when nothing matches', () => {
    expect(scoreMemberMatch('WOOLWORTHS GROCERIES', thabo)).toBeNull();
  });
});

describe('matchTransaction', () => {
  const members = [
    member('m1', 'Thabo Mokoena', '0821234567'),
    member('m2', 'Sipho Mokoena', '0837654321'),
    member('m3', 'Lerato Dlamini'),
  ];

  it('auto-matches an unambiguous winner', () => {
    const result = matchTransaction(txn('THABO MOKOENA MONTHLY'), members);
    expect(result.autoMatch?.memberId).toBe('m1');
    expect(result.autoMatch!.score).toBeGreaterThanOrEqual(AUTO_MATCH_THRESHOLD);
  });

  it('does not auto-match when two members tie', () => {
    // Surname shared by m1 and m2 — ambiguous
    const result = matchTransaction(txn('EFT MOKOENA'), members);
    expect(result.autoMatch).toBeNull();
    expect(result.candidates.length).toBeGreaterThanOrEqual(2);
  });

  it('offers no candidates for unrelated descriptions', () => {
    const result = matchTransaction(txn('SALARY ACME CORP'), members);
    expect(result.autoMatch).toBeNull();
    expect(result.candidates).toHaveLength(0);
  });
});

describe('parseBankStatementRows', () => {
  const mapping = { date: 'Date', description: 'Description', amount: 'Amount' };

  it('parses credits and skips debits', () => {
    const result = parseBankStatementRows(
      [
        { Date: '2026-06-01', Description: 'THABO MOKOENA', Amount: '250.00' },
        { Date: '2026-06-02', Description: 'BANK FEES', Amount: '-55.00' },
        { Date: '2026-06-03', Description: 'S MOKOENA', Amount: 'R 1,000.00' },
      ],
      mapping
    );
    expect(result.transactions).toHaveLength(2);
    expect(result.skippedNonCredits).toBe(1);
    expect(result.errors).toHaveLength(0);
    expect(result.transactions[1].amount).toBe(1000);
  });

  it('reports unreadable rows as errors', () => {
    const result = parseBankStatementRows(
      [
        { Date: '??', Description: 'X', Amount: '100' },
        { Date: '2026-06-01', Description: 'Y', Amount: 'oops' },
        { Date: '2026-06-01', Description: '', Amount: '100' },
      ],
      mapping
    );
    expect(result.transactions).toHaveLength(0);
    expect(result.errors).toHaveLength(3);
  });
});

describe('toAggregatedContributions', () => {
  it('groups by member and month, summing amounts', () => {
    const assignments = [
      { transaction: txn('A', 250), memberId: 'm1', memberName: 'Thabo' },
      { transaction: txn('B', 100), memberId: 'm1', memberName: 'Thabo' },
      { transaction: txn('C', 250), memberId: 'm2', memberName: 'Sipho' },
    ];
    const result = toAggregatedContributions(assignments);
    expect(result).toHaveLength(2);
    const thabo = result.find((r) => r.memberId === 'm1');
    expect(thabo?.amount).toBe(350);
    expect(thabo?.monthYear).toBe('2026-06');
    expect(thabo?.type).toBe('monthly');
    expect(thabo?.originalReferences).toEqual(['A', 'B']);
  });
});
