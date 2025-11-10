import React, { useMemo, useState } from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { ComparativeAnalysis as ComparativeAnalysisType } from '../../types/predictiveAnalytics';
import { format, subMonths, startOfMonth, endOfMonth, subDays } from 'date-fns';

interface ComparativeAnalysisProps {
  analysis: ComparativeAnalysisType | null;
  isLoading?: boolean;
  onPeriodChange?: (period1Start: Date, period1End: Date, period2Start: Date, period2End: Date) => void;
}

interface PeriodOption {
  id: string;
  label: string;
  period1Start: Date;
  period1End: Date;
  period2Start: Date;
  period2End: Date;
}

const ComparativeAnalysis = React.memo<ComparativeAnalysisProps>(({
  analysis,
  isLoading = false,
  onPeriodChange,
}) => {
  // Generate period options (all 3-month periods)
  const periodOptions = useMemo<PeriodOption[]>(() => {
    const now = new Date();
    const options: PeriodOption[] = [];

    // Option 1: Last 3 months vs Previous 3 months
    const period2End = endOfMonth(now);
    const period2Start = startOfMonth(subMonths(now, 2));
    const period1End = endOfMonth(subMonths(period2Start, 1));
    const period1Start = startOfMonth(subMonths(period1End, 2));

    options.push({
      id: 'recent-vs-previous',
      label: 'Recent 3 Months vs Previous 3 Months',
      period1Start,
      period1End,
      period2Start,
      period2End,
    });

    // Option 2: This quarter vs Last quarter
    const currentQuarter = Math.floor(now.getMonth() / 3);
    const thisQuarterStart = startOfMonth(new Date(now.getFullYear(), currentQuarter * 3, 1));
    const thisQuarterEnd = endOfMonth(new Date(now.getFullYear(), currentQuarter * 3 + 2, 1));
    const lastQuarterStart = startOfMonth(subMonths(thisQuarterStart, 3));
    const lastQuarterEnd = endOfMonth(subMonths(thisQuarterStart, 1));

    options.push({
      id: 'this-quarter-vs-last',
      label: 'This Quarter vs Last Quarter',
      period1Start: lastQuarterStart,
      period1End: lastQuarterEnd,
      period2Start: thisQuarterStart,
      period2End: thisQuarterEnd,
    });

    // Option 3: Last 90 days vs Previous 90 days
    const last90DaysEnd = now;
    const last90DaysStart = subDays(now, 89);
    const prev90DaysEnd = subDays(last90DaysStart, 1);
    const prev90DaysStart = subDays(prev90DaysEnd, 89);

    options.push({
      id: 'last-90-vs-prev-90',
      label: 'Last 90 Days vs Previous 90 Days',
      period1Start: prev90DaysStart,
      period1End: prev90DaysEnd,
      period2Start: last90DaysStart,
      period2End: last90DaysEnd,
    });

    // Option 4: Same period last year (3 months)
    const sameQuarterLastYearStart = startOfMonth(subMonths(period2Start, 12));
    const sameQuarterLastYearEnd = endOfMonth(subMonths(period2End, 12));

    options.push({
      id: 'this-year-vs-last-year',
      label: 'Recent 3 Months vs Same Period Last Year',
      period1Start: sameQuarterLastYearStart,
      period1End: sameQuarterLastYearEnd,
      period2Start,
      period2End,
    });

    return options;
  }, []);

  const [selectedOptionId, setSelectedOptionId] = useState<string>(periodOptions[0].id);

  const handlePeriodChange = (optionId: string) => {
    setSelectedOptionId(optionId);
    const option = periodOptions.find(opt => opt.id === optionId);
    if (option && onPeriodChange) {
      onPeriodChange(option.period1Start, option.period1End, option.period2Start, option.period2End);
    }
  };

  const comparisonData = useMemo(() => {
    if (!analysis) return [];

    return analysis.comparisons.map((comparison) => ({
      metric: comparison.metric,
      Period1: comparison.period1Value,
      Period2: comparison.period2Value,
    }));
  }, [analysis]);

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600 dark:text-green-400';
    if (change < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return '↗';
    if (change < 0) return '↘';
    return '→';
  };

  const getChangeBadgeColor = (change: number) => {
    if (change > 0) return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800';
    if (change < 0) return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800';
    return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700';
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <p className="text-gray-500 dark:text-gray-400">No comparative analysis data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Select Comparison Periods
        </label>
        <select
          value={selectedOptionId}
          onChange={(e) => handlePeriodChange(e.target.value)}
          className="w-full md:w-auto px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {periodOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          All periods are approximately 3 months (90 days) for accurate comparison
        </p>
      </div>

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Period-over-Period Comparison
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-1">
              Period 1
            </h3>
            <p className="text-lg font-semibold text-blue-900 dark:text-blue-300">
              {format(analysis.period1.startDate, 'dd MMM yyyy')} -{' '}
              {format(analysis.period1.endDate, 'dd MMM yyyy')}
            </p>
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
              {Math.ceil((analysis.period1.endDate.getTime() - analysis.period1.startDate.getTime()) / (1000 * 60 * 60 * 24))} days
            </p>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <h3 className="text-sm font-medium text-green-700 dark:text-green-400 mb-1">
              Period 2
            </h3>
            <p className="text-lg font-semibold text-green-900 dark:text-green-300">
              {format(analysis.period2.startDate, 'dd MMM yyyy')} -{' '}
              {format(analysis.period2.endDate, 'dd MMM yyyy')}
            </p>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              {Math.ceil((analysis.period2.endDate.getTime() - analysis.period2.startDate.getTime()) / (1000 * 60 * 60 * 24))} days
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Comparison */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Key Metrics Comparison
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {analysis.comparisons.map((comparison) => (
            <div
              key={comparison.metric}
              className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600"
            >
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                {comparison.metric}
              </h4>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Period 1</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {comparison.metric.includes('Members') || comparison.metric.includes('Contributors')
                      ? comparison.period1Value.toFixed(0)
                      : `R ${comparison.period1Value.toFixed(0)}`}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Period 2</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {comparison.metric.includes('Members') || comparison.metric.includes('Contributors')
                      ? comparison.period2Value.toFixed(0)
                      : `R ${comparison.period2Value.toFixed(0)}`}
                  </p>
                </div>
              </div>

              <div className={`flex items-center justify-between p-2 rounded border ${getChangeBadgeColor(comparison.percentageChange)}`}>
                <span className="text-sm font-medium">Change</span>
                <span className="font-bold">
                  {getChangeIcon(comparison.percentageChange)} {Math.abs(comparison.percentageChange).toFixed(1)}%
                </span>
              </div>

              <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 capitalize">
                Trend: {comparison.trend}
              </div>
            </div>
          ))}
        </div>

        {/* Comparison Chart */}
        <div className="h-96 mt-6">
          <ResponsiveBar
            data={comparisonData}
            keys={['Period1', 'Period2']}
            indexBy="metric"
            margin={{ top: 20, right: 130, bottom: 120, left: 80 }}
            padding={0.3}
            groupMode="grouped"
            valueScale={{ type: 'linear' }}
            indexScale={{ type: 'band', round: true }}
            colors={['#3b82f6', '#10b981']}
            borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
            axisTop={null}
            axisRight={null}
            axisBottom={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: -45,
              legend: 'Metric',
              legendPosition: 'middle',
              legendOffset: 100,
            }}
            axisLeft={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: 'Value',
              legendPosition: 'middle',
              legendOffset: -60,
            }}
            labelSkipWidth={12}
            labelSkipHeight={12}
            labelTextColor="#ffffff"
            legends={[
              {
                dataFrom: 'keys',
                anchor: 'bottom-right',
                direction: 'column',
                justify: false,
                translateX: 120,
                translateY: 0,
                itemsSpacing: 2,
                itemWidth: 100,
                itemHeight: 20,
                itemDirection: 'left-to-right',
                itemOpacity: 0.85,
                symbolSize: 20,
                effects: [
                  {
                    on: 'hover',
                    style: {
                      itemOpacity: 1,
                    },
                  },
                ],
              },
            ]}
            theme={{
              axis: {
                ticks: {
                  text: {
                    fill: '#6b7280',
                  },
                },
                legend: {
                  text: {
                    fill: '#374151',
                    fontSize: 12,
                    fontWeight: 600,
                  },
                },
              },
            }}
          />
        </div>
      </div>

      {/* Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Improvements */}
        {analysis.highlights.filter(h => h.type === 'improvement').length > 0 && (
          <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800">
            <h3 className="text-lg font-semibold text-green-900 dark:text-green-300 mb-3 flex items-center">
              <span className="mr-2">✓</span> Improvements
            </h3>
            <ul className="space-y-2">
              {analysis.highlights.filter(h => h.type === 'improvement').map((highlight, index: number) => (
                <li key={index} className="text-sm text-green-800 dark:text-green-300 flex items-start">
                  <span className="mr-2">•</span>
                  <span>{highlight.message}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Declines */}
        {analysis.highlights.filter(h => h.type === 'decline').length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg border border-red-200 dark:border-red-800">
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-300 mb-3 flex items-center">
              <span className="mr-2">!</span> Declines
            </h3>
            <ul className="space-y-2">
              {analysis.highlights.filter(h => h.type === 'decline').map((highlight, index) => (
                <li key={index} className="text-sm text-red-800 dark:text-red-300 flex items-start">
                  <span className="mr-2">•</span>
                  <span>{highlight.message}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Notable Achievements */}
        {analysis.highlights.filter(h => h.type === 'achievement').length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-3 flex items-center">
              <span className="mr-2">★</span> Achievements
            </h3>
            <ul className="space-y-2">
              {analysis.highlights.filter(h => h.type === 'achievement').map((highlight, index) => (
                <li key={index} className="text-sm text-blue-800 dark:text-blue-300 flex items-start">
                  <span className="mr-2">•</span>
                  <span>{highlight.message}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg border border-gray-200 dark:border-gray-600">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Summary</h3>
        <p className="text-gray-700 dark:text-gray-300">
          Comparing Period 1 ({format(analysis.period1.startDate, 'dd MMM yyyy')} -{' '}
          {format(analysis.period1.endDate, 'dd MMM yyyy')}) with Period 2 (
          {format(analysis.period2.startDate, 'dd MMM yyyy')} -{' '}
          {format(analysis.period2.endDate, 'dd MMM yyyy')}), the analysis shows{' '}
          {analysis.highlights.filter(h => h.type === 'improvement').length > 0 && (
            <span className="font-semibold text-green-600 dark:text-green-400">
              {analysis.highlights.filter(h => h.type === 'improvement').length} improvement(s)
            </span>
          )}
          {analysis.highlights.filter(h => h.type === 'improvement').length > 0 && analysis.highlights.filter(h => h.type === 'decline').length > 0 && (
            <span> and </span>
          )}
          {analysis.highlights.filter(h => h.type === 'decline').length > 0 && (
            <span className="font-semibold text-red-600 dark:text-red-400">
              {analysis.highlights.filter(h => h.type === 'decline').length} decline(s)
            </span>
          )}
          .
        </p>
      </div>
    </div>
  );
});

ComparativeAnalysis.displayName = 'ComparativeAnalysis';

export default ComparativeAnalysis;
