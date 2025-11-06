import React from 'react';

export interface MetricsData {
  approvedMembers: number;
  activeMembers: number;
  totalContributions: number;
  avgContribution: number;
  totalPayouts: number;
  totalExpenses: number;
  pendingClaims: number;
  fundBalance: number;
}

interface AnalyticsMetricsCardsProps {
  metrics: MetricsData;
}

const AnalyticsMetricsCards = React.memo<AnalyticsMetricsCardsProps>(({ metrics }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Members</h3>
        <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
          {metrics.approvedMembers}
        </p>
        <p className="mt-1 text-sm text-green-600 dark:text-green-400">
          {metrics.activeMembers} active
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Total Contributions
        </h3>
        <p className="mt-2 text-3xl font-semibold text-green-600 dark:text-green-400">
          R {metrics.totalContributions.toFixed(0)}
        </p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Avg: R {metrics.avgContribution.toFixed(0)} per contribution
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Payouts</h3>
        <p className="mt-2 text-3xl font-semibold text-red-600 dark:text-red-400">
          R {(metrics.totalPayouts + metrics.totalExpenses).toFixed(0)}
        </p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Claims: R {metrics.totalPayouts.toFixed(0)} | Expenses: R{' '}
          {metrics.totalExpenses.toFixed(0)}
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Fund Balance</h3>
        <p
          className={`mt-2 text-3xl font-semibold ${
            metrics.fundBalance >= 0
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          }`}
        >
          R {metrics.fundBalance.toFixed(0)}
        </p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {metrics.pendingClaims} pending claims
        </p>
      </div>
    </div>
  );
});

AnalyticsMetricsCards.displayName = 'AnalyticsMetricsCards';

export default AnalyticsMetricsCards;
