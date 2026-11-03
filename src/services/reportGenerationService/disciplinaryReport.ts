/**
 * Disciplinary records report (PDF / Excel / CSV): open (unresolved) and/or
 * resolved disciplinary records, with the infringement details and penalties.
 */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { endOfDay, format, startOfDay } from 'date-fns';
import type {
  ReportParams,
  DisciplinaryStatusFilter,
  DisciplinaryReportData,
  DisciplinaryRecordLine,
} from './types';
import type { DisciplinaryRecord, Member } from '../../types';
import { addPdfHeader, addPdfFooter, addPdfSection, addPdfMetric, lastTableY } from './pdfHelpers';

// ==================== HELPERS ====================

const money = (amount: number): string =>
  `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (date: Date | null): string => (date ? format(date, 'dd MMM yyyy') : '—');

export const DISCIPLINARY_FILTER_LABELS: Record<DisciplinaryStatusFilter, string> = {
  all: 'Open & Resolved',
  open: 'Open',
  resolved: 'Resolved',
};

const STATUS_LABELS: Record<DisciplinaryRecordLine['status'], string> = {
  open: 'Open',
  resolved: 'Resolved',
};

const toDate = (value: unknown): Date | null => {
  const ts = value as { toDate?: () => Date } | null | undefined;
  return ts?.toDate ? ts.toDate() : null;
};

const fileStem = (filter: DisciplinaryStatusFilter) =>
  `disciplinary-${filter}-${format(new Date(), 'yyyy-MM-dd-HHmm')}`;

const periodLabel = (data: DisciplinaryReportData) =>
  data.period
    ? `Incidents ${format(data.period.start, 'dd MMM yyyy')} – ${format(data.period.end, 'dd MMM yyyy')} · `
    : '';

const sumPenalties = (lines: DisciplinaryRecordLine[]) =>
  lines.reduce((sum, l) => sum + l.penaltyAmount, 0);

// ==================== DATA COLLECTION ====================

/**
 * Build the disciplinary report from records + members. Pure (no Firebase
 * calls) so it can be unit tested. Records stored as 'pending' are reported
 * as open (unresolved). When a date range is given, only records whose
 * incident date (or recorded date, if none) falls inside it are included.
 */
export function collectDisciplinaryData(
  records: DisciplinaryRecord[],
  members: Member[],
  filter: DisciplinaryStatusFilter = 'all',
  dateRange?: { start: Date; end: Date }
): DisciplinaryReportData {
  const memberById = new Map(members.map((m) => [m.id, m]));
  const from = dateRange ? startOfDay(dateRange.start).getTime() : -Infinity;
  const to = dateRange ? endOfDay(dateRange.end).getTime() : Infinity;

  const allLines: DisciplinaryRecordLine[] = records.map((record) => {
    const member = memberById.get(record.member_id);
    return {
      recordId: record.id,
      memberId: record.member_id,
      memberName: member?.full_name ?? 'Unknown member',
      email: member?.email ?? '',
      phoneNumber: member?.phone ?? '',
      infringementType: record.infringement_type,
      description: record.description ?? '',
      incidentDate: toDate(record.date),
      penaltyAmount: record.penalty_amount ?? 0,
      status: record.status === 'resolved' ? 'resolved' : 'open',
      recordedDate: toDate(record.created_at),
      resolvedDate: toDate(record.resolved_at),
      resolutionNotes: record.resolution_notes ?? '',
    };
  });

  const lines = allLines.filter((l) => {
    const when = (l.incidentDate ?? l.recordedDate)?.getTime();
    return when === undefined ? !dateRange : when >= from && when <= to;
  });

  const open = lines.filter((l) => l.status === 'open');
  const resolved = lines.filter((l) => l.status === 'resolved');
  const included = filter === 'open' ? open : filter === 'resolved' ? resolved : lines;

  // Open first (oldest incident first — longest outstanding), then resolved
  // (most recently resolved first)
  const sorted = [...included].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'open' ? -1 : 1;
    if (a.status === 'open') {
      return (a.incidentDate?.getTime() ?? 0) - (b.incidentDate?.getTime() ?? 0);
    }
    return (b.resolvedDate?.getTime() ?? 0) - (a.resolvedDate?.getTime() ?? 0);
  });

  return {
    filter,
    records: sorted,
    period: dateRange ?? null,
    openCount: open.length,
    openPenalties: sumPenalties(open),
    resolvedCount: resolved.length,
    resolvedPenalties: sumPenalties(resolved),
    membersWithOpenRecords: new Set(open.map((l) => l.memberId)).size,
    generatedAt: new Date(),
  };
}

// ==================== PDF ====================

export async function generateDisciplinaryPdfReport(
  data: DisciplinaryReportData,
  params: ReportParams
): Promise<void> {
  const doc = new jsPDF();
  let yPos = 40;

  addPdfHeader(
    doc,
    `Disciplinary Records — ${DISCIPLINARY_FILTER_LABELS[data.filter]}`,
    `${periodLabel(data)}Generated: ${format(data.generatedAt, 'dd MMM yyyy HH:mm')}`
  );

  if (params.includeMetrics) {
    yPos = addPdfSection(doc, 'Summary', yPos);
    if (data.filter !== 'resolved') {
      addPdfMetric(doc, 'Open Records', data.openCount.toString(), 14, yPos);
      addPdfMetric(doc, 'Members with Open Records', data.membersWithOpenRecords.toString(), 80, yPos);
      addPdfMetric(doc, 'Open Penalties', money(data.openPenalties), 146, yPos);
      yPos += 20;
    }
    if (data.filter !== 'open') {
      addPdfMetric(doc, 'Resolved Records', data.resolvedCount.toString(), 14, yPos);
      addPdfMetric(doc, 'Resolved Penalties', money(data.resolvedPenalties), 80, yPos);
      yPos += 20;
    }
  }

  const open = data.records.filter((l) => l.status === 'open');
  const resolved = data.records.filter((l) => l.status === 'resolved');
  const tableStyles = {
    theme: 'grid' as const,
    bodyStyles: { fontSize: 7, textColor: [55, 65, 81] as [number, number, number], valign: 'top' as const },
    margin: { left: 14, right: 14 },
  };

  if (data.filter !== 'resolved') {
    yPos = addPdfSection(doc, 'Open (Unresolved) Records', yPos);
    if (open.length > 0) {
      autoTable(doc, {
        ...tableStyles,
        startY: yPos,
        head: [['Member', 'Phone', 'Infringement', 'Date', 'Details', 'Penalty']],
        body: open.map((l) => [
          l.memberName,
          l.phoneNumber,
          l.infringementType,
          fmtDate(l.incidentDate),
          l.description,
          l.penaltyAmount ? money(l.penaltyAmount) : '—',
        ]),
        headStyles: { fillColor: [239, 68, 68], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        alternateRowStyles: { fillColor: [254, 242, 242] },
        columnStyles: { 4: { cellWidth: 70 } },
      });
      yPos = lastTableY(doc) + 10;
    } else {
      doc.setFontSize(10);
      doc.setTextColor(34, 197, 94);
      doc.text('No open disciplinary records.', 14, yPos);
      yPos += 12;
    }
  }

  if (data.filter !== 'open') {
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }
    yPos = addPdfSection(doc, 'Resolved Records', yPos);
    if (resolved.length > 0) {
      autoTable(doc, {
        ...tableStyles,
        startY: yPos,
        head: [['Member', 'Infringement', 'Date', 'Details', 'Penalty', 'Resolved', 'Resolution']],
        body: resolved.map((l) => [
          l.memberName,
          l.infringementType,
          fmtDate(l.incidentDate),
          l.description,
          l.penaltyAmount ? money(l.penaltyAmount) : '—',
          fmtDate(l.resolvedDate),
          l.resolutionNotes || '—',
        ]),
        headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        alternateRowStyles: { fillColor: [236, 253, 245] },
        columnStyles: { 3: { cellWidth: 50 }, 6: { cellWidth: 35 } },
      });
    } else {
      doc.setFontSize(10);
      doc.setTextColor(107, 114, 128);
      doc.text('No resolved disciplinary records yet.', 14, yPos);
    }
  }

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addPdfFooter(doc, i);
  }

  doc.save(`${fileStem(data.filter)}.pdf`);
}

// ==================== EXCEL / CSV ====================

const SUMMARY_ROWS = (data: DisciplinaryReportData): (string | number)[][] => [
  [`Disciplinary Records Report — ${DISCIPLINARY_FILTER_LABELS[data.filter]}`],
  ['Generated on', format(data.generatedAt, 'dd MMM yyyy HH:mm')],
  ...(data.period
    ? [['Incident period', `${format(data.period.start, 'dd MMM yyyy')} – ${format(data.period.end, 'dd MMM yyyy')}`]]
    : []),
  [],
  ['Summary'],
  ['Open records', data.openCount],
  ['Members with open records', data.membersWithOpenRecords],
  ['Open penalties', data.openPenalties],
  ['Resolved records', data.resolvedCount],
  ['Resolved penalties', data.resolvedPenalties],
];

const DETAIL_HEADER = [
  'Member', 'Email', 'Phone', 'Infringement', 'Details', 'Incident Date',
  'Penalty', 'Status', 'Recorded On', 'Resolved On', 'Resolution Notes',
];

const detailRow = (l: DisciplinaryRecordLine): (string | number)[] => [
  l.memberName,
  l.email,
  l.phoneNumber,
  l.infringementType,
  l.description,
  fmtDate(l.incidentDate),
  l.penaltyAmount,
  STATUS_LABELS[l.status],
  fmtDate(l.recordedDate),
  fmtDate(l.resolvedDate),
  l.resolutionNotes,
];

export async function generateDisciplinaryExcelReport(
  data: DisciplinaryReportData,
  _params: ReportParams
): Promise<void> {
  const workbook = XLSX.utils.book_new();

  const summarySheet = XLSX.utils.aoa_to_sheet(SUMMARY_ROWS(data));
  summarySheet['!cols'] = [{ wch: 30 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  const cols = DETAIL_HEADER.map((h) => ({
    wch: h === 'Details' || h === 'Resolution Notes' ? 50 : Math.max(12, h.length + 4),
  }));
  const addSheet = (name: string, lines: DisciplinaryRecordLine[]) => {
    const sheet = XLSX.utils.aoa_to_sheet([DETAIL_HEADER, ...lines.map(detailRow)]);
    sheet['!cols'] = cols;
    XLSX.utils.book_append_sheet(workbook, sheet, name);
  };

  if (data.filter !== 'resolved') addSheet('Open', data.records.filter((l) => l.status === 'open'));
  if (data.filter !== 'open') addSheet('Resolved', data.records.filter((l) => l.status === 'resolved'));

  XLSX.writeFile(workbook, `${fileStem(data.filter)}.xlsx`);
}

export async function generateDisciplinaryCsvReport(
  data: DisciplinaryReportData,
  _params: ReportParams
): Promise<void> {
  const rows = [...SUMMARY_ROWS(data), [], DETAIL_HEADER, ...data.records.map(detailRow)];
  const csv = XLSX.utils.sheet_to_csv(XLSX.utils.aoa_to_sheet(rows));

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileStem(data.filter)}.csv`;
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
