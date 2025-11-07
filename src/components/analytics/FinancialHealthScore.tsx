import React, { useMemo } from 'react';
import { ResponsivePie } from '@nivo/pie';
import { FinancialHealthScore as FinancialHealthScoreType } from '../../types/predictiveAnalytics';

interface FinancialHealthScoreProps {
  healthScore: FinancialHealthScoreType | null;
  isLoading?: boolean;
}

const FinancialHealthScore = React.memo<FinancialHealthScoreProps>(({ healthScore, isLoading = false }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'text-green-600 dark:text-green-400';
      case 'good':
        return 'text-blue-600 dark:text-blue-400';
      case 'fair':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'poor':
        return 'text-orange-600 dark:text-orange-400';
      case 'critical':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'good':
        return 'bg-blue-100 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'fair':
        return 'bg-yellow-100 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'poor':
        return 'bg-orange-100 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
      case 'critical':
        return 'bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      default:
        return 'bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-700';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981'; // green
    if (score >= 60) return '#3b82f6'; // blue
    if (score >= 40) return '#f59e0b'; // yellow
    if (score >= 20) return '#f97316'; // orange
    return '#ef4444'; // red
  };

  const gaugeData = useMemo(() => {
    if (!healthScore) return [];

    const score = healthScore.overallScore;
    return [
      {
        id: 'score',
        label: 'Score',
        value: score,
        color: getScoreColor(score),
      },
      {
        id: 'remaining',
        label: 'Remaining',
        value: 100 - score,
        color: '#e5e7eb',
      },
    ];
  }, [healthScore]);

  const metricsArray = useMemo(() => {
    if (!healthScore) return [];
    return Object.entries(healthScore.metrics).map(([key, metric]) => ({
      key,
      ...metric,
    }));
  }, [healthScore]);

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

  if (!healthScore) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <p className="text-gray-500 dark:text-gray-400">No financial health data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Score Card */}
      <div className={`p-6 rounded-lg shadow border ${getStatusBgColor(healthScore.status)}`}>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Financial Health Score
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Gauge Chart */}
          <div className="flex flex-col items-center justify-center">
            <div className="h-48 w-48 relative">
              <ResponsivePie
                data={gaugeData}
                margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                startAngle={-90}
                endAngle={90}
                innerRadius={0.7}
                padAngle={0}
                cornerRadius={0}
                colors={{ datum: 'data.color' }}
                enableArcLabels={false}
                enableArcLinkLabels={false}
                isInteractive={false}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center mt-12">
                <div className={`text-5xl font-bold ${getStatusColor(healthScore.status)}`}>
                  {healthScore.overallScore.toFixed(0)}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">out of 100</div>
              </div>
            </div>
            <div className={`mt-4 text-lg font-semibold capitalize ${getStatusColor(healthScore.status)}`}>
              {healthScore.status}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Quick Overview
            </h3>
            {metricsArray.slice(0, 3).map((metric) => (
              <div key={metric.key} className="flex justify-between items-center">
                <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                  {metric.name}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${metric.score}%`,
                        backgroundColor: getScoreColor(metric.score),
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium w-12 text-right">
                    {metric.score.toFixed(0)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Detailed Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {metricsArray.map((metric) => (
            <div
              key={metric.key}
              className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600"
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {metric.name}
                </h4>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Weight: {metric.weight}%
                </span>
              </div>

              <div className="mb-2">
                <div className="flex items-baseline gap-2">
                  <span
                    className="text-2xl font-bold"
                    style={{ color: getScoreColor(metric.score) }}
                  >
                    {metric.score.toFixed(0)}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">/100</span>
                </div>
              </div>

              <div className="mb-2">
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${metric.score}%`,
                      backgroundColor: getScoreColor(metric.score),
                    }}
                  ></div>
                </div>
              </div>

              <div className="text-xs text-gray-600 dark:text-gray-400">
                <div className="flex justify-between">
                  <span>Value:</span>
                  <span className="font-medium">{metric.value.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="font-medium capitalize">{metric.status}</span>
                </div>
              </div>

              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">{metric.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Alerts */}
      {healthScore.alerts && healthScore.alerts.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg border border-red-200 dark:border-red-800">
          <h3 className="text-lg font-semibold text-red-900 dark:text-red-300 mb-3">
            Critical Alerts
          </h3>
          <div className="space-y-2">
            {healthScore.alerts.map((alert, index) => (
              <div
                key={index}
                className="flex items-start bg-white dark:bg-red-900/10 p-3 rounded-md"
              >
                <span className="text-red-600 dark:text-red-400 mr-2 font-bold">!</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-semibold uppercase px-2 py-1 rounded ${
                        alert.severity === 'high'
                          ? 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200'
                          : alert.severity === 'medium'
                          ? 'bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200'
                          : 'bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200'
                      }`}
                    >
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-red-800 dark:text-red-300 mt-1">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {healthScore.recommendations && healthScore.recommendations.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-3">
            Recommendations to Improve Health
          </h3>
          <ul className="space-y-2">
            {healthScore.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start">
                <span className="text-blue-600 dark:text-blue-400 mr-2">•</span>
                <span className="text-blue-800 dark:text-blue-300">{recommendation}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
});

FinancialHealthScore.displayName = 'FinancialHealthScore';

export default FinancialHealthScore;
