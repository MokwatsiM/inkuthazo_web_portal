import { describe, it, expect } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { formatDate, toFirestoreTimestamp, isValidDate } from './dateUtils';

describe('formatDate', () => {
  it('formats a Date', () => {
    expect(formatDate(new Date(2026, 6, 10))).toBe('10 Jul 2026');
  });

  it('formats a Firestore Timestamp', () => {
    expect(formatDate(Timestamp.fromDate(new Date(2026, 0, 5)))).toBe(
      '05 Jan 2026'
    );
  });

  it('formats an ISO string', () => {
    expect(formatDate('2026-03-15T12:00:00')).toBe('15 Mar 2026');
  });

  it('returns an empty string for undefined', () => {
    expect(formatDate(undefined)).toBe('');
  });

  it('returns an empty string for an unparseable string', () => {
    expect(formatDate('not-a-date')).toBe('');
  });
});

describe('toFirestoreTimestamp', () => {
  it('passes through an existing Timestamp', () => {
    const ts = Timestamp.fromDate(new Date(2026, 3, 1));
    expect(toFirestoreTimestamp(ts)).toBe(ts);
  });

  it('converts a Date', () => {
    const date = new Date(2026, 3, 1, 12, 30);
    expect(toFirestoreTimestamp(date).toDate().getTime()).toBe(date.getTime());
  });

  it('converts a date string', () => {
    const result = toFirestoreTimestamp('2026-04-01T00:00:00');
    expect(result.toDate().getFullYear()).toBe(2026);
    expect(result.toDate().getMonth()).toBe(3);
  });

  it('falls back to now for undefined', () => {
    const before = Date.now();
    const result = toFirestoreTimestamp(undefined).toMillis();
    expect(result).toBeGreaterThanOrEqual(before - 1000);
    expect(result).toBeLessThanOrEqual(Date.now() + 1000);
  });
});

describe('isValidDate', () => {
  it('accepts Timestamps, Dates, and parseable strings', () => {
    expect(isValidDate(Timestamp.now())).toBe(true);
    expect(isValidDate(new Date())).toBe(true);
    expect(isValidDate('2026-07-10')).toBe(true);
  });

  it('rejects invalid inputs', () => {
    expect(isValidDate(undefined)).toBe(false);
    expect(isValidDate(null)).toBe(false);
    expect(isValidDate('garbage')).toBe(false);
    expect(isValidDate(new Date('garbage'))).toBe(false);
    expect(isValidDate(12345)).toBe(false);
  });
});
