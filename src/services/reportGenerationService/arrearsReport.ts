/**
 * Arrears report (PDF / Excel / CSV) and arrears data collection
 */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import logger from '../../utils/logger';
import type { ReportParams, ArrearsReportData, MemberArrears } from './types';
import type { Member } from '../../types';
import type { Contribution } from '../../types/contribution';
import { addPdfHeader, addPdfFooter, addPdfSection, addPdfMetric, lastTableY } from './pdfHelpers';

// ==================== ARREARS REPORT - PDF ====================

export async function generateArrearsPdfReport(
  data: ArrearsReportData,
  params: ReportParams
): Promise<void> {
  const doc = new jsPDF();
  let yPos = 40;

  // Header
  addPdfHeader(
    doc,
    'Members in Arrears Report',
    `Generated: ${format(new Date(), 'dd MMM yyyy HH:mm')}`
  );

  // Summary Section
  if (params.includeMetrics) {
    yPos = addPdfSection(doc, 'Summary', yPos);

    // Summary metrics in a row
    addPdfMetric(
      doc,
      'Total Members in Arrears',
      data.totalMembersInArrears.toString(),
      14,
      yPos
    );

    addPdfMetric(
      doc,
      'Total Amount Owed',
      `R${data.totalAmountOwed.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`,
      70,
      yPos
    );

    addPdfMetric(
      doc,
      'Average Amount Owed',
      `R${data.averageAmountOwed.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`,
      136,
      yPos
    );

    yPos += 20;
  }

  // Members in Arrears Table
  if (data.members && data.members.length > 0) {
    yPos = addPdfSection(doc, 'Members in Arrears', yPos);

    // Sort by amount owed (highest first)
    const sortedMembers = [...data.members].sort((a, b) => b.totalAmountOwed - a.totalAmountOwed);

    const membersTableData = sortedMembers.map((member) => [
      member.memberName,
      member.phoneNumber,
      member.lastPaymentDate ? format(member.lastPaymentDate, 'dd MMM yyyy') : 'Never',
      member.monthsOwed.toString(),
      `R${member.totalAmountOwed.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`,
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Member Name', 'Phone', 'Last Payment', 'Months Owed', 'Total Owed']],
      body: membersTableData,
      theme: 'grid',
      headStyles: {
        fillColor: [239, 68, 68], // Red for arrears
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [55, 65, 81],
      },
      alternateRowStyles: {
        fillColor: [254, 242, 242], // Light red
      },
      margin: { left: 14, right: 14 },
    });

    yPos = lastTableY(doc) + 10;

    // Detailed breakdown for each member
    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
      addPdfFooter(doc, doc.getNumberOfPages() - 1);
    }

    yPos = addPdfSection(doc, 'Detailed Member Breakdown', yPos);

    sortedMembers.forEach((member, index) => {
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
        addPdfFooter(doc, doc.getNumberOfPages() - 1);
      }

      // Member header
      doc.setFontSize(10);
      doc.setTextColor(55, 65, 81);
      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}. ${member.memberName}`, 14, yPos);
      doc.setFont('helvetica', 'normal');
      yPos += 6;

      // Member details
      doc.setFontSize(8);
      doc.setTextColor(75, 85, 99);
      doc.text(`Email: ${member.email}`, 14, yPos);
      yPos += 4;
      doc.text(`Phone: ${member.phoneNumber}`, 14, yPos);
      yPos += 4;
      doc.text(`Join Date: ${format(member.joinDate, 'dd MMM yyyy')}`, 14, yPos);
      yPos += 4;
      doc.text(
        `Last Payment: ${member.lastPaymentDate ? format(member.lastPaymentDate, 'dd MMM yyyy') : 'Never'}`,
        14,
        yPos
      );
      yPos += 6;

      // Unpaid months table
      if (member.unpaidMonths && member.unpaidMonths.length > 0) {
        const unpaidData = member.unpaidMonths.map((month) => [
          month.month,
          `R${month.amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`,
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [['Month', 'Amount Owed']],
          body: unpaidData,
          theme: 'plain',
          headStyles: {
            fillColor: [243, 244, 246],
            textColor: [55, 65, 81],
            fontStyle: 'bold',
            fontSize: 8,
          },
          bodyStyles: {
            fontSize: 7,
            textColor: [75, 85, 99],
          },
          margin: { left: 20, right: 14 },
          tableWidth: 80,
        });

        yPos = lastTableY(doc) + 2;
      }

      // Total for this member
      doc.setFontSize(9);
      doc.setTextColor(239, 68, 68);
      doc.setFont('helvetica', 'bold');
      doc.text(
        `Total: R${member.totalAmountOwed.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`,
        20,
        yPos
      );
      doc.setFont('helvetica', 'normal');
      yPos += 8;
    });
  } else {
    doc.setFontSize(10);
    doc.setTextColor(34, 197, 94); // Green
    doc.text('No members in arrears! All members are up to date.', 14, yPos);
  }

  // Add footer to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addPdfFooter(doc, i);
  }

  // Save the PDF
  doc.save(`members-in-arrears-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`);
}

// ==================== ARREARS REPORT - EXCEL ====================

export async function generateArrearsExcelReport(
  data: ArrearsReportData,
  _params: ReportParams
): Promise<void> {
  const workbook = XLSX.utils.book_new();

  // Summary Sheet
  const summaryData = [
    ['Members in Arrears Report'],
    ['Generated on', format(new Date(), 'dd MMM yyyy HH:mm')],
    [],
    ['Summary'],
    ['Total Members in Arrears', data.totalMembersInArrears],
    ['Total Amount Owed', data.totalAmountOwed],
    ['Average Amount Owed', data.averageAmountOwed],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 30 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  // Members Summary Sheet
  if (data.members && data.members.length > 0) {
    const sortedMembers = [...data.members].sort((a, b) => b.totalAmountOwed - a.totalAmountOwed);

    const membersData = [
      ['Members in Arrears'],
      ['Member Name', 'Email', 'Phone', 'Join Date', 'Last Payment', 'Months Owed', 'Total Owed'],
      ...sortedMembers.map((member) => [
        member.memberName,
        member.email,
        member.phoneNumber,
        format(member.joinDate, 'dd MMM yyyy'),
        member.lastPaymentDate ? format(member.lastPaymentDate, 'dd MMM yyyy') : 'Never',
        member.monthsOwed,
        member.totalAmountOwed,
      ]),
    ];

    const membersSheet = XLSX.utils.aoa_to_sheet(membersData);
    membersSheet['!cols'] = [
      { wch: 25 },
      { wch: 30 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 12 },
      { wch: 15 },
    ];
    XLSX.utils.book_append_sheet(workbook, membersSheet, 'Members Summary');

    // Detailed Breakdown Sheet
    const detailedData: (string | number)[][] = [
      ['Detailed Member Breakdown'],
      ['Member Name', 'Email', 'Phone', 'Month', 'Amount Owed'],
    ];

    sortedMembers.forEach((member) => {
      if (member.unpaidMonths && member.unpaidMonths.length > 0) {
        member.unpaidMonths.forEach((month, index) => {
          detailedData.push([
            index === 0 ? member.memberName : '',
            index === 0 ? member.email : '',
            index === 0 ? member.phoneNumber : '',
            month.month,
            month.amount,
          ]);
        });
        // Add total row for each member
        detailedData.push([
          '',
          '',
          'TOTAL:',
          '',
          member.totalAmountOwed,
        ]);
        // Add blank row
        detailedData.push(['', '', '', '', '']);
      }
    });

    const detailedSheet = XLSX.utils.aoa_to_sheet(detailedData);
    detailedSheet['!cols'] = [
      { wch: 25 },
      { wch: 30 },
      { wch: 15 },
      { wch: 20 },
      { wch: 15 },
    ];
    XLSX.utils.book_append_sheet(workbook, detailedSheet, 'Detailed Breakdown');
  }

  // Write the file
  XLSX.writeFile(
    workbook,
    `members-in-arrears-${format(new Date(), 'yyyy-MM-dd-HHmm')}.xlsx`
  );
}

// ==================== ARREARS REPORT - CSV ====================

export async function generateArrearsCsvReport(
  data: ArrearsReportData,
  _params: ReportParams
): Promise<void> {
  const csvData = [
    ['Members in Arrears Report'],
    ['Generated on', format(new Date(), 'dd MMM yyyy HH:mm')],
    [],
    ['Summary'],
    ['Total Members in Arrears', data.totalMembersInArrears],
    ['Total Amount Owed', data.totalAmountOwed],
    ['Average Amount Owed', data.averageAmountOwed],
    [],
    ['Members in Arrears'],
    ['Member Name', 'Email', 'Phone', 'Join Date', 'Last Payment', 'Months Owed', 'Total Owed'],
    ...(data.members || [])
      .sort((a, b) => b.totalAmountOwed - a.totalAmountOwed)
      .map((member) => [
        member.memberName,
        member.email,
        member.phoneNumber,
        format(member.joinDate, 'dd MMM yyyy'),
        member.lastPaymentDate ? format(member.lastPaymentDate, 'dd MMM yyyy') : 'Never',
        member.monthsOwed,
        member.totalAmountOwed,
      ]),
  ];

  // Convert to CSV
  const worksheet = XLSX.utils.aoa_to_sheet(csvData);
  const csv = XLSX.utils.sheet_to_csv(worksheet);

  // Download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `members-in-arrears-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`
  );
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}


// ==================== ARREARS DATA COLLECTION ====================

export async function collectArrearsData(
  members: Member[],
  contributions: Contribution[]
): Promise<ArrearsReportData> {
  const { calculateUnpaidMonths } = await import('../../utils/invoice/calculator');

  const membersInArrears: MemberArrears[] = [];

  for (const member of members) {
    if (member.status !== 'approved') continue;

    const memberContributions = contributions
      .filter((c) => c.member_id === member.id && c.status === 'approved')
      .sort((a, b) => a.date.toDate().getTime() - b.date.toDate().getTime());

    try {
      // Use the same invoice calculation logic
      const unpaidMonths = await calculateUnpaidMonths(
        memberContributions,
        member.join_date.toDate()
      );

      if (unpaidMonths.length > 0) {
        const totalOwed = unpaidMonths.reduce((sum, month) => sum + month.amount, 0);

        // Get last payment date
        const lastPaymentDate = memberContributions.length > 0
          ? memberContributions[memberContributions.length - 1].date.toDate()
          : null;

        membersInArrears.push({
          memberId: member.id,
          memberName: member.full_name,
          email: member.email,
          phoneNumber: member.phone,
          joinDate: member.join_date.toDate(),
          lastPaymentDate,
          monthsOwed: unpaidMonths.length,
          totalAmountOwed: totalOwed,
          unpaidMonths: unpaidMonths.map((month) => ({
            month: format(month.month, 'MMM yyyy'),
            amount: month.amount,
          })),
        });
      }
    } catch (error) {
      logger.error(`Error calculating arrears for member ${member.id}:`, error);
      // Continue with next member
    }
  }

  const totalAmountOwed = membersInArrears.reduce((sum, m) => sum + m.totalAmountOwed, 0);
  const averageAmountOwed = membersInArrears.length > 0 ? totalAmountOwed / membersInArrears.length : 0;

  return {
    members: membersInArrears,
    totalMembersInArrears: membersInArrears.length,
    totalAmountOwed,
    averageAmountOwed,
    generatedAt: new Date(),
  };
}
