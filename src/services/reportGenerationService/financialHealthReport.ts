/**
 * Financial health report (PDF / Excel / CSV)
 */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import type { FinancialHealthScore } from '../../types/predictiveAnalytics';
import type { ReportParams } from './types';
import { addPdfHeader, addPdfFooter, addPdfSection, lastTableY } from './pdfHelpers';

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

  const metricsData = Object.entries(data.metrics).map(([, metric]) => [
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

  yPos = lastTableY(doc) + 10;

  // Metric Details
  if (yPos > 200) {
    doc.addPage();
    yPos = 20;
    addPdfFooter(doc, doc.getNumberOfPages() - 1);
  }

  yPos = addPdfSection(doc, 'Detailed Metric Analysis', yPos);

  Object.entries(data.metrics).forEach(([, metric]) => {
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

    yPos = lastTableY(doc) + 10;
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
    ...Object.entries(data.metrics).map(([, metric]) => [
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
    ...Object.entries(data.metrics).map(([, metric]) => [
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

