import React from 'react';

export interface Insight {
  title: string;
  value: string;
  description: string;
  trend: 'positive' | 'negative' | 'warning' | 'neutral';
}

interface AnalyticsKeyInsightsProps {
  insights: Insight[];
}

const AnalyticsKeyInsights = React.memo<AnalyticsKeyInsightsProps>(({ insights }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {insights.map((insight, index) => (
        <div
          key={index}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border-l-4 border-blue-500"
        >
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {insight.title}
          </h3>
          <p
            className={`mt-2 text-2xl font-semibold ${
              insight.trend === 'positive'
                ? 'text-green-600 dark:text-green-400'
                : insight.trend === 'negative'
                ? 'text-red-600 dark:text-red-400'
                : insight.trend === 'warning'
                ? 'text-yellow-600 dark:text-yellow-400'
                : 'text-gray-900 dark:text-white'
            }`}
          >
            {insight.value}
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{insight.description}</p>
        </div>
      ))}
    </div>
  );
});

AnalyticsKeyInsights.displayName = 'AnalyticsKeyInsights';

export default AnalyticsKeyInsights;
