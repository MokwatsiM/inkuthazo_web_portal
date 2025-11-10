/**
 * Report Generation Service
 * Handles PDF, Excel, and CSV report generation for analytics data
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import type { CashFlowForecast, ContributionPatternAnalysis, FinancialHealthScore } from '../types/predictiveAnalytics';

// ==================== TYPES ====================

export interface ReportParams {
  reportType: 'cash-flow' | 'churn' | 'health' | 'patterns' | 'comparative' | 'arrears' | 'custom';
  dateRange: {
    start: Date;
    end: Date;
  };
  includeCharts: boolean;
  includeMetrics: boolean;
  includeRecommendations: boolean;
  format: 'pdf' | 'excel' | 'csv';
  customMetrics?: string[];
}

export interface MemberArrears {
  memberId: string;
  memberName: string;
  email: string;
  phoneNumber: string;
  joinDate: Date;
  lastPaymentDate: Date | null;
  monthsOwed: number;
  totalAmountOwed: number;
  unpaidMonths: {
    month: string;
    amount: number;
  }[];
}

export interface ArrearsReportData {
  members: MemberArrears[];
  totalMembersInArrears: number;
  totalAmountOwed: number;
  averageAmountOwed: number;
  generatedAt: Date;
}

export interface ReportData {
  cashFlowForecast?: CashFlowForecast | null;
  contributionPatterns?: ContributionPatternAnalysis | null;
  financialHealth?: FinancialHealthScore | null;
  arrears?: ArrearsReportData | null;
  // Additional report data types will be added as we implement more reports
}

// ==================== PDF GENERATION HELPERS ====================

const addPdfHeader = (doc: jsPDF, title: string, subtitle?: string) => {
  doc.setFontSize(20);
  doc.setTextColor(30, 58, 138); // Blue-900
  doc.text(title, 14, 20);

  if (subtitle) {
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128); // Gray-500
    doc.text(subtitle, 14, 27);
  }

  // Add horizontal line
  doc.setDrawColor(229, 231, 235); // Gray-200
  doc.setLineWidth(0.5);
  doc.line(14, 32, 196, 32);
};

const addPdfFooter = (doc: jsPDF, pageNumber: number) => {
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175); // Gray-400
  doc.text(
    `Generated on ${format(new Date(), 'dd MMM yyyy HH:mm')}`,
    14,
    pageHeight - 10
  );
  doc.text(`Page ${pageNumber}`, 196, pageHeight - 10, { align: 'right' });
};

const addPdfSection = (doc: jsPDF, title: string, yPos: number): number => {
  doc.setFontSize(14);
  doc.setTextColor(17, 24, 39); // Gray-900
  doc.text(title, 14, yPos);
  return yPos + 7;
};

const addPdfMetric = (
  doc: jsPDF,
  label: string,
  value: string,
  xPos: number,
  yPos: number
): void => {
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128); // Gray-500
  doc.text(label, xPos, yPos);

  doc.setFontSize(12);
  doc.setTextColor(17, 24, 39); // Gray-900
  doc.text(value, xPos, yPos + 5);
};

// ==================== CASH FLOW REPORT - PDF ====================

export async function generateCashFlowPdfReport(
  data: CashFlowForecast,
  params: ReportParams
): Promise<void> {
  const doc = new jsPDF();
  let yPos = 40;

  // Header
  addPdfHeader(
    doc,
    'Cash Flow Forecast Report',
    `Period: ${format(params.dateRange.start, 'dd MMM yyyy')} - ${format(
      params.dateRange.end,
      'dd MMM yyyy'
    )}`
  );

  // Summary Section
  if (params.includeMetrics) {
    yPos = addPdfSection(doc, 'Executive Summary', yPos);

    // Average Monthly Inflow
    addPdfMetric(
      doc,
      'Average Monthly Inflow',
      `R${data.summary.averageMonthlyInflow.toLocaleString('en-ZA', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      14,
      yPos
    );

    // Average Monthly Outflow
    addPdfMetric(
      doc,
      'Average Monthly Outflow',
      `R${data.summary.averageMonthlyOutflow.toLocaleString('en-ZA', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      70,
      yPos
    );

    // Projected Balance
    addPdfMetric(
      doc,
      `Projected Balance (${data.forecastPeriodMonths} months)`,
      `R${data.summary.projectedBalance.toLocaleString('en-ZA', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      126,
      yPos
    );

    yPos += 15;

    // Trend
    const trendColor = data.summary.trend === 'increasing' ? [34, 197, 94] : data.summary.trend === 'decreasing' ? [239, 68, 68] : [251, 191, 36];
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    doc.text('Trend', 14, yPos);
    doc.setFontSize(12);
    doc.setTextColor(trendColor[0], trendColor[1], trendColor[2]);
    doc.text(
      `${data.summary.trend.toUpperCase()} (${data.summary.trendPercentage.toFixed(1)}%)`,
      14,
      yPos + 5
    );

    yPos += 15;

    // Scenarios
    yPos = addPdfSection(doc, 'Scenarios', yPos);

    addPdfMetric(
      doc,
      'Best Case',
      `R${data.scenarios.bestCase.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`,
      14,
      yPos
    );

    addPdfMetric(
      doc,
      'Expected',
      `R${data.scenarios.expected.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`,
      70,
      yPos
    );

    addPdfMetric(
      doc,
      'Worst Case',
      `R${data.scenarios.worstCase.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`,
      126,
      yPos
    );

    yPos += 20;
  }

  // Historical Data Table
  if (data.historical && data.historical.length > 0) {
    yPos = addPdfSection(doc, 'Historical Cash Flow', yPos);

    const historicalTableData = data.historical.slice(-6).map((item) => [
      item.month,
      item.actual !== undefined ? `R${item.actual.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}` : 'N/A',
      `${item.confidence.toFixed(0)}%`,
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Month', 'Net Flow', 'Confidence']],
      body: historicalTableData,
      theme: 'grid',
      headStyles: {
        fillColor: [59, 130, 246], // Blue-500
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [55, 65, 81],
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251], // Gray-50
      },
      margin: { left: 14, right: 14 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Forecast Data Table
  if (data.forecasted && data.forecasted.length > 0) {
    // Check if we need a new page
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
      addPdfFooter(doc, 1);
    }

    yPos = addPdfSection(doc, 'Cash Flow Forecast', yPos);

    const forecastTableData = data.forecasted.map((item) => [
      item.month,
      `R${item.forecast.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`,
      `R${item.lowerBound.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`,
      `R${item.upperBound.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`,
      `${item.confidence.toFixed(0)}%`,
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Month', 'Forecast', 'Lower Bound', 'Upper Bound', 'Confidence']],
      body: forecastTableData,
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

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Add note about forecast period
  if (yPos > 260) {
    doc.addPage();
    yPos = 20;
    addPdfFooter(doc, doc.getNumberOfPages() - 1);
  }

  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text(
    `Forecast generated for ${data.forecastPeriodMonths} months ahead based on historical data patterns.`,
    14,
    yPos
  );
  yPos += 5;
  doc.text(
    'Confidence levels indicate the reliability of predictions based on data quality and consistency.',
    14,
    yPos
  );

  // Add footer to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addPdfFooter(doc, i);
  }

  // Save the PDF
  doc.save(
    `cash-flow-forecast-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`
  );
}

// ==================== CASH FLOW REPORT - EXCEL ====================

export async function generateCashFlowExcelReport(
  data: CashFlowForecast,
  params: ReportParams
): Promise<void> {
  const workbook = XLSX.utils.book_new();

  // Summary Sheet
  const summaryData = [
    ['Cash Flow Forecast Report'],
    ['Generated on', format(new Date(), 'dd MMM yyyy HH:mm')],
    ['Period', `${format(params.dateRange.start, 'dd MMM yyyy')} - ${format(params.dateRange.end, 'dd MMM yyyy')}`],
    ['Forecast Period', `${data.forecastPeriodMonths} months`],
    [],
    ['Executive Summary'],
    ['Average Monthly Inflow', data.summary.averageMonthlyInflow],
    ['Average Monthly Outflow', data.summary.averageMonthlyOutflow],
    ['Projected Balance', data.summary.projectedBalance],
    ['Trend', data.summary.trend],
    ['Trend Percentage', `${data.summary.trendPercentage}%`],
    [],
    ['Scenarios'],
    ['Best Case', data.scenarios.bestCase],
    ['Expected', data.scenarios.expected],
    ['Worst Case', data.scenarios.worstCase],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);

  // Set column widths
  summarySheet['!cols'] = [{ wch: 30 }, { wch: 20 }];

  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  // Historical Data Sheet
  if (data.historical && data.historical.length > 0) {
    const historicalData = [
      ['Historical Cash Flow'],
      ['Month', 'Net Flow', 'Confidence'],
      ...data.historical.map((item) => [
        item.month,
        item.actual !== undefined ? item.actual : item.forecast,
        item.confidence,
      ]),
    ];

    const historicalSheet = XLSX.utils.aoa_to_sheet(historicalData);
    historicalSheet['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 15 }];

    XLSX.utils.book_append_sheet(workbook, historicalSheet, 'Historical Data');
  }

  // Forecast Data Sheet
  if (data.forecasted && data.forecasted.length > 0) {
    const forecastData = [
      ['Cash Flow Forecast'],
      ['Month', 'Forecast', 'Lower Bound', 'Upper Bound', 'Confidence Level'],
      ...data.forecasted.map((item) => [
        item.month,
        item.forecast,
        item.lowerBound,
        item.upperBound,
        item.confidence,
      ]),
    ];

    const forecastSheet = XLSX.utils.aoa_to_sheet(forecastData);
    forecastSheet['!cols'] = [
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
    ];

    XLSX.utils.book_append_sheet(workbook, forecastSheet, 'Forecast Data');
  }

  // Write the file
  XLSX.writeFile(
    workbook,
    `cash-flow-forecast-${format(new Date(), 'yyyy-MM-dd-HHmm')}.xlsx`
  );
}

// ==================== CASH FLOW REPORT - CSV ====================

export async function generateCashFlowCsvReport(
  data: CashFlowForecast,
  params: ReportParams
): Promise<void> {
  // For CSV, we'll create a simple combined view
  const csvData = [
    ['Cash Flow Forecast Report'],
    ['Generated on', format(new Date(), 'dd MMM yyyy HH:mm')],
    ['Period', `${format(params.dateRange.start, 'dd MMM yyyy')} - ${format(params.dateRange.end, 'dd MMM yyyy')}`],
    ['Forecast Period', `${data.forecastPeriodMonths} months`],
    [],
    ['Summary'],
    ['Average Monthly Inflow', data.summary.averageMonthlyInflow],
    ['Average Monthly Outflow', data.summary.averageMonthlyOutflow],
    ['Projected Balance', data.summary.projectedBalance],
    ['Trend', data.summary.trend],
    ['Trend Percentage', `${data.summary.trendPercentage}%`],
    [],
    ['Historical Data'],
    ['Month', 'Net Flow', 'Confidence'],
    ...(data.historical || []).map((item) => [
      item.month,
      item.actual !== undefined ? item.actual : item.forecast,
      item.confidence,
    ]),
    [],
    ['Forecast Data'],
    ['Month', 'Forecast', 'Lower Bound', 'Upper Bound', 'Confidence'],
    ...(data.forecasted || []).map((item) => [
      item.month,
      item.forecast,
      item.lowerBound,
      item.upperBound,
      item.confidence,
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
    `cash-flow-forecast-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`
  );
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

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

    yPos = (doc as any).lastAutoTable.finalY + 10;
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

    yPos = (doc as any).lastAutoTable.finalY + 10;
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

    yPos = (doc as any).lastAutoTable.finalY + 10;
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

// ==================== FINANCIAL HEALTH REPORT - PDF ====================

export async function generateFinancialHealthPdfReport(
  data: FinancialHealthScore,
  params: ReportParams
): Promise<void> {
  const doc = new jsPDF();
  let yPos = 40;

  // Header
  addPdfHeader(
    doc,
    'Financial Health Report',
    `Period: ${format(params.dateRange.start, 'dd MMM yyyy')} - ${format(
      params.dateRange.end,
      'dd MMM yyyy'
    )}`
  );

  // Overall Health Score Section
  if (params.includeMetrics) {
    yPos = addPdfSection(doc, 'Overall Health Assessment', yPos);

    // Overall Score with color coding
    const statusColors = {
      excellent: [34, 197, 94],   // Green
      good: [59, 130, 246],        // Blue
      fair: [251, 191, 36],        // Yellow
      poor: [239, 68, 68],         // Red
      critical: [127, 29, 29],     // Dark Red
    };

    const color = statusColors[data.status];

    doc.setFontSize(14);
    doc.setTextColor(55, 65, 81);
    doc.text('Overall Score:', 14, yPos);

    doc.setFontSize(24);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(`${data.overallScore.toFixed(1)}`, 60, yPos);

    doc.setFontSize(12);
    doc.text(`(${data.status.toUpperCase()})`, 85, yPos);

    yPos += 15;

    // Alerts Section
    if (data.alerts && data.alerts.length > 0) {
      yPos = addPdfSection(doc, 'Alerts', yPos);

      data.alerts.forEach((alert) => {
        const alertColor = alert.severity === 'high' ? [239, 68, 68] :
                          alert.severity === 'medium' ? [251, 191, 36] :
                          [59, 130, 246];

        doc.setFillColor(alertColor[0], alertColor[1], alertColor[2]);
        doc.circle(16, yPos - 2, 2, 'F');

        doc.setFontSize(9);
        doc.setTextColor(55, 65, 81);
        const lines = doc.splitTextToSize(alert.message, 170);
        doc.text(lines, 20, yPos);
        yPos += lines.length * 5 + 2;
      });

      yPos += 5;
    }
  }

  // Health Metrics Table
  yPos = addPdfSection(doc, 'Key Health Metrics', yPos);

  const metricsData = Object.entries(data.metrics).map(([key, metric]) => [
    metric.name,
    metric.value.toFixed(2),
    metric.score.toFixed(1),
    `${metric.weight}%`,
    metric.status.toUpperCase(),
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Metric', 'Value', 'Score', 'Weight', 'Status']],
    body: metricsData,
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

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Metric Details
  if (yPos > 200) {
    doc.addPage();
    yPos = 20;
    addPdfFooter(doc, doc.getNumberOfPages() - 1);
  }

  yPos = addPdfSection(doc, 'Detailed Metric Analysis', yPos);

  Object.entries(data.metrics).forEach(([key, metric]) => {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
      addPdfFooter(doc, doc.getNumberOfPages() - 1);
    }

    doc.setFontSize(10);
    doc.setTextColor(55, 65, 81);
    doc.setFont('helvetica', 'bold');
    doc.text(metric.name, 14, yPos);
    doc.setFont('helvetica', 'normal');
    yPos += 6;

    doc.setFontSize(9);
    doc.setTextColor(75, 85, 99);
    const descLines = doc.splitTextToSize(metric.description, 180);
    doc.text(descLines, 14, yPos);
    yPos += descLines.length * 5 + 2;

    if (metric.recommendation) {
      doc.setFontSize(8);
      doc.setTextColor(59, 130, 246);
      doc.text('Recommendation: ', 14, yPos);
      doc.setTextColor(75, 85, 99);
      const recLines = doc.splitTextToSize(metric.recommendation, 170);
      doc.text(recLines, 45, yPos);
      yPos += recLines.length * 4 + 2;
    }

    yPos += 5;
  });

  // Historical Trend
  if (data.historicalScores && data.historicalScores.length > 0) {
    if (yPos > 180) {
      doc.addPage();
      yPos = 20;
      addPdfFooter(doc, doc.getNumberOfPages() - 1);
    }

    yPos = addPdfSection(doc, 'Historical Health Trend', yPos);

    const trendData = data.historicalScores.slice(-12).map((item) => [
      item.month,
      item.score.toFixed(1),
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Month', 'Health Score']],
      body: trendData,
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
      tableWidth: 100,
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Recommendations
  if (params.includeRecommendations && data.recommendations && data.recommendations.length > 0) {
    if (yPos > 220) {
      doc.addPage();
      yPos = 20;
      addPdfFooter(doc, doc.getNumberOfPages() - 1);
    }

    yPos = addPdfSection(doc, 'Recommendations', yPos);

    doc.setFontSize(9);
    doc.setTextColor(55, 65, 81);

    data.recommendations.forEach((rec, index) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
        addPdfFooter(doc, doc.getNumberOfPages() - 1);
      }

      const bulletPoint = `${index + 1}. `;
      const lines = doc.splitTextToSize(rec, 175);

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
    `financial-health-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`
  );
}

// ==================== FINANCIAL HEALTH REPORT - EXCEL ====================

export async function generateFinancialHealthExcelReport(
  data: FinancialHealthScore,
  params: ReportParams
): Promise<void> {
  const workbook = XLSX.utils.book_new();

  // Summary Sheet
  const summaryData = [
    ['Financial Health Report'],
    ['Generated on', format(new Date(), 'dd MMM yyyy HH:mm')],
    ['Period', `${format(params.dateRange.start, 'dd MMM yyyy')} - ${format(params.dateRange.end, 'dd MMM yyyy')}`],
    [],
    ['Overall Health Assessment'],
    ['Overall Score', data.overallScore],
    ['Status', data.status.toUpperCase()],
    [],
    ['Alerts'],
    ['Severity', 'Metric', 'Message'],
    ...(data.alerts || []).map((alert) => [
      alert.severity.toUpperCase(),
      alert.metric,
      alert.message,
    ]),
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 20 }, { wch: 20 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  // Metrics Sheet
  const metricsData = [
    ['Health Metrics'],
    ['Metric', 'Value', 'Score', 'Weight', 'Status', 'Description', 'Recommendation'],
    ...Object.entries(data.metrics).map(([key, metric]) => [
      metric.name,
      metric.value,
      metric.score,
      metric.weight,
      metric.status.toUpperCase(),
      metric.description,
      metric.recommendation || 'N/A',
    ]),
  ];

  const metricsSheet = XLSX.utils.aoa_to_sheet(metricsData);
  metricsSheet['!cols'] = [
    { wch: 25 },
    { wch: 12 },
    { wch: 10 },
    { wch: 10 },
    { wch: 12 },
    { wch: 50 },
    { wch: 50 },
  ];
  XLSX.utils.book_append_sheet(workbook, metricsSheet, 'Metrics');

  // Historical Trend Sheet
  if (data.historicalScores && data.historicalScores.length > 0) {
    const historicalData = [
      ['Historical Health Trend'],
      ['Month', 'Health Score'],
      ...data.historicalScores.map((item) => [
        item.month,
        item.score,
      ]),
    ];

    const historicalSheet = XLSX.utils.aoa_to_sheet(historicalData);
    historicalSheet['!cols'] = [{ wch: 15 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(workbook, historicalSheet, 'Historical Trend');
  }

  // Recommendations Sheet
  if (params.includeRecommendations && data.recommendations && data.recommendations.length > 0) {
    const recommendationsData = [
      ['Recommendations'],
      [],
      ...data.recommendations.map((rec, index) => [`${index + 1}. ${rec}`]),
    ];

    const recommendationsSheet = XLSX.utils.aoa_to_sheet(recommendationsData);
    recommendationsSheet['!cols'] = [{ wch: 100 }];
    XLSX.utils.book_append_sheet(workbook, recommendationsSheet, 'Recommendations');
  }

  // Write the file
  XLSX.writeFile(
    workbook,
    `financial-health-${format(new Date(), 'yyyy-MM-dd-HHmm')}.xlsx`
  );
}

// ==================== FINANCIAL HEALTH REPORT - CSV ====================

export async function generateFinancialHealthCsvReport(
  data: FinancialHealthScore,
  params: ReportParams
): Promise<void> {
  const csvData = [
    ['Financial Health Report'],
    ['Generated on', format(new Date(), 'dd MMM yyyy HH:mm')],
    ['Period', `${format(params.dateRange.start, 'dd MMM yyyy')} - ${format(params.dateRange.end, 'dd MMM yyyy')}`],
    [],
    ['Overall Health'],
    ['Overall Score', data.overallScore],
    ['Status', data.status.toUpperCase()],
    [],
    ['Health Metrics'],
    ['Metric', 'Value', 'Score', 'Weight', 'Status'],
    ...Object.entries(data.metrics).map(([key, metric]) => [
      metric.name,
      metric.value.toFixed(2),
      metric.score.toFixed(1),
      `${metric.weight}%`,
      metric.status.toUpperCase(),
    ]),
    [],
    ['Historical Trend'],
    ['Month', 'Score'],
    ...(data.historicalScores || []).slice(-12).map((item) => [
      item.month,
      item.score.toFixed(1),
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
    `financial-health-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`
  );
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

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

    yPos = (doc as any).lastAutoTable.finalY + 10;

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

        yPos = (doc as any).lastAutoTable.finalY + 2;
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
  params: ReportParams
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
    const detailedData: any[] = [
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
  params: ReportParams
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

// ==================== MAIN REPORT GENERATION ====================

export async function generateReport(
  params: ReportParams,
  data: ReportData
): Promise<void> {
  switch (params.reportType) {
    case 'cash-flow':
      if (!data.cashFlowForecast) {
        throw new Error('Cash flow forecast data is required for this report type');
      }

      if (params.format === 'pdf') {
        await generateCashFlowPdfReport(data.cashFlowForecast, params);
      } else if (params.format === 'excel') {
        await generateCashFlowExcelReport(data.cashFlowForecast, params);
      } else if (params.format === 'csv') {
        await generateCashFlowCsvReport(data.cashFlowForecast, params);
      }
      break;

    case 'patterns':
      if (!data.contributionPatterns) {
        throw new Error('Contribution patterns data is required for this report type');
      }

      if (params.format === 'pdf') {
        await generateContributionPatternsPdfReport(data.contributionPatterns, params);
      } else if (params.format === 'excel') {
        await generateContributionPatternsExcelReport(data.contributionPatterns, params);
      } else if (params.format === 'csv') {
        await generateContributionPatternsCsvReport(data.contributionPatterns, params);
      }
      break;

    case 'health':
      if (!data.financialHealth) {
        throw new Error('Financial health data is required for this report type');
      }

      if (params.format === 'pdf') {
        await generateFinancialHealthPdfReport(data.financialHealth, params);
      } else if (params.format === 'excel') {
        await generateFinancialHealthExcelReport(data.financialHealth, params);
      } else if (params.format === 'csv') {
        await generateFinancialHealthCsvReport(data.financialHealth, params);
      }
      break;

    case 'arrears':
      if (!data.arrears) {
        throw new Error('Arrears data is required for this report type');
      }

      if (params.format === 'pdf') {
        await generateArrearsPdfReport(data.arrears, params);
      } else if (params.format === 'excel') {
        await generateArrearsExcelReport(data.arrears, params);
      } else if (params.format === 'csv') {
        await generateArrearsCsvReport(data.arrears, params);
      }
      break;

    // TODO: Add other report types
    case 'churn':
    case 'comparative':
    case 'custom':
      throw new Error(`Report type "${params.reportType}" is not yet implemented`);

    default:
      throw new Error(`Unknown report type: ${params.reportType}`);
  }
}

// ==================== ARREARS DATA COLLECTION ====================

export async function collectArrearsData(
  members: any[],
  contributions: any[]
): Promise<ArrearsReportData> {
  const { calculateUnpaidMonths } = await import('../utils/invoice/calculator');

  const membersInArrears: MemberArrears[] = [];

  for (const member of members) {
    if (member.status !== 'approved') continue;

    const memberContributions = contributions
      .filter((c: any) => c.member_id === member.id && c.status === 'approved')
      .sort((a: any, b: any) => a.date.toDate().getTime() - b.date.toDate().getTime());

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
            month: month.month,
            amount: month.amount,
          })),
        });
      }
    } catch (error) {
      console.error(`Error calculating arrears for member ${member.id}:`, error);
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
