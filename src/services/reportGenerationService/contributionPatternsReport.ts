/**
 * Contribution patterns report (PDF / Excel / CSV)
 */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import type { ContributionPatternAnalysis } from '../../types/predictiveAnalytics';
import type { ReportParams } from './types';
import { addPdfHeader, addPdfFooter, addPdfSection, lastTableY } from './pdfHelpers';

// ==================== CONTRIBUTION PATTERNS REPORT - PDF ====================

export async function generateContributionPatternsPdfReport(
  data: ContributionPatternAnalysis,
  params: ReportParams
): Promise<void> {
  const doc = new jsPDF();
  let yPos = 40;

  // Header
  addPdfHeader(
    doc,
    'Contribution Patterns Report',
    `Period: ${format(params.dateRange.start, 'dd MMM yyyy')} - ${format(
      params.dateRange.end,
      'dd MMM yyyy'
    )}`
  );

  // Summary Section
  if (params.includeMetrics) {
    yPos = addPdfSection(doc, 'Overview', yPos);

    doc.setFontSize(10);
    doc.setTextColor(55, 65, 81);
    doc.text(`Total Patterns Identified: ${data.patterns.length}`, 14, yPos);
    yPos += 6;
    doc.text(`Members Analyzed: ${data.memberConsistency.length}`, 14, yPos);
    yPos += 6;
    doc.text(`Peak Periods: ${data.peakPeriods.length}`, 14, yPos);
    yPos += 15;
  }

  // Seasonal Trends Table
  if (data.seasonalTrends && data.seasonalTrends.length > 0) {
    yPos = addPdfSection(doc, 'Monthly Contribution Trends', yPos);

    const seasonalTableData = data.seasonalTrends.map((trend) => [
      trend.month,
      trend.count.toString(),
      `R${Math.round(trend.averageAmount).toLocaleString('en-ZA')}`,
      `${trend.percentageOfAnnual.toFixed(1)}%`,
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Month', 'Count', 'Avg Amount', '% of Annual']],
      body: seasonalTableData,
      theme: 'grid',
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [55, 65, 81],
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
      margin: { left: 14, right: 14 },
    });

    yPos = lastTableY(doc) + 10;
  }

  // Peak Periods
  if (data.peakPeriods && data.peakPeriods.length > 0) {
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
      addPdfFooter(doc, doc.getNumberOfPages() - 1);
    }

    yPos = addPdfSection(doc, 'Peak Contribution Periods', yPos);

    data.peakPeriods.forEach((period, index) => {
      doc.setFontSize(9);
      doc.setTextColor(55, 65, 81);
      doc.text(`${index + 1}. ${period.period}`, 14, yPos);
      yPos += 5;
      if (period.reason) {
        doc.setFontSize(8);
        doc.setTextColor(107, 114, 128);
        doc.text(`   ${period.reason}`, 14, yPos);
        yPos += 5;
      }
    });

    yPos += 10;
  }

  // Payment Timing Patterns
  const dayPattern = data.patterns.find((p) => p.type === 'day-of-month');
  if (dayPattern) {
    if (yPos > 220) {
      doc.addPage();
      yPos = 20;
      addPdfFooter(doc, doc.getNumberOfPages() - 1);
    }

    yPos = addPdfSection(doc, 'Payment Timing Patterns', yPos);

    doc.setFontSize(10);
    doc.setTextColor(55, 65, 81);
    doc.text(dayPattern.name, 14, yPos);
    yPos += 8;

    const earlyCount = dayPattern.data['Early (1-7)'] as number || 0;
    const lateCount = dayPattern.data['Late (8+)'] as number || 0;
    const total = earlyCount + lateCount;

    const tableData = [
      ['Early (1st - 7th)', earlyCount.toString(), `${total > 0 ? ((earlyCount / total) * 100).toFixed(1) : 0}%`],
      ['Late (8th onwards)', lateCount.toString(), `${total > 0 ? ((lateCount / total) * 100).toFixed(1) : 0}%`],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['Period', 'Count', 'Percentage']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [55, 65, 81],
      },
      margin: { left: 14, right: 14 },
      tableWidth: 100,
    });

    yPos = lastTableY(doc) + 10;
  }

  // Top Consistent Members
  if (data.memberConsistency && data.memberConsistency.length > 0) {
    if (yPos > 180) {
      doc.addPage();
      yPos = 20;
      addPdfFooter(doc, doc.getNumberOfPages() - 1);
    }

    yPos = addPdfSection(doc, 'Top 10 Most Consistent Members', yPos);

    const topMembers = data.memberConsistency.slice(0, 10).map((member) => [
      member.memberName,
      member.consistencyScore.toFixed(1),
      `R${Math.round(member.averageAmount).toLocaleString('en-ZA')}`,
      member.paymentFrequency,
      member.preferredDay ? member.preferredDay.toString() : '-',
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Member Name', 'Score', 'Avg Amount', 'Frequency', 'Pref. Day']],
      body: topMembers,
      theme: 'grid',
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [55, 65, 81],
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
      margin: { left: 14, right: 14 },
    });

    yPos = lastTableY(doc) + 10;
  }

  // Insights
  if (params.includeRecommendations && data.insights && data.insights.length > 0) {
    if (yPos > 220) {
      doc.addPage();
      yPos = 20;
      addPdfFooter(doc, doc.getNumberOfPages() - 1);
    }

    yPos = addPdfSection(doc, 'Key Insights', yPos);

    doc.setFontSize(9);
    doc.setTextColor(55, 65, 81);

    data.insights.forEach((insight, index) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
        addPdfFooter(doc, doc.getNumberOfPages() - 1);
      }

      const bulletPoint = `${index + 1}. `;
      const lines = doc.splitTextToSize(insight, 175);

      doc.text(bulletPoint, 14, yPos);
      doc.text(lines, 20, yPos);
      yPos += lines.length * 5;
    });
  }

  // Add footer to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addPdfFooter(doc, i);
  }

  // Save the PDF
  doc.save(
    `contribution-patterns-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`
  );
}

