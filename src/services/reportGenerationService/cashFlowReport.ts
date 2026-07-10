/**
 * Cash flow forecast report (PDF / Excel / CSV)
 */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import type { CashFlowForecast } from '../../types/predictiveAnalytics';
import type { ReportParams } from './types';
import { addPdfHeader, addPdfFooter, addPdfSection, addPdfMetric, lastTableY } from './pdfHelpers';

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

    yPos = lastTableY(doc) + 10;
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

    yPos = lastTableY(doc) + 10;
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

