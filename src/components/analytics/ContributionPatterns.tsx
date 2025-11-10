import React, { useMemo, useState } from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsivePie } from '@nivo/pie';
import { ContributionPatternAnalysis } from '../../types/predictiveAnalytics';

interface ContributionPatternsProps {
  patterns: ContributionPatternAnalysis | null;
  isLoading?: boolean;
}

const ContributionPatterns = React.memo<ContributionPatternsProps>(({ patterns, isLoading = false }) => {
  const [selectedView, setSelectedView] = useState<'seasonal' | 'dayOfMonth' | 'paymentMethod' | 'consistency'>('seasonal');

  const seasonalData = useMemo(() => {
    if (!patterns?.seasonalTrends) return [];
    return patterns.seasonalTrends.map((trend) => ({
      month: trend.month,
      count: trend.count,
      amount: Math.round(trend.averageAmount),
    }));
  }, [patterns]);

  const dayOfMonthData = useMemo(() => {
    if (!patterns?.patterns) return [];
    const dayPattern = patterns.patterns.find(p => p.type === 'day-of-month');
    if (!dayPattern) return [];

    // Service provides data as 'Early (1-7)' and 'Late (8+)'
    const earlyCount = dayPattern.data['Early (1-7)'] as number || 0;
    const lateCount = dayPattern.data['Late (8+)'] as number || 0;

    const total = earlyCount + lateCount;

    return [
      {
        category: 'Early (1st - 7th)',
        count: earlyCount,
        percentage: total > 0 ? (earlyCount / total) * 100 : 0,
      },
      {
        category: 'Late (8th onwards)',
        count: lateCount,
        percentage: total > 0 ? (lateCount / total) * 100 : 0,
      },
    ];
  }, [patterns]);

  const paymentMethodData = useMemo(() => {
    if (!patterns?.patterns) return [];
    const methodPattern = patterns.patterns.find(p => p.type === 'payment-method');
    if (!methodPattern) return [];
    const total = Object.values(methodPattern.data).reduce((a, b) => a + (b as number), 0);
    return Object.entries(methodPattern.data).map(([method, count]) => ({
      id: method,
      label: method,
      value: count as number,
      percentage: ((count as number) / total) * 100,
    }));
  }, [patterns]);

  const topConsistentMembers = useMemo(() => {
    if (!patterns?.memberConsistency) return [];
    return [...patterns.memberConsistency]
      .sort((a, b) => b.consistencyScore - a.consistencyScore)
      .slice(0, 10);
  }, [patterns]);

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

  if (!patterns) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <p className="text-gray-500 dark:text-gray-400">No contribution pattern data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with View Selector */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Contribution Pattern Analysis
        </h2>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedView('seasonal')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedView === 'seasonal'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Seasonal Patterns
          </button>
          <button
            onClick={() => setSelectedView('dayOfMonth')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedView === 'dayOfMonth'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Day Preferences
          </button>
          <button
            onClick={() => setSelectedView('paymentMethod')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedView === 'paymentMethod'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Payment Methods
          </button>
          <button
            onClick={() => setSelectedView('consistency')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedView === 'consistency'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Member Consistency
          </button>
        </div>
      </div>

      {/* Seasonal Patterns View */}
      {selectedView === 'seasonal' && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Monthly Contribution Patterns
          </h3>
          <div className="h-96">
            <ResponsiveBar
              data={seasonalData}
              keys={['count', 'amount']}
              indexBy="month"
              margin={{ top: 20, right: 130, bottom: 60, left: 80 }}
              padding={0.3}
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
                legend: 'Month',
                legendPosition: 'middle',
                legendOffset: 50,
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'Value',
                legendPosition: 'middle',
                legendOffset: -60,
                format: (value) => Math.round(value).toString(),
              }}
              labelSkipWidth={12}
              labelSkipHeight={12}
              labelTextColor="#ffffff"
              valueFormat={(value) => Math.round(value).toString()}
              tooltip={({ id, value, color, indexValue }) => (
                <div
                  style={{
                    padding: '9px 12px',
                    background: 'white',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                    <div
                      style={{
                        width: '12px',
                        height: '12px',
                        backgroundColor: color,
                        marginRight: '8px',
                      }}
                    />
                    <strong>{indexValue}</strong>
                  </div>
                  <div style={{ fontSize: '14px' }}>
                    <strong>{id === 'count' ? 'Count' : 'Amount'}:</strong>{' '}
                    {id === 'amount' ? `R${Math.round(value)}` : Math.round(value)}
                  </div>
                </div>
              )}
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

          {patterns.insights && patterns.insights.length > 0 && (
            <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md border border-blue-200 dark:border-blue-800">
              <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
                Key Insights
              </h4>
              <ul className="space-y-1">
                {patterns.insights.map((insight, index) => (
                  <li key={index} className="text-sm text-blue-800 dark:text-blue-300 flex items-start">
                    <span className="mr-2">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Day of Month Preferences View */}
      {selectedView === 'dayOfMonth' && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Payment Timing Preferences
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Contributions are categorized into Early (1st-7th of the month) and Late (8th onwards)
          </p>

          <div className="h-96">
            <ResponsiveBar
              data={dayOfMonthData}
              keys={['count']}
              indexBy="category"
              margin={{ top: 20, right: 80, bottom: 80, left: 80 }}
              padding={0.3}
              valueScale={{ type: 'linear' }}
              indexScale={{ type: 'band', round: true }}
              colors={['#8b5cf6']}
              borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
              axisTop={null}
              axisRight={null}
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'Payment Period',
                legendPosition: 'middle',
                legendOffset: 50,
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'Number of Contributions',
                legendPosition: 'middle',
                legendOffset: -60,
              }}
              labelSkipWidth={12}
              labelSkipHeight={12}
              labelTextColor="#ffffff"
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

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {dayOfMonthData.map((pref) => (
              <div
                key={pref.category}
                className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg border border-purple-200 dark:border-purple-800"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="text-lg font-semibold text-purple-900 dark:text-purple-300">
                    {pref.category}
                  </div>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {pref.percentage.toFixed(1)}%
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-purple-700 dark:text-purple-400">Total Contributions:</span>
                    <span className="font-semibold text-purple-900 dark:text-purple-300">{pref.count}</span>
                  </div>
                  <div className="w-full bg-purple-200 dark:bg-purple-900/40 rounded-full h-2">
                    <div
                      className="bg-purple-600 dark:bg-purple-500 h-2 rounded-full transition-all"
                      style={{ width: `${pref.percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment Method Preferences View */}
      {selectedView === 'paymentMethod' && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Payment Method Distribution
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64">
              <ResponsivePie
                data={paymentMethodData}
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                innerRadius={0.5}
                padAngle={0.7}
                cornerRadius={3}
                activeOuterRadiusOffset={8}
                colors={['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444']}
                borderWidth={1}
                borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                arcLinkLabelsSkipAngle={10}
                arcLinkLabelsTextColor="#374151"
                arcLinkLabelsThickness={2}
                arcLinkLabelsColor={{ from: 'color' }}
                arcLabelsSkipAngle={10}
                arcLabelsTextColor="#ffffff"
              />
            </div>

            <div className="space-y-3">
              <h4 className="text-md font-semibold text-gray-900 dark:text-white">Breakdown</h4>
              {paymentMethodData.map((method, index) => (
                <div
                  key={method.id}
                  className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-md"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded"
                      style={{
                        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'][index % 5],
                      }}
                    ></div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {method.label}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {method.value}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {method.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Member Consistency View */}
      {selectedView === 'consistency' && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Top Consistent Members
          </h3>
          {topConsistentMembers.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 dark:text-gray-500 mb-2">
                <svg
                  className="mx-auto h-12 w-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <p className="text-gray-500 dark:text-gray-400">
                No member consistency data available
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Members need at least 3 contributions to be analyzed
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {topConsistentMembers.map((member, index) => (
                <div
                  key={member.memberId}
                  className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {member.memberName}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Avg: R{member.averageAmount.toFixed(0)} • {member.paymentFrequency}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                      {member.consistencyScore.toFixed(0)}%
                    </div>
                    <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-1">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${member.consistencyScore}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

ContributionPatterns.displayName = 'ContributionPatterns';

export default ContributionPatterns;
