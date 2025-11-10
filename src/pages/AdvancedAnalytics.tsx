import React, { useState, useCallback } from 'react';
import { usePredictiveAnalytics } from '../hooks/usePredictiveAnalytics';
import CashFlowForecast from '../components/analytics/CashFlowForecast';
import ChurnPredictionDashboard from '../components/analytics/ChurnPredictionDashboard';
import FinancialHealthScore from '../components/analytics/FinancialHealthScore';
import ContributionPatterns from '../components/analytics/ContributionPatterns';
import ComparativeAnalysis from '../components/analytics/ComparativeAnalysis';
import CustomReportBuilder from '../components/analytics/CustomReportBuilder';
import { useNavigate } from 'react-router-dom';
import { generateReport, ReportParams, collectArrearsData } from '../services/reportGenerationService';

type TabId = 'overview' | 'cash-flow' | 'churn' | 'health' | 'patterns' | 'comparative' | 'reports';

interface Tab {
  id: TabId;
  name: string;
  icon: string;
}

const TABS: Tab[] = [
  { id: 'overview', name: 'Overview', icon: '📊' },
  { id: 'cash-flow', name: 'Cash Flow', icon: '💰' },
  { id: 'churn', name: 'Churn Risk', icon: '⚠️' },
  { id: 'health', name: 'Financial Health', icon: '💚' },
  { id: 'patterns', name: 'Patterns', icon: '📈' },
  { id: 'comparative', name: 'Compare', icon: '⚖️' },
  { id: 'reports', name: 'Reports', icon: '📄' },
];

