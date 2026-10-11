/**
 * Credit status report (PDF / Excel / CSV): members with outstanding credit
 * and/or members who have settled their credit.
 */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import type {
  ReportParams,
  CreditStatusFilter,
  CreditStatusReportData,
  MemberCreditLine,
} from './types';
import type { Member } from '../../types';
import type { Credit } from '../../types/credit';
import { addPdfHeader, addPdfFooter, addPdfSection, addPdfMetric, lastTableY } from './pdfHelpers';

// ==================== HELPERS ====================

const money = (amount: number): string =>
  `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (date: Date | null): string => (date ? format(date, 'dd MMM yyyy') : '—');

const STATUS_LABELS: Record<MemberCreditLine['status'], string> = {
  active: 'Outstanding',
  defaulted: 'Defaulted',
  settled: 'Settled',
};

export const FILTER_LABELS: Record<CreditStatusFilter, string> = {
  all: 'Outstanding & Settled',
  outstanding: 'Outstanding',
  settled: 'Settled',
};

const isOutstanding = (line: MemberCreditLine) =>
  line.status === 'active' || line.status === 'defaulted';

const toDate = (value: unknown): Date | null => {
  const ts = value as { toDate?: () => Date } | null | undefined;
  return ts?.toDate ? ts.toDate() : null;
};

const fileStem = (filter: CreditStatusFilter) =>
  `credit-status-${filter}-${format(new Date(), 'yyyy-MM-dd-HHmm')}`;

// ==================== DATA COLLECTION ====================

/**
 * Build the credit status report from credits + members. Pure (no Firebase
 * calls) so it can be unit tested. Only credits where money was actually
 * disbursed are included: outstanding = active/defaulted, settled = settled.
 * Credits still pending review, rejected, or approved-but-not-active are
 * excluded because no balance is owed on them.
 */
export function collectCreditStatusData(
  credits: Credit[],
  members: Member[],
  filter: CreditStatusFilter = 'all'
): CreditStatusReportData {
  const memberById = new Map(members.map((m) => [m.id, m]));

  const lines: MemberCreditLine[] = credits
    .filter(
      (c): c is Credit & { status: MemberCreditLine['status'] } =>
        c.status === 'active' || c.status === 'defaulted' || c.status === 'settled'
    )
    .map((credit) => {
      const member = memberById.get(credit.member_id);
      const payments = credit.payments ?? [];
      const paymentDates = payments
        .map((p) => toDate(p.paid_at))
        .filter((d): d is Date => d !== null)
        .sort((a, b) => b.getTime() - a.getTime());

      return {
        creditId: credit.id,
        memberId: credit.member_id,
        memberName: member?.full_name ?? credit.member_name,
        email: member?.email ?? '',
        phoneNumber: member?.phone ?? '',
        reason: credit.reason,
        status: credit.status,
        issuedDate: toDate(credit.review?.reviewed_at) ?? toDate(credit.created_at),
        totalAmount: credit.terms.total_amount,
        totalPaid: credit.total_paid ?? 0,
        remainingBalance: credit.status === 'settled' ? 0 : credit.remaining_balance ?? 0,
        installments: credit.terms.installments,
        installmentsPaid: payments.length,
        lastPaymentDate: paymentDates[0] ?? null,
        settledDate: toDate(credit.settled_at),
        overridden: Boolean(credit.override),
      };
    });

  const outstanding = lines.filter(isOutstanding);
  const settled = lines.filter((l) => l.status === 'settled');

  const included =
    filter === 'outstanding' ? outstanding : filter === 'settled' ? settled : lines;

  // Outstanding first (largest balance first), then settled (most recent first)
  const sorted = [...included].sort((a, b) => {
    if (isOutstanding(a) !== isOutstanding(b)) return isOutstanding(a) ? -1 : 1;
    if (isOutstanding(a)) return b.remainingBalance - a.remainingBalance;
    return (b.settledDate?.getTime() ?? 0) - (a.settledDate?.getTime() ?? 0);
  });

  return {
    filter,
    credits: sorted,
    outstandingCount: outstanding.length,
    outstandingBalance: outstanding.reduce((sum, l) => sum + l.remainingBalance, 0),
    settledCount: settled.length,
    settledAmount: settled.reduce((sum, l) => sum + l.totalAmount, 0),
    defaultedCount: outstanding.filter((l) => l.status === 'defaulted').length,
    membersWithOutstanding: new Set(outstanding.map((l) => l.memberId)).size,
    generatedAt: new Date(),
  };
}

// ==================== PDF ====================

export async function generateCreditStatusPdfReport(
  data: CreditStatusReportData,
  params: ReportParams
): Promise<void> {
  const doc = new jsPDF();
  let yPos = 40;

  addPdfHeader(
    doc,
    `Member Credit Status — ${FILTER_LABELS[data.filter]}`,
    `Generated: ${format(data.generatedAt, 'dd MMM yyyy HH:mm')}`
  );

  if (params.includeMetrics) {
    yPos = addPdfSection(doc, 'Summary', yPos);
    if (data.filter !== 'settled') {
      addPdfMetric(doc, 'Members with Outstanding Credit', data.membersWithOutstanding.toString(), 14, yPos);
      addPdfMetric(doc, 'Outstanding Balance', money(data.outstandingBalance), 80, yPos);
      addPdfMetric(doc, 'Defaulted Credits', data.defaultedCount.toString(), 146, yPos);
      yPos += 20;
    }
    if (data.filter !== 'outstanding') {
      addPdfMetric(doc, 'Settled Credits', data.settledCount.toString(), 14, yPos);
      addPdfMetric(doc, 'Total Repaid (Settled)', money(data.settledAmount), 80, yPos);
      yPos += 20;
    }
  }

  const outstanding = data.credits.filter(isOutstanding);
  const settled = data.credits.filter((l) => l.status === 'settled');

  if (data.filter !== 'settled') {
    yPos = addPdfSection(doc, 'Outstanding Credit', yPos);
    if (outstanding.length > 0) {
      autoTable(doc, {
        startY: yPos,
        head: [['Member', 'Phone', 'Reason', 'Issued', 'Total', 'Paid', 'Balance', 'Instalments', 'Status']],
        body: outstanding.map((l) => [
          l.overridden ? `${l.memberName} *` : l.memberName,
          l.phoneNumber,
          l.reason,
          fmtDate(l.issuedDate),
          money(l.totalAmount),
          money(l.totalPaid),
          money(l.remainingBalance),
          `${l.installmentsPaid}/${l.installments}`,
          STATUS_LABELS[l.status],
        ]),
        theme: 'grid',
        headStyles: { fillColor: [245, 158, 11], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 7, textColor: [55, 65, 81] },
        alternateRowStyles: { fillColor: [255, 251, 235] },
        margin: { left: 14, right: 14 },
      });
      yPos = lastTableY(doc) + 10;
    } else {
      doc.setFontSize(10);
      doc.setTextColor(34, 197, 94);
      doc.text('No outstanding credit — every disbursed credit has been repaid.', 14, yPos);
      yPos += 12;
    }
  }

  if (data.filter !== 'outstanding') {
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }
    yPos = addPdfSection(doc, 'Settled Credit', yPos);
    if (settled.length > 0) {
      autoTable(doc, {
        startY: yPos,
        head: [['Member', 'Phone', 'Reason', 'Issued', 'Total Repaid', 'Instalments', 'Settled On']],
        body: settled.map((l) => [
          l.overridden ? `${l.memberName} *` : l.memberName,
          l.phoneNumber,
          l.reason,
          fmtDate(l.issuedDate),
          money(l.totalAmount),
          `${l.installmentsPaid}/${l.installments}`,
          fmtDate(l.settledDate),
        ]),
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 7, textColor: [55, 65, 81] },
        alternateRowStyles: { fillColor: [236, 253, 245] },
        margin: { left: 14, right: 14 },
      });
      yPos = lastTableY(doc) + 10;
    } else {
      doc.setFontSize(10);
      doc.setTextColor(107, 114, 128);
      doc.text('No settled credits yet.', 14, yPos);
      yPos += 12;
    }
  }

  if (data.credits.some((l) => l.overridden)) {
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text('* Credit issued under an admin override of the one-active-credit rule.', 14, yPos);
  }

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addPdfFooter(doc, i);
  }

  doc.save(`${fileStem(data.filter)}.pdf`);
}

// ==================== EXCEL / CSV ====================

const SUMMARY_ROWS = (data: CreditStatusReportData): (string | number)[][] => [
  [`Member Credit Status Report — ${FILTER_LABELS[data.filter]}`],
  ['Generated on', format(data.generatedAt, 'dd MMM yyyy HH:mm')],
  [],
  ['Summary'],
  ['Members with outstanding credit', data.membersWithOutstanding],
  ['Outstanding credits', data.outstandingCount],
  ['Outstanding balance', data.outstandingBalance],
  ['Defaulted credits', data.defaultedCount],
  ['Settled credits', data.settledCount],
  ['Total repaid (settled)', data.settledAmount],
];

const DETAIL_HEADER = [
  'Member', 'Email', 'Phone', 'Reason', 'Status', 'Issued', 'Total Amount',
  'Total Paid', 'Balance', 'Instalments Paid', 'Instalments', 'Last Payment',
  'Settled On', 'Overridden',
];

const detailRow = (l: MemberCreditLine): (string | number)[] => [
  l.memberName,
  l.email,
  l.phoneNumber,
  l.reason,
  STATUS_LABELS[l.status],
  fmtDate(l.issuedDate),
  l.totalAmount,
  l.totalPaid,
  l.remainingBalance,
  l.installmentsPaid,
  l.installments,
  fmtDate(l.lastPaymentDate),
  fmtDate(l.settledDate),
  l.overridden ? 'Yes' : 'No',
];

export async function generateCreditStatusExcelReport(
  data: CreditStatusReportData,
  _params: ReportParams
): Promise<void> {
  const workbook = XLSX.utils.book_new();

  const summarySheet = XLSX.utils.aoa_to_sheet(SUMMARY_ROWS(data));
  summarySheet['!cols'] = [{ wch: 34 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  const cols = DETAIL_HEADER.map((h) => ({ wch: Math.max(12, h.length + 4) }));
  const addSheet = (name: string, lines: MemberCreditLine[]) => {
    const sheet = XLSX.utils.aoa_to_sheet([DETAIL_HEADER, ...lines.map(detailRow)]);
    sheet['!cols'] = cols;
    XLSX.utils.book_append_sheet(workbook, sheet, name);
  };

  if (data.filter !== 'settled') addSheet('Outstanding', data.credits.filter(isOutstanding));
  if (data.filter !== 'outstanding') {
    addSheet('Settled', data.credits.filter((l) => l.status === 'settled'));
  }

  XLSX.writeFile(workbook, `${fileStem(data.filter)}.xlsx`);
}

export async function generateCreditStatusCsvReport(
  data: CreditStatusReportData,
  _params: ReportParams
): Promise<void> {
  const rows = [...SUMMARY_ROWS(data), [], DETAIL_HEADER, ...data.credits.map(detailRow)];
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
