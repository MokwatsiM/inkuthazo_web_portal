/**
 * Report Generation Service
 * Handles PDF, Excel, and CSV report generation for analytics data.
 * Split by report type; this index re-exports the full public API.
 */
import type { ReportParams, ReportData } from './types';
import { generateCashFlowPdfReport, generateCashFlowExcelReport, generateCashFlowCsvReport } from './cashFlowReport';
import { generateContributionPatternsPdfReport, generateContributionPatternsExcelReport, generateContributionPatternsCsvReport } from './contributionPatternsReport';
import { generateFinancialHealthPdfReport, generateFinancialHealthExcelReport, generateFinancialHealthCsvReport } from './financialHealthReport';
import { generateArrearsPdfReport, generateArrearsExcelReport, generateArrearsCsvReport } from './arrearsReport';
import { generateComparativeAnalysisPDF, generateComparativeAnalysisExcel, generateComparativeAnalysisCSV } from './comparativeAnalysisReport';

export * from './types';
export * from './cashFlowReport';
export * from './contributionPatternsReport';
export * from './financialHealthReport';
export * from './arrearsReport';
export * from './comparativeAnalysisReport';

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
    case 'comparative':
      if (!data.comparativeAnalysis) {
        throw new Error('Comparative analysis data is required for this report type');
      }
      if (params.format === 'pdf') {
        generateComparativeAnalysisPDF(data.comparativeAnalysis, params.periodDescription);
      } else if (params.format === 'excel') {
        generateComparativeAnalysisExcel(data.comparativeAnalysis, params.periodDescription);
      } else if (params.format === 'csv') {
        generateComparativeAnalysisCSV(data.comparativeAnalysis, params.periodDescription);
      }
      break;

    case 'churn':
    case 'custom':
      throw new Error(`Report type "${params.reportType}" is not yet implemented`);

    default:
      throw new Error(`Unknown report type: ${params.reportType}`);
  }
}