const AdvancedAnalytics = React.memo(() => {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [forecastMonths, setForecastMonths] = useState(6);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const navigate = useNavigate();

  const {
    cashFlowForecast,
    churnAnalysis,
    financialHealth,
    contributionPatterns,
    comparativeAnalysis,
    members,
    contributions,
    isLoadingCashFlow,
    isLoadingChurn,
    isLoadingHealth,
    isLoadingPatterns,
    isLoadingComparative,
    isLoadingBaseData,
    cashFlowError,
    churnError,
    healthError,
    patternsError,
    comparativeError,
    refreshCashFlowForecast,
    refreshAll,
  } = usePredictiveAnalytics();

  const handleForecastMonthsChange = useCallback(
    (months: number) => {
      setForecastMonths(months);
      refreshCashFlowForecast(months);
    },
    [refreshCashFlowForecast]
  );

  const handleMemberClick = useCallback(
    (memberId: string) => {
      navigate(`/members/${memberId}`);
    },
    [navigate]
  );

  const handleGenerateReport = useCallback(async (params: ReportParams) => {
    setIsGeneratingReport(true);

    try {
      // Prepare report data based on report type
      const reportData: any = {};

      switch (params.reportType) {
        case 'cash-flow':
          if (!cashFlowForecast) {
            throw new Error('Cash flow forecast data is not available. Please wait for data to load.');
          }
          reportData.cashFlowForecast = cashFlowForecast;
          break;

        case 'patterns':
          if (!contributionPatterns) {
            throw new Error('Contribution patterns data is not available. Please wait for data to load.');
          }
          reportData.contributionPatterns = contributionPatterns;
          break;

        case 'health':
          if (!financialHealth) {
            throw new Error('Financial health data is not available. Please wait for data to load.');
          }
          reportData.financialHealth = financialHealth;
          break;

        case 'arrears':
          if (members.length === 0 || contributions.length === 0) {
            throw new Error('Member and contribution data is not available. Please wait for data to load.');
          }
          // Collect arrears data on demand
          reportData.arrears = await collectArrearsData(members, contributions);
          break;

        case 'churn':
        case 'comparative':
        case 'custom':
          throw new Error(`Report type "${params.reportType}" is not yet implemented. Currently Cash Flow, Contribution Patterns, Financial Health, and Arrears reports are available.`);

        default:
          throw new Error(`Unknown report type: ${params.reportType}`);
      }

      // Generate the report
      await generateReport(params, reportData);

    } catch (error) {
      console.error('Error generating report:', error);
      alert(error instanceof Error ? error.message : 'Failed to generate report. Please try again.');
    } finally {
      setIsGeneratingReport(false);
    }
  }, [cashFlowForecast, contributionPatterns, financialHealth, members, contributions]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border-l-4 border-blue-500">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Cash Flow Trend
                </h3>
                <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                  {cashFlowForecast?.summary.trend === 'increasing' ? '↗' :
                   cashFlowForecast?.summary.trend === 'decreasing' ? '↘' : '→'}
                  {' '}
                  {cashFlowForecast?.summary.trendPercentage?.toFixed(1) ?? '-'}%
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 capitalize">
                  {cashFlowForecast?.summary.trend || 'Loading...'}
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border-l-4 border-red-500">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  At-Risk Members
                </h3>
                <p className="mt-2 text-2xl font-semibold text-red-600 dark:text-red-400">
                  {churnAnalysis?.atRiskMembers?.length ?? '-'}
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {churnAnalysis && churnAnalysis.totalMembers > 0 
                    ? ((churnAnalysis.atRiskMembers?.length / churnAnalysis.totalMembers) * 100).toFixed(1)
                    : '-'}% of total
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border-l-4 border-green-500">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Financial Health
                </h3>
                <p className={`mt-2 text-2xl font-semibold ${
                  financialHealth?.overallScore && financialHealth.overallScore >= 80
                    ? 'text-green-600 dark:text-green-400'
                    : financialHealth?.overallScore && financialHealth.overallScore >= 60
                    ? 'text-blue-600 dark:text-blue-400'
                    : financialHealth?.overallScore && financialHealth.overallScore >= 40
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {financialHealth?.overallScore?.toFixed(0) ?? '-'}/100
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 capitalize">
                  {financialHealth?.status || 'Loading...'}
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border-l-4 border-purple-500">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Projected Balance
                </h3>
                <p className={`mt-2 text-2xl font-semibold ${
                  cashFlowForecast?.summary.projectedBalance !== undefined && cashFlowForecast.summary.projectedBalance >= 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  R {cashFlowForecast?.summary.projectedBalance?.toFixed(0) ?? '-'}
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  In {forecastMonths} months
                </p>
              </div>
            </div>

            {/* Quick Insights */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Key Insights
              </h2>
              <div className="space-y-3">
                {cashFlowError && (
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-800 dark:text-red-300">
                      Cash Flow: {cashFlowError}
                    </p>
                  </div>
                )}
                {churnError && (
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-800 dark:text-red-300">
                      Churn Analysis: {churnError}
                    </p>
                  </div>
                )}
                {healthError && (
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-800 dark:text-red-300">
                      Financial Health: {healthError}
                    </p>
                  </div>
                )}

                {!cashFlowError && !churnError && !healthError && (
                  <>
                    {churnAnalysis?.atRiskMembers?.slice(0, 3).flatMap(member => 
                      member.recommendations?.slice(0, 1) || []
                    ).map((rec: string, index: number) => (
                      <div key={index} className="flex items-start bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
                        <span className="text-blue-600 dark:text-blue-400 mr-2">•</span>
                        <p className="text-sm text-blue-800 dark:text-blue-300">{rec}</p>
                      </div>
                    ))}
                    {financialHealth?.recommendations?.slice(0, 2).map((rec: string, index: number) => (
                      <div key={index} className="flex items-start bg-green-50 dark:bg-green-900/20 p-3 rounded-md">
                        <span className="text-green-600 dark:text-green-400 mr-2">•</span>
                        <p className="text-sm text-green-800 dark:text-green-300">{rec}</p>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('cash-flow')}
                  className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-left"
                >
                  <div className="text-2xl mb-2">💰</div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">View Cash Flow</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Forecast future cash flow
                  </p>
                </button>
                <button
                  onClick={() => setActiveTab('churn')}
                  className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-left"
                >
                  <div className="text-2xl mb-2">⚠️</div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Check Churn Risk</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Identify at-risk members
                  </p>
                </button>
                <button
                  onClick={() => setActiveTab('reports')}
                  className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors text-left"
                >
                  <div className="text-2xl mb-2">📄</div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Generate Report</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Create custom analytics report
                  </p>
                </button>
              </div>
            </div>
          </div>
        );

      case 'cash-flow':
        return (
          <CashFlowForecast
            forecast={cashFlowForecast!}
            forecastMonths={forecastMonths}
            onForecastMonthsChange={handleForecastMonthsChange}
            isLoading={isLoadingCashFlow}
          />
        );

      case 'churn':
        return (
          <ChurnPredictionDashboard
            churnAnalysis={churnAnalysis!}
            isLoading={isLoadingChurn}
            onMemberClick={handleMemberClick}
          />
        );

      case 'health':
        return (
          <FinancialHealthScore
            healthScore={financialHealth!}
            isLoading={isLoadingHealth}
          />
        );

      case 'patterns':
        return (
          <ContributionPatterns
            patterns={contributionPatterns!}
            isLoading={isLoadingPatterns}
          />
        );

      case 'comparative':
        return (
          <ComparativeAnalysis
            analysis={comparativeAnalysis!}
            isLoading={isLoadingComparative}
          />
        );

      case 'reports':
        return (
          <CustomReportBuilder
            onGenerateReport={handleGenerateReport}
            isGenerating={isGeneratingReport}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Advanced Analytics
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Predictive insights and comprehensive financial analysis
        </p>
      </div>

      {/* Loading Overlay */}
      {isLoadingBaseData && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 mb-6">
          <div className="flex items-center">
            <svg
              className="animate-spin h-5 w-5 text-blue-600 dark:text-blue-400 mr-3"
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
            <span className="text-blue-800 dark:text-blue-300">
              Loading analytics data...
            </span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex -mb-px overflow-x-auto" aria-label="Tabs">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div>{renderTabContent()}</div>

      {/* Refresh Button */}
      <div className="fixed bottom-6 right-6">
        <button
          onClick={refreshAll}
          disabled={isLoadingBaseData}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-full shadow-lg transition-all flex items-center"
          title="Refresh all analytics"
        >
          <svg
            className={`w-5 h-5 ${isLoadingBaseData ? 'animate-spin' : ''}`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span className="ml-2">Refresh</span>
        </button>
      </div>
    </div>
  );
});

AdvancedAnalytics.displayName = 'AdvancedAnalytics';

export default AdvancedAnalytics;
