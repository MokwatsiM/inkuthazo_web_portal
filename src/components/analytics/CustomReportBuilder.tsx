import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  defaultParams: ReportParams;
}

interface ReportParams {
  reportType: 'cash-flow' | 'churn' | 'health' | 'patterns' | 'comparative' | 'custom';
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

interface CustomReportBuilderProps {
  onGenerateReport: (params: ReportParams) => void;
  isGenerating?: boolean;
}

const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'monthly-summary',
    name: 'Monthly Summary',
    description: 'Comprehensive monthly financial and operational summary',
    defaultParams: {
      reportType: 'custom',
      dateRange: {
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        end: new Date(),
      },
      includeCharts: true,
      includeMetrics: true,
      includeRecommendations: true,
      format: 'pdf',
      customMetrics: ['contributions', 'payouts', 'members', 'balance'],
    },
  },
  {
    id: 'cash-flow-forecast',
    name: 'Cash Flow Forecast',
    description: '6-month cash flow projection with scenarios',
    defaultParams: {
      reportType: 'cash-flow',
      dateRange: {
        start: new Date(new Date().setMonth(new Date().getMonth() - 6)),
        end: new Date(),
      },
      includeCharts: true,
      includeMetrics: true,
      includeRecommendations: true,
      format: 'pdf',
    },
  },
  {
    id: 'member-churn',
    name: 'Member Churn Analysis',
    description: 'Member retention and churn risk analysis',
    defaultParams: {
      reportType: 'churn',
      dateRange: {
        start: new Date(new Date().setMonth(new Date().getMonth() - 3)),
        end: new Date(),
      },
      includeCharts: true,
      includeMetrics: true,
      includeRecommendations: true,
      format: 'pdf',
    },
  },
  {
    id: 'financial-health',
    name: 'Financial Health Report',
    description: 'Overall financial health assessment',
    defaultParams: {
      reportType: 'health',
      dateRange: {
        start: new Date(new Date().setMonth(new Date().getMonth() - 12)),
        end: new Date(),
      },
      includeCharts: true,
      includeMetrics: true,
      includeRecommendations: true,
      format: 'pdf',
    },
  },
  {
    id: 'contribution-patterns',
    name: 'Contribution Patterns',
    description: 'Analyze member contribution patterns and trends',
    defaultParams: {
      reportType: 'patterns',
      dateRange: {
        start: new Date(new Date().setMonth(new Date().getMonth() - 12)),
        end: new Date(),
      },
      includeCharts: true,
      includeMetrics: true,
      includeRecommendations: false,
      format: 'excel',
    },
  },
  {
    id: 'period-comparison',
    name: 'Period Comparison',
    description: 'Compare two time periods side-by-side',
    defaultParams: {
      reportType: 'comparative',
      dateRange: {
        start: new Date(new Date().setMonth(new Date().getMonth() - 3)),
        end: new Date(),
      },
      includeCharts: true,
      includeMetrics: true,
      includeRecommendations: true,
      format: 'pdf',
    },
  },
  {
    id: 'members-arrears',
    name: 'Members in Arrears',
    description: 'List all members with outstanding payments',
    defaultParams: {
      reportType: 'arrears',
      dateRange: {
        start: new Date(new Date().getFullYear(), 0, 1), // Start of year
        end: new Date(),
      },
      includeCharts: false,
      includeMetrics: true,
      includeRecommendations: false,
      format: 'pdf',
    },
  },
];

