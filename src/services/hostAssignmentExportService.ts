import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import type { HostSchedule } from '../types';
import logger from '../utils/logger';

export const exportHostScheduleToExcel = (schedule: HostSchedule): void => {
  try {
    // Sort assignments by month
    const sortedAssignments = [...schedule.assignments].sort((a, b) => a.month - b.month);

    // Prepare data for Excel
    const excelData = sortedAssignments.map((assignment) => ({
      Month: getMonthName(assignment.month),
      Year: assignment.year,
      'Meeting Date': format(assignment.assigned_month.toDate(), 'MMMM do, yyyy'),
      'Day of Week': format(assignment.assigned_month.toDate(), 'EEEE'),
      'Host Name': assignment.member_name,
      'Member ID': assignment.member_id,
      Status: assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1),
      Notes: assignment.notes || '',
      'Created Date': format(assignment.created_at.toDate(), 'MMM do, yyyy'),
      'Last Modified': assignment.updated_at
        ? format(assignment.updated_at.toDate(), 'MMM do, yyyy')
        : 'Never'
    }));

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const columnWidths = [
      { wch: 12 }, // Month
      { wch: 6 },  // Year
      { wch: 18 }, // Meeting Date
      { wch: 12 }, // Day of Week
      { wch: 20 }, // Host Name
      { wch: 12 }, // Member ID
      { wch: 10 }, // Status
      { wch: 30 }, // Notes
      { wch: 15 }, // Created Date
      { wch: 15 }, // Last Modified
    ];
    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, `${schedule.year} Host Schedule`);

    // Add summary sheet
    const summaryData = [
      { Property: 'Year', Value: schedule.year },
      { Property: 'Total Assignments', Value: schedule.assignments.length },
      { Property: 'Generated Date', Value: format(schedule.generated_at.toDate(), 'MMM do, yyyy HH:mm') },
      { Property: 'Last Modified', Value: format(schedule.last_modified.toDate(), 'MMM do, yyyy HH:mm') },
      { Property: 'Status', Value: schedule.is_finalized ? 'Finalized' : 'Draft' },
      { Property: '', Value: '' },
      { Property: 'Status Breakdown', Value: '' },
      ...getStatusBreakdown(schedule.assignments)
    ];

    const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData);
    summaryWorksheet['!cols'] = [{ wch: 20 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Summary');

    // Generate and download the file
    const fileName = `Host_Schedule_${schedule.year}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  } catch (error) {
    logger.error('Error exporting to Excel:', error);
    throw new Error('Failed to export to Excel');
  }
};

export const exportHostScheduleToPDF = (schedule: HostSchedule): void => {
  try {
    const doc = new jsPDF();

    // Set up document
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(`${schedule.year} Host Assignment Schedule`, pageWidth / 2, 20, { align: 'center' });

    // Subtitle
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Social Society Meeting Host Schedule', pageWidth / 2, 30, { align: 'center' });

    // Schedule info
    doc.setFontSize(10);
    const scheduleInfo = [
      `Generated: ${format(schedule.generated_at.toDate(), 'MMM do, yyyy HH:mm')}`,
      `Last Modified: ${format(schedule.last_modified.toDate(), 'MMM do, yyyy HH:mm')}`,
      `Status: ${schedule.is_finalized ? 'Finalized' : 'Draft'}`,
      `Total Assignments: ${schedule.assignments.length}`
    ];

    scheduleInfo.forEach((info, index) => {
      doc.text(info, margin, 45 + (index * 6));
    });

    // Sort assignments by month
    const sortedAssignments = [...schedule.assignments].sort((a, b) => a.month - b.month);

    // Prepare table data
    const tableData = sortedAssignments.map((assignment) => [
      getMonthName(assignment.month),
      format(assignment.assigned_month.toDate(), 'MMM do'),
      format(assignment.assigned_month.toDate(), 'EEEE'),
      assignment.member_name,
      assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1),
      assignment.notes || '-'
    ]);

    // Add table
    autoTable(doc, {
      head: [['Month', 'Date', 'Day', 'Host', 'Status', 'Notes']],
      body: tableData,
      startY: 75,
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: 255,
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 25 }, // Month
        1: { cellWidth: 25 }, // Date
        2: { cellWidth: 25 }, // Day
        3: { cellWidth: 40 }, // Host
        4: { cellWidth: 25 }, // Status
        5: { cellWidth: 40 }, // Notes
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      margin: { left: margin, right: margin },
    });

    // Add status breakdown on a new page if there's room, otherwise current page
    const finalY = (doc as any).lastAutoTable.finalY || 150;

    if (finalY > 250) {
      doc.addPage();
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Status Summary', margin, 30);
    } else {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Status Summary', margin, finalY + 20);
    }

    // Status breakdown table
    const statusBreakdown = getStatusBreakdown(schedule.assignments);
    const statusTableData = statusBreakdown.map(item => [item.Property, item.Value.toString()]);

    autoTable(doc, {
      body: statusTableData,
      startY: finalY > 250 ? 40 : finalY + 30,
      styles: {
        fontSize: 10,
        cellPadding: 4,
      },
      columnStyles: {
        0: { cellWidth: 60, fontStyle: 'bold' },
        1: { cellWidth: 30 },
      },
      margin: { left: margin, right: margin },
      theme: 'plain',
    });

    // Footer
    const pageCount = (doc as any).internal.pages.length - 1; // Subtract 1 for the internal counter page
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Generated on ${format(new Date(), 'MMM do, yyyy HH:mm')} | Page ${i} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    // Save the PDF
    const fileName = `Host_Schedule_${schedule.year}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    doc.save(fileName);
  } catch (error) {
    logger.error('Error exporting to PDF:', error);
    throw new Error('Failed to export to PDF');
  }
};

// Helper functions
function getMonthName(monthNumber: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[monthNumber - 1];
}

function getStatusBreakdown(assignments: any[]): { Property: string; Value: number | string }[] {
  const statusCounts = assignments.reduce((acc, assignment) => {
    acc[assignment.status] = (acc[assignment.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return [
    { Property: 'Pending', Value: statusCounts.pending || 0 },
    { Property: 'Confirmed', Value: statusCounts.confirmed || 0 },
    { Property: 'Completed', Value: statusCounts.completed || 0 },
    { Property: 'Missed', Value: statusCounts.missed || 0 },
  ];
}