import { format, parse, isValid } from 'date-fns';
import type { Member } from '../../types';
import type { AggregatedContribution } from './bulkImport';

/**
 * Bank-statement import: parse transaction rows and match free-text
 * descriptions (e.g. "FNB TRF THABO MOKOENA 0821234567") to members using
 * heuristics. Everything in this module is pure — no Firestore, no file
 * IO — so the matcher is unit-testable.
 */

export interface BankTransaction {
  rowNumber: number;
  date: Date;
  description: string;
  amount: number;
}

export interface MatchCandidate {
  memberId: string;
  memberName: string;
  /** 0..1 — see scoring in scoreMemberMatch */
  score: number;
  matchedOn: string;
}

export interface MatchedTransaction {
  transaction: BankTransaction;
  /** Auto-selected when the best candidate clears AUTO_MATCH_THRESHOLD */
  autoMatch: MatchCandidate | null;
  candidates: MatchCandidate[];
}

export interface BankParseResult {
  transactions: BankTransaction[];
  errors: { row: number; message: string }[];
  /** Debits / zero-amount rows silently excluded (statements list both) */
  skippedNonCredits: number;
}

export const AUTO_MATCH_THRESHOLD = 0.75;
const SUGGESTION_THRESHOLD = 0.4;
const MAX_CANDIDATES = 3;

// ---------- normalization ----------

export const normalizeText = (value: string): string =>
  value
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const digitsOnly = (value: string): string => value.replace(/\D/g, '');

/**
 * Parse bank amounts: "R 1,250.00", "1 250,00", "(250.00)" (negative),
 * plain numbers. Returns null when unparseable.
 */
export const parseAmount = (value: unknown): number | null => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value !== 'string' || value.trim() === '') return null;

  let text = value.trim().replace(/^R\s*/i, '');
  let negative = false;
  if (/^\(.*\)$/.test(text)) {
    negative = true;
    text = text.slice(1, -1);
  }
  if (text.startsWith('-')) {
    negative = true;
    text = text.slice(1);
  }
  text = text.replace(/\s/g, '');

  if (text.includes(',') && text.includes('.')) {
    // Last separator is the decimal one
    if (text.lastIndexOf(',') > text.lastIndexOf('.')) {
      text = text.replace(/\./g, '').replace(',', '.');
    } else {
      text = text.replace(/,/g, '');
    }
  } else if (text.includes(',')) {
    // ",dd" at the end is a decimal comma; otherwise thousands
    text = /,\d{2}$/.test(text)
      ? text.replace(',', '.')
      : text.replace(/,/g, '');
  }

  const parsed = Number(text);
  if (!Number.isFinite(parsed)) return null;
  return negative ? -parsed : parsed;
};

const DATE_FORMATS = [
  'yyyy-MM-dd',
  'dd/MM/yyyy',
  'MM/dd/yyyy',
  'yyyy/MM/dd',
  'dd-MM-yyyy',
  'dd MMM yyyy',
];

/** Excel serial day 1 is 1900-01-01; 25569 is the 1970 epoch offset. */
const EXCEL_EPOCH_OFFSET = 25569;
const DAY_MS = 86400 * 1000;

export const parseFlexibleDate = (value: unknown): Date | null => {
  if (value instanceof Date) return isValid(value) ? value : null;

  if (typeof value === 'number') {
    // Excel serial date (any plausible modern date)
    if (value > 20000 && value < 60000) {
      return new Date(Math.round((value - EXCEL_EPOCH_OFFSET) * DAY_MS));
    }
    return null;
  }

  const text = String(value ?? '').trim();
  if (!text) return null;

  for (const fmt of DATE_FORMATS) {
    const parsed = parse(text, fmt, new Date());
    if (isValid(parsed)) return parsed;
  }
  if (!isNaN(Date.parse(text))) {
    return new Date(text);
  }
  return null;
};

// ---------- matching ----------

const containsWord = (haystackPadded: string, word: string): boolean =>
  haystackPadded.includes(` ${word} `);

/**
 * Score how well a bank-statement description matches a member.
 * 1.0 full name · 0.95 phone digits · 0.9 all name parts ·
 * 0.8 email local part · 0.75 surname + first initial · 0.5 single long
 * name token. Returns null when nothing matches.
 */
