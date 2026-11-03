import { describe, it, expect } from 'vitest';
import { collectDisciplinaryData } from './disciplinaryReport';
import type { Timestamp } from 'firebase/firestore';
import type { DisciplinaryRecord, Member } from '../../types';

// Minimal Timestamp stand-in: the collector only calls .toDate()
const ts = (iso: string) => ({ toDate: () => new Date(iso) }) as unknown as Timestamp;

const record = (
  id: string,
  memberId: string,
  status: DisciplinaryRecord['status'],
  over: Partial<DisciplinaryRecord> = {}
): DisciplinaryRecord =>
  ({
    id,
    member_id: memberId,
    infringement_type: 'Late attendance',
    description: `Details for ${id}`,
    date: ts('2026-03-01'),
    penalty_amount: 100,
    status,
    created_by: 'admin',
    created_at: ts('2026-03-02'),
    ...over,
  }) as unknown as DisciplinaryRecord;

const members = [
  { id: 'm1', full_name: 'Thandi Nkosi', email: 't@example.com', phone: '0711' },
  { id: 'm2', full_name: 'Sipho Dlamini', email: 's@example.com', phone: '0722' },
] as unknown as Member[];

const records = [
  record('r1', 'm1', 'pending', { date: ts('2026-02-01'), penalty_amount: 150 }),
  record('r2', 'm1', 'pending', { date: ts('2026-01-15'), penalty_amount: undefined }),
  record('r3', 'm2', 'resolved', {
    resolved_at: ts('2026-04-01'),
    resolution_notes: 'Penalty paid',
  } as Partial<DisciplinaryRecord>),
  record('r4', 'm2', 'resolved', { resolved_at: ts('2026-05-01') } as Partial<DisciplinaryRecord>),
];

describe('collectDisciplinaryData', () => {
  it('reports open and resolved records with details and totals', () => {
    const data = collectDisciplinaryData(records, members);

    expect(data.openCount).toBe(2);
    expect(data.openPenalties).toBe(150);
    expect(data.resolvedCount).toBe(2);
    expect(data.resolvedPenalties).toBe(200);
    expect(data.membersWithOpenRecords).toBe(1);

    const r1 = data.records.find((l) => l.recordId === 'r1')!;
    expect(r1.memberName).toBe('Thandi Nkosi');
    expect(r1.description).toBe('Details for r1');
    expect(r1.status).toBe('open');
    expect(data.records.find((l) => l.recordId === 'r3')!.resolutionNotes).toBe('Penalty paid');
  });

  it('lists open first (oldest incident first), then most recently resolved', () => {
    const ids = collectDisciplinaryData(records, members).records.map((l) => l.recordId);
    expect(ids).toEqual(['r2', 'r1', 'r4', 'r3']);
  });

  it('filters to open or resolved only; totals still cover both', () => {
    const open = collectDisciplinaryData(records, members, 'open');
    expect(open.records.map((l) => l.status)).toEqual(['open', 'open']);
    expect(open.resolvedCount).toBe(2);

    const resolved = collectDisciplinaryData(records, members, 'resolved');
    expect(resolved.records.every((l) => l.status === 'resolved')).toBe(true);
  });

  it('limits records to the incident date range (inclusive of the end day)', () => {
    const data = collectDisciplinaryData(records, members, 'all', {
      start: new Date('2026-01-20'),
      end: new Date('2026-02-01'),
    });
    expect(data.records.map((l) => l.recordId)).toEqual(['r1']);
    expect(data.openCount).toBe(1);
  });

  it('keeps records of members who no longer exist', () => {
    const data = collectDisciplinaryData([record('x', 'gone', 'pending')], members);
    expect(data.records[0].memberName).toBe('Unknown member');
  });
});
