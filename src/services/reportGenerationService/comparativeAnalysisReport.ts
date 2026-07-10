/**
 * Comparative analysis report (PDF / Excel / CSV)
 */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import type { ComparativeAnalysis } from '../../types/predictiveAnalytics';
import { addPdfHeader, addPdfFooter, addPdfSection, lastTableY } from './pdfHelpers';

// ==================== COMPARATIVE ANALYSIS REPORT GENERATION ====================

export function generateComparativeAnalysisPDF(data: ComparativeAnalysis, periodDescription?: string): void {
  const doc = new jsPDF();
  let yPos = 20;

  // Header
  const subtitle = periodDescription
    ? `${periodDescription} - Generated on ${format(new Date(), 'dd MMM yyyy HH:mm')}`
    : `Generated on ${format(new Date(), 'dd MMM yyyy HH:mm')}`;

  addPdfHeader(
    doc,
    'Period Comparison Report',
    subtitle
  );
  yPos = 35;

  // Period Information
  addPdfSection(doc, 'Comparison Periods', yPos);
  yPos += 10;

  const periodData = [
    ['Period 1', `${format(data.period1.startDate, 'dd MMM yyyy')} - ${format(data.period1.endDate, 'dd MMM yyyy')}`],
    ['Period 2', `${format(data.period2.startDate, 'dd MMM yyyy')} - ${format(data.period2.endDate, 'dd MMM yyyy')}`],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Period', 'Date Range']],
    body: periodData,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
  });

  yPos = lastTableY(doc) + 15;

  // Metrics Comparison
  addPdfSection(doc, 'Metrics Comparison', yPos);
  yPos += 10;

  const metricsData = data.comparisons.map((comparison) => [
    comparison.metric,
    comparison.metric.includes('Members') || comparison.metric.includes('Contributors')
      ? comparison.period1Value.toFixed(0)
      : `R ${comparison.period1Value.toFixed(2)}`,
    comparison.metric.includes('Members') || comparison.metric.includes('Contributors')
      ? comparison.period2Value.toFixed(0)
      : `R ${comparison.period2Value.toFixed(2)}`,
    `${comparison.percentageChange >= 0 ? '+' : ''}${comparison.percentageChange.toFixed(1)}%`,
    comparison.trend,
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Metric', 'Period 1', 'Period 2', 'Change %', 'Trend']],
    body: metricsData,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
    columnStyles: {
      3: {
        cellWidth: 25,
        halign: 'center',
      },
      4: {
        cellWidth: 25,
        halign: 'center',
        textColor: [107, 114, 128], // gray
      },
    },
  });

  yPos = lastTableY(doc) + 15;

  // Check if we need a new page
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  // Highlights Section
  const improvements = data.highlights.filter(h => h.type === 'improvement');
  const declines = data.highlights.filter(h => h.type === 'decline');
  const achievements = data.highlights.filter(h => h.type === 'achievement');

  if (improvements.length > 0) {
    addPdfSection(doc, 'Improvements', yPos);
    yPos += 10;

    const improvementsData = improvements.map(h => [h.message]);
    autoTable(doc, {
      startY: yPos,
      body: improvementsData,
      theme: 'plain',
      styles: { textColor: [16, 185, 129], fontSize: 10 },
      margin: { left: 20 },
    });

    yPos = lastTableY(doc) + 10;
  }

  if (declines.length > 0) {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    addPdfSection(doc, 'Declines', yPos);
    yPos += 10;

    const declinesData = declines.map(h => [h.message]);
    autoTable(doc, {
      startY: yPos,
      body: declinesData,
      theme: 'plain',
      styles: { textColor: [239, 68, 68], fontSize: 10 },
      margin: { left: 20 },
    });

    yPos = lastTableY(doc) + 10;
  }

  if (achievements.length > 0) {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    addPdfSection(doc, 'Achievements', yPos);
    yPos += 10;

    const achievementsData = achievements.map(h => [h.message]);
    autoTable(doc, {
      startY: yPos,
      body: achievementsData,
      theme: 'plain',
      styles: { textColor: [59, 130, 246], fontSize: 10 },
      margin: { left: 20 },
    });
  }

  // Footer on each page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    addPdfFooter(doc, i);
  }

  // Save the PDF
  doc.save(`comparative-analysis-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

export function generateComparativeAnalysisExcel(data: ComparativeAnalysis, periodDescription?: string): void {
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Summary
  const summaryData = [
    ['Period Comparison Report'],
    ...(periodDescription ? [[periodDescription]] : []),
    [`Generated: ${format(new Date(), 'dd MMM yyyy HH:mm')}`],
    [],
    ['Period 1', `${format(data.period1.startDate, 'dd MMM yyyy')} - ${format(data.period1.endDate, 'dd MMM yyyy')}`],
    ['Period 2', `${format(data.period2.startDate, 'dd MMM yyyy')} - ${format(data.period2.endDate, 'dd MMM yyyy')}`],
    [],
    ['Total Improvements', data.highlights.filter(h => h.type === 'improvement').length],
    ['Total Declines', data.highlights.filter(h => h.type === 'decline').length],
    ['Total Achievements', data.highlights.filter(h => h.type === 'achievement').length],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  // Sheet 2: Metrics Comparison
  const metricsData = [
    ['Metric', 'Period 1 Value', 'Period 2 Value', 'Absolute Change', 'Percentage Change', 'Trend'],
    ...data.comparisons.map(c => [
      c.metric,
      c.period1Value,
      c.period2Value,
      c.absoluteChange,
      c.percentageChange / 100, // Excel will format as percentage
      c.trend,
    ]),
  ];

  const metricsSheet = XLSX.utils.aoa_to_sheet(metricsData);
  XLSX.utils.book_append_sheet(workbook, metricsSheet, 'Metrics Comparison');

  // Sheet 3: Highlights
  const highlightsData = [
    ['Type', 'Message'],
    ...data.highlights.map(h => [h.type, h.message]),
  ];

  const highlightsSheet = XLSX.utils.aoa_to_sheet(highlightsData);
  XLSX.utils.book_append_sheet(workbook, highlightsSheet, 'Highlights');

  // Save the workbook
  XLSX.writeFile(workbook, `comparative-analysis-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
}

export function generateComparativeAnalysisCSV(data: ComparativeAnalysis, periodDescription?: string): void {
  const csvData = [
    ['Period Comparison Report'],
    ...(periodDescription ? [[periodDescription]] : []),
    [`Generated: ${format(new Date(), 'dd MMM yyyy HH:mm')}`],
    [],
    ['Period 1', `${format(data.period1.startDate, 'dd MMM yyyy')} - ${format(data.period1.endDate, 'dd MMM yyyy')}`],
    ['Period 2', `${format(data.period2.startDate, 'dd MMM yyyy')} - ${format(data.period2.endDate, 'dd MMM yyyy')}`],
    [],
    ['Metric', 'Period 1', 'Period 2', 'Change %', 'Trend'],
    ...data.comparisons.map(c => [
      c.metric,
      c.period1Value.toFixed(2),
      c.period2Value.toFixed(2),
      `${c.percentageChange.toFixed(1)}%`,
      c.trend,
    ]),
    [],
    ['Highlights'],
    ['Type', 'Message'],
    ...data.highlights.map(h => [h.type, h.message]),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(csvData);
  const csv = XLSX.utils.sheet_to_csv(worksheet);

  // Create blob and download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `comparative-analysis-${format(new Date(), 'yyyy-MM-dd')}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ==================== ARREARS DATA COLLECTION ====================