export const scoreMemberMatch = (
  description: string,
  member: Member
): { score: number; matchedOn: string } | null => {
  const normDesc = ` ${normalizeText(description)} `;
  const name = normalizeText(member.full_name || '');
  if (!name) return null;
  const tokens = name.split(' ').filter((token) => token.length >= 2);

  let best: { score: number; matchedOn: string } | null = null;
  const consider = (score: number, matchedOn: string) => {
    if (!best || score > best.score) best = { score, matchedOn };
  };

  if (normDesc.includes(` ${name} `)) {
    consider(1.0, 'full name');
  }

  const phoneDigits = digitsOnly(member.phone || '');
  if (phoneDigits.length >= 9) {
    const descDigits = digitsOnly(description);
    if (descDigits.includes(phoneDigits.slice(-9))) {
      consider(0.95, 'phone number');
    }
  }

  if (tokens.length >= 2 && tokens.every((token) => containsWord(normDesc, token))) {
    consider(0.9, 'all name parts');
  }

  const emailLocal = normalizeText((member.email || '').split('@')[0] || '');
  if (emailLocal.length >= 4 && normDesc.replace(/ /g, '').includes(emailLocal.replace(/ /g, ''))) {
    consider(0.8, 'email');
  }

  if (tokens.length >= 2) {
    const surname = tokens[tokens.length - 1];
    const firstInitial = tokens[0][0];
    if (
      surname.length >= 4 &&
      containsWord(normDesc, surname) &&
      (containsWord(normDesc, firstInitial) ||
        normDesc.includes(` ${firstInitial}${surname} `))
    ) {
      consider(0.75, 'surname + initial');
    }
  }

  const longTokens = tokens.filter((token) => token.length >= 5);
  if (longTokens.some((token) => containsWord(normDesc, token))) {
    consider(0.5, 'partial name');
  }

  return best;
};

/** Rank all members against one transaction description. */
export const matchTransaction = (
  transaction: BankTransaction,
  members: Member[]
): MatchedTransaction => {
  const candidates: MatchCandidate[] = [];

  for (const member of members) {
    const result = scoreMemberMatch(transaction.description, member);
    if (result && result.score >= SUGGESTION_THRESHOLD) {
      candidates.push({
        memberId: member.id,
        memberName: member.full_name,
        score: result.score,
        matchedOn: result.matchedOn,
      });
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  const top = candidates.slice(0, MAX_CANDIDATES);

  // Only auto-match when the winner is unambiguous
  const best = top[0];
  const runnerUp = top[1];
  const autoMatch =
    best &&
    best.score >= AUTO_MATCH_THRESHOLD &&
    (!runnerUp || runnerUp.score < best.score)
      ? best
      : null;

  return { transaction, autoMatch, candidates: top };
};

// ---------- row parsing ----------

export interface BankColumnMapping {
  date: string;
  description: string;
  amount: string;
}

export const parseBankStatementRows = (
  rawRows: Record<string, unknown>[],
  mapping: BankColumnMapping
): BankParseResult => {
  const result: BankParseResult = {
    transactions: [],
    errors: [],
    skippedNonCredits: 0,
  };

  rawRows.forEach((row, index) => {
    const rowNumber = index + 1;
    const description = String(row[mapping.description] ?? '').trim();
    const amount = parseAmount(row[mapping.amount]);
    const date = parseFlexibleDate(row[mapping.date]);

    if (amount === null) {
      result.errors.push({
        row: rowNumber,
        message: `Unreadable amount: ${String(row[mapping.amount] ?? '')}`,
      });
      return;
    }
    if (amount <= 0) {
      result.skippedNonCredits++;
      return;
    }
    if (!date) {
      result.errors.push({
        row: rowNumber,
        message: `Unreadable date: ${String(row[mapping.date] ?? '')}`,
      });
      return;
    }
    if (!description) {
      result.errors.push({ row: rowNumber, message: 'Missing description' });
      return;
    }

    result.transactions.push({ rowNumber, date, description, amount });
  });

  return result;
};

// ---------- conversion for import ----------

export interface TransactionAssignment {
  transaction: BankTransaction;
  memberId: string;
  memberName: string;
}

/**
 * Group assigned transactions into the shape the existing bulk importer
 * consumes: one monthly contribution per member per month, references
 * preserved from the statement descriptions.
 */
export const toAggregatedContributions = (
  assignments: TransactionAssignment[]
): AggregatedContribution[] => {
  const grouped = new Map<string, AggregatedContribution>();

  for (const { transaction, memberId, memberName } of assignments) {
    const monthYear = format(transaction.date, 'yyyy-MM');
    const key = `${memberId}_${monthYear}`;
    const reference = transaction.description.slice(0, 80);

    const existing = grouped.get(key);
    if (existing) {
      existing.amount += transaction.amount;
      existing.originalReferences.push(reference);
    } else {
      grouped.set(key, {
        memberId,
        memberName,
        amount: transaction.amount,
        monthYear,
        type: 'monthly',
        originalReferences: [reference],
      });
    }
  }

  return Array.from(grouped.values());
};