// ==================== CONTRIBUTION PATTERNS REPORT - EXCEL ====================

export async function generateContributionPatternsExcelReport(
  data: ContributionPatternAnalysis,
  params: ReportParams
): Promise<void> {
  const workbook = XLSX.utils.book_new();

  // Summary Sheet
  const summaryData = [
    ['Contribution Patterns Report'],
    ['Generated on', format(new Date(), 'dd MMM yyyy HH:mm')],
    ['Period', `${format(params.dateRange.start, 'dd MMM yyyy')} - ${format(params.dateRange.end, 'dd MMM yyyy')}`],
    [],
    ['Overview'],
    ['Total Patterns Identified', data.patterns.length],
    ['Members Analyzed', data.memberConsistency.length],
    ['Peak Periods', data.peakPeriods.length],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 30 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  // Seasonal Trends Sheet
  if (data.seasonalTrends && data.seasonalTrends.length > 0) {
    const seasonalData = [
      ['Monthly Contribution Trends'],
      ['Month', 'Count', 'Average Amount', 'Percentage of Annual'],
      ...data.seasonalTrends.map((trend) => [
        trend.month,
        trend.count,
        Math.round(trend.averageAmount),
        trend.percentageOfAnnual,
      ]),
    ];

    const seasonalSheet = XLSX.utils.aoa_to_sheet(seasonalData);
    seasonalSheet['!cols'] = [{ wch: 15 }, { wch: 10 }, { wch: 18 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(workbook, seasonalSheet, 'Seasonal Trends');
  }

  // Payment Timing Sheet
  const dayPattern = data.patterns.find((p) => p.type === 'day-of-month');
  if (dayPattern) {
    const earlyCount = dayPattern.data['Early (1-7)'] as number || 0;
    const lateCount = dayPattern.data['Late (8+)'] as number || 0;
    const total = earlyCount + lateCount;

    const timingData = [
      ['Payment Timing Patterns'],
      ['Period', 'Count', 'Percentage'],
      ['Early (1st - 7th)', earlyCount, total > 0 ? (earlyCount / total) * 100 : 0],
      ['Late (8th onwards)', lateCount, total > 0 ? (lateCount / total) * 100 : 0],
    ];

    const timingSheet = XLSX.utils.aoa_to_sheet(timingData);
    timingSheet['!cols'] = [{ wch: 20 }, { wch: 10 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(workbook, timingSheet, 'Payment Timing');
  }

  // Member Consistency Sheet
  if (data.memberConsistency && data.memberConsistency.length > 0) {
    const memberData = [
      ['Member Consistency Analysis'],
      ['Member Name', 'Consistency Score', 'Average Amount', 'Std Deviation', 'Payment Frequency', 'Preferred Day', 'Preferred Method'],
      ...data.memberConsistency.map((member) => [
        member.memberName,
        member.consistencyScore,
        Math.round(member.averageAmount),
        member.standardDeviation,
        member.paymentFrequency,
        member.preferredDay || 'N/A',
        member.preferredMethod || 'N/A',
      ]),
    ];

    const memberSheet = XLSX.utils.aoa_to_sheet(memberData);
    memberSheet['!cols'] = [
      { wch: 25 },
      { wch: 18 },
      { wch: 15 },
      { wch: 15 },
      { wch: 18 },
      { wch: 15 },
      { wch: 18 },
    ];
    XLSX.utils.book_append_sheet(workbook, memberSheet, 'Member Consistency');
  }

  // Insights Sheet
  if (params.includeRecommendations && data.insights && data.insights.length > 0) {
    const insightsData = [
      ['Key Insights'],
      [],
      ...data.insights.map((insight, index) => [`${index + 1}. ${insight}`]),
    ];

    const insightsSheet = XLSX.utils.aoa_to_sheet(insightsData);
    insightsSheet['!cols'] = [{ wch: 100 }];
    XLSX.utils.book_append_sheet(workbook, insightsSheet, 'Insights');
  }

  // Peak Periods Sheet
  if (data.peakPeriods && data.peakPeriods.length > 0) {
    const peakData = [
      ['Peak Contribution Periods'],
      ['Period', 'Reason'],
      ...data.peakPeriods.map((period) => [
        period.period,
        period.reason || 'N/A',
      ]),
    ];

    const peakSheet = XLSX.utils.aoa_to_sheet(peakData);
    peakSheet['!cols'] = [{ wch: 20 }, { wch: 50 }];
    XLSX.utils.book_append_sheet(workbook, peakSheet, 'Peak Periods');
  }

  // Write the file
  XLSX.writeFile(
    workbook,
    `contribution-patterns-${format(new Date(), 'yyyy-MM-dd-HHmm')}.xlsx`
  );
}

// ==================== CONTRIBUTION PATTERNS REPORT - CSV ====================

export async function generateContributionPatternsCsvReport(
  data: ContributionPatternAnalysis,
  params: ReportParams
): Promise<void> {
  const csvData = [
    ['Contribution Patterns Report'],
    ['Generated on', format(new Date(), 'dd MMM yyyy HH:mm')],
    ['Period', `${format(params.dateRange.start, 'dd MMM yyyy')} - ${format(params.dateRange.end, 'dd MMM yyyy')}`],
    [],
    ['Overview'],
    ['Total Patterns', data.patterns.length],
    ['Members Analyzed', data.memberConsistency.length],
    [],
    ['Monthly Contribution Trends'],
    ['Month', 'Count', 'Average Amount', 'Percentage of Annual'],
    ...(data.seasonalTrends || []).map((trend) => [
      trend.month,
      trend.count,
      Math.round(trend.averageAmount),
      trend.percentageOfAnnual.toFixed(1),
    ]),
    [],
    ['Top Consistent Members'],
    ['Member Name', 'Consistency Score', 'Average Amount', 'Payment Frequency'],
    ...(data.memberConsistency || []).slice(0, 20).map((member) => [
      member.memberName,
      member.consistencyScore.toFixed(1),
      Math.round(member.averageAmount),
      member.paymentFrequency,
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
    `contribution-patterns-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`
  );
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