const CustomReportBuilder = React.memo<CustomReportBuilderProps>(({
  onGenerateReport,
  isGenerating = false,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [reportParams, setReportParams] = useState<ReportParams>({
    reportType: 'custom',
    dateRange: {
      start: new Date(new Date().setMonth(new Date().getMonth() - 1)),
      end: new Date(),
    },
    includeCharts: true,
    includeMetrics: true,
    includeRecommendations: true,
    format: 'pdf',
  });

  const selectedTemplateData = useMemo(() => {
    if (!selectedTemplate) return null;
    return REPORT_TEMPLATES.find((t) => t.id === selectedTemplate);
  }, [selectedTemplate]);

  const handleTemplateSelect = (templateId: string) => {
    const template = REPORT_TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setReportParams(template.defaultParams);
    }
  };

  const handleParamChange = <K extends keyof ReportParams>(
    key: K,
    value: ReportParams[K]
  ) => {
    setReportParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleDateChange = (type: 'start' | 'end', value: string) => {
    setReportParams((prev) => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [type]: new Date(value),
      },
    }));
  };

  const handleGenerate = () => {
    onGenerateReport(reportParams);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Custom Report Builder
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Select a template or customize your own report
        </p>
      </div>

      {/* Templates */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Report Templates
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {REPORT_TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => handleTemplateSelect(template.id)}
              className={`text-left p-4 rounded-lg border-2 transition-all ${
                selectedTemplate === template.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                {template.name}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {template.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Report Configuration */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Report Configuration
        </h3>

        <div className="space-y-6">
          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Report Type
            </label>
            <select
              value={reportParams.reportType}
              onChange={(e) =>
                handleParamChange('reportType', e.target.value as ReportParams['reportType'])
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="custom">Custom Report</option>
              <option value="cash-flow">Cash Flow Forecast</option>
              <option value="churn">Churn Analysis</option>
              <option value="health">Financial Health</option>
              <option value="patterns">Contribution Patterns</option>
              <option value="comparative">Comparative Analysis</option>
              <option value="arrears">Members in Arrears</option>
            </select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={format(reportParams.dateRange.start, 'yyyy-MM-dd')}
                onChange={(e) => handleDateChange('start', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={format(reportParams.dateRange.end, 'yyyy-MM-dd')}
                onChange={(e) => handleDateChange('end', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Report Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Include in Report
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={reportParams.includeCharts}
                  onChange={(e) => handleParamChange('includeCharts', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Charts and Visualizations
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={reportParams.includeMetrics}
                  onChange={(e) => handleParamChange('includeMetrics', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Detailed Metrics
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={reportParams.includeRecommendations}
                  onChange={(e) => handleParamChange('includeRecommendations', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Recommendations and Insights
                </span>
              </label>
            </div>
          </div>

          {/* Export Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Export Format
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => handleParamChange('format', 'pdf')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  reportParams.format === 'pdf'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                PDF
              </button>
              <button
                onClick={() => handleParamChange('format', 'excel')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  reportParams.format === 'excel'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Excel
              </button>
              <button
                onClick={() => handleParamChange('format', 'csv')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  reportParams.format === 'csv'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview & Generate */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Report Preview
        </h3>

        {selectedTemplateData && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 mb-4">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <span className="font-semibold">Template:</span> {selectedTemplateData.name}
            </p>
          </div>
        )}

        <div className="space-y-3 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Report Type:</span>
            <span className="font-medium text-gray-900 dark:text-white capitalize">
              {reportParams.reportType.replace('-', ' ')}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Period:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {format(reportParams.dateRange.start, 'dd MMM yyyy')} -{' '}
              {format(reportParams.dateRange.end, 'dd MMM yyyy')}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Format:</span>
            <span className="font-medium text-gray-900 dark:text-white uppercase">
              {reportParams.format}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Includes:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {[
                reportParams.includeCharts && 'Charts',
                reportParams.includeMetrics && 'Metrics',
                reportParams.includeRecommendations && 'Recommendations',
              ]
                .filter(Boolean)
                .join(', ')}
            </span>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-md transition-colors flex items-center justify-center"
        >
          {isGenerating ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Generating Report...
            </>
          ) : (
            'Generate Report'
          )}
        </button>
      </div>

      {/* Info Box */}
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          <span className="font-semibold">Note:</span> Reports are generated based on current data
          and may take a few moments to compile. PDF reports include full visualizations, while
          Excel and CSV formats focus on raw data for further analysis.
        </p>
      </div>
    </div>
  );
});

CustomReportBuilder.displayName = 'CustomReportBuilder';

export default CustomReportBuilder;
