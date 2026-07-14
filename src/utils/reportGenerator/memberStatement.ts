import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import type { Member } from '../../types';
import type { Contribution } from '../../types/contribution';
import type { Payout } from '../../types/payout';
import type { Credit } from '../../types/credit';
import { formatDate } from '../dateUtils';
import { addLogo } from '../pdf/logo';
import {
  StatementPeriod,
  filterByPeriod,
  computeStatementSummary,
  isStatementCredit,
  periodLabel,
  periodFileSuffix,
} from './statementHelpers';

/**
 * Member statement PDF: member details, period-scoped financial summary,
 * contributions, payouts, credits, and dependants.
 */

export interface StatementData {
  member: Member;
  contributions: Contribution[];
  payouts: Payout[];
  credits: Credit[];
}

// jspdf-autotable attaches its state to the document at runtime
type WithAutoTable = jsPDF & { lastAutoTable: { finalY: number } };
const lastTableY = (doc: jsPDF): number =>
  (doc as WithAutoTable).lastAutoTable.finalY;

const INDIGO: [number, number, number] = [79, 70, 229];
const rand = (amount: number) => `R ${amount.toFixed(2)}`;

export const generateMemberStatement = async (
  data: StatementData,
  period: StatementPeriod
): Promise<void> => {
  const { member } = data;
  const contributions = filterByPeriod(data.contributions, (c) => c.date, period);
  const payouts = filterByPeriod(data.payouts, (p) => p.date, period);
  const credits = filterByPeriod(
    data.credits.filter(isStatementCredit),
    (c) => c.created_at,
    period
  );
  const summary = computeStatementSummary(contributions, payouts, credits);

  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.height;

  await addLogo(doc);

  // Header
  doc.setFontSize(20);
  doc.text('Member Statement', 20, 20);
  doc.setFontSize(11);
  doc.setTextColor(107, 114, 128);
  doc.text(`Period: ${periodLabel(period)}`, 20, 27);
  doc.setTextColor(0, 0, 0);

  // Member Details
  doc.setFontSize(12);
  doc.text(`Name: ${member.full_name}`, 20, 40);
  doc.text(`Email: ${member.email}`, 20, 48);
  doc.text(`Phone: ${member.phone}`, 20, 56);
  doc.text(`Join Date: ${formatDate(member.join_date)}`, 20, 64);
  doc.text(`Status: ${member.status}`, 20, 72);

  // Starts a new page when there is no room left for a heading + a few rows
  const sectionStart = (afterY: number): number => {
    if (afterY > pageHeight - 50) {
      doc.addPage();
      return 20;
    }
    return afterY;
  };

  const drawTable = (
    title: string,
    startAfterY: number,
    head: string[],
    body: (string | number)[][],
    emptyMessage: string
  ): void => {
    const y = sectionStart(startAfterY);
    doc.setFontSize(12);
    doc.text(title, 20, y);
    autoTable(doc, {
      startY: y + 5,
      head: [head],
      body: body.length > 0 ? body : [[emptyMessage, ...head.slice(1).map(() => '')]],
      theme: 'striped',
      headStyles: { fillColor: INDIGO },
    });
  };

  // Financial Summary (period-scoped)
  const summaryRows: (string | number)[][] = [
    ['Total Approved Contributions', rand(summary.totalApproved)],
    ['Pending Contributions', rand(summary.totalPending)],
    ['Rejected Contributions', rand(summary.totalRejected)],
    ['Total Payouts', rand(summary.totalPayouts)],
    ['Net Balance (approved − payouts)', rand(summary.netBalance)],
    ['Credits Issued', rand(summary.totalCredited)],
    ['Credit Repayments', rand(summary.totalCreditRepaid)],
    ['Outstanding Credit Balance *', rand(summary.outstandingCreditBalance)],
  ];
  drawTable('Financial Summary', 85, ['Description', 'Amount'], summaryRows, '');
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text(
    '* Current balance as of the statement date, not period-scoped.',
    20,
    lastTableY(doc) + 5
  );
  doc.setTextColor(0, 0, 0);

  // Contributions History
  drawTable(
    'Contributions History',
    lastTableY(doc) + 15,
    ['Date', 'Type', 'Amount', 'Status', 'Notes'],
    contributions.map((contribution) => [
      formatDate(contribution.date),
      contribution.type,
      rand(contribution.amount),
      contribution.status,
      contribution.review_notes || '-',
    ]),
    'No contributions in selected period'
  );

  // Payouts History
  drawTable(
    'Payouts History',
    lastTableY(doc) + 15,
    ['Date', 'Reason', 'Status', 'Amount'],
    payouts.map((payout) => [
      formatDate(payout.date),
      payout.reason,
      payout.status,
      rand(payout.amount),
    ]),
    'No payouts in selected period'
  );

  // Credits
  drawTable(
    'Credits',
    lastTableY(doc) + 15,
    ['Date', 'Reason', 'Total', 'Paid', 'Balance', 'Status'],
    credits.map((credit) => [
      formatDate(credit.created_at),
      credit.reason,
      rand(credit.terms?.total_amount ?? 0),
      rand(credit.total_paid ?? 0),
      rand(credit.remaining_balance ?? 0),
      credit.status,
    ]),
    'No credits in selected period'
  );

  // Dependants (current, not period-scoped)
  if (member.dependants && member.dependants.length > 0) {
    drawTable(
      'Registered Dependants',
      lastTableY(doc) + 15,
      ['Name', 'Relationship', 'Date of Birth', 'ID Number'],
      member.dependants.map((dependant) => [
        dependant.full_name,
        dependant.relationship,
        formatDate(dependant.date_of_birth),
        dependant.id_number,
      ]),
      ''
    );
  }

  // Footer on every page
  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page++) {
    doc.setPage(page);
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text(
      `Generated on ${format(new Date(), 'dd MMM yyyy HH:mm')}`,
      20,
      pageHeight - 10
    );
    doc.text(
      `Page ${page} of ${totalPages}`,
      doc.internal.pageSize.width - 40,
      pageHeight - 10
    );
    doc.setTextColor(0, 0, 0);
  }

  const name = member.full_name.toLowerCase().replace(/\s+/g, '-');
  doc.save(`${name}-statement-${periodFileSuffix(period)}.pdf`);
};
