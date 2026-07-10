import { describe, it, expect } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { hasDuplicateContribution } from './contributionValidation';
import type { Contribution } from '../types/contribution';

const makeContribution = (
  type: Contribution['type'],
  date: Date
): Contribution => ({
  id: 'existing',
  member_id: 'member-1',
  amount: 100,
  date: Timestamp.fromDate(date),
  type,
  status: 'approved',
});

describe('hasDuplicateContribution', () => {
  it('flags a second monthly contribution in the same month', () => {
    const existing = [makeContribution('monthly', new Date('2026-07-01'))];
    const result = hasDuplicateContribution(existing, {
      type: 'monthly',
      date: Timestamp.fromDate(new Date('2026-07-25')),
    });
    expect(result).toBe(true);
  });

  it('allows a monthly contribution in a different month', () => {
    const existing = [makeContribution('monthly', new Date('2026-06-15'))];
    const result = hasDuplicateContribution(existing, {
      type: 'monthly',
      date: Timestamp.fromDate(new Date('2026-07-15')),
    });
    expect(result).toBe(false);
  });

  it('allows different contribution types in the same month', () => {
    const existing = [makeContribution('registration', new Date('2026-07-01'))];
    const result = hasDuplicateContribution(existing, {
      type: 'monthly',
      date: Timestamp.fromDate(new Date('2026-07-10')),
    });
    expect(result).toBe(false);
  });

  it("never flags 'other' contributions as duplicates", () => {
    const existing = [makeContribution('other', new Date('2026-07-01'))];
    const result = hasDuplicateContribution(existing, {
      type: 'other',
      date: Timestamp.fromDate(new Date('2026-07-01')),
    });
    expect(result).toBe(false);
  });

  it('allows the first contribution when history is empty', () => {
    const result = hasDuplicateContribution([], {
      type: 'monthly',
      date: Timestamp.fromDate(new Date('2026-07-10')),
    });
    expect(result).toBe(false);
  });
});
