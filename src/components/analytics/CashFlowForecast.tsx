import React, { useMemo } from 'react';
import { ResponsiveLine } from '@nivo/line';
import { CashFlowForecast as CashFlowForecastType } from '../../types/predictiveAnalytics';
import { format } from 'date-fns';

interface CashFlowForecastProps {
  forecast: CashFlowForecastType | null;
  forecastMonths: number;
  onForecastMonthsChange: (months: number) => void;
  isLoading?: boolean;
}

const CashFlowForecast = React.memo<CashFlowForecastProps>(({
  forecast,
  forecastMonths,
  onForecastMonthsChange,
  isLoading = false,
}) => {
  const chartData = useMemo(() => {
    if (!forecast) return [];

    const historicalData = forecast.historical.map(point => ({
      x: format(point.date, 'MMM yyyy'),
      y: point.actual ?? point.forecast,
    }));

    const forecastedData = forecast.forecasted.map(point => ({
      x: format(point.date, 'MMM yyyy'),
      y: point.forecast,
    }));

    const bestCaseData = forecast.forecasted.map(point => ({
      x: format(point.date, 'MMM yyyy'),
      y: point.upperBound,
    }));

    const worstCaseData = forecast.forecasted.map(point => ({
      x: format(point.date, 'MMM yyyy'),
      y: point.lowerBound,
    }));

    return [
      {
        id: 'Historical',
        data: historicalData,
      },
      {
        id: 'Forecasted',
        data: forecastedData,
      },
      {
        id: 'Best Case',
        data: bestCaseData,
      },
      {
        id: 'Worst Case',
        data: worstCaseData,
      },
    ];
  }, [forecast]);

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return 'text-green-600 dark:text-green-400';
      case 'decreasing':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return '↗';
      case 'decreasing':
        return '↘';
      default:
        return '→';
    }
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

  if (!forecast) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <p className="text-gray-500 dark:text-gray-400">No forecast data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Cash Flow Forecast
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => onForecastMonthsChange(6)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              forecastMonths === 6
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            6 Months
          </button>
          <button
            onClick={() => onForecastMonthsChange(12)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              forecastMonths === 12
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            12 Months
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Avg Monthly Inflow
          </h3>
          <p className="mt-2 text-2xl font-semibold text-green-600 dark:text-green-400">
            R {forecast.summary.averageMonthlyInflow.toFixed(0)}
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Avg Monthly Outflow
          </h3>
          <p className="mt-2 text-2xl font-semibold text-red-600 dark:text-red-400">
            R {forecast.summary.averageMonthlyOutflow.toFixed(0)}
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Projected Balance
          </h3>
          <p
            className={`mt-2 text-2xl font-semibold ${
              forecast.summary.projectedBalance >= 0
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            R {forecast.summary.projectedBalance.toFixed(0)}
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Trend</h3>
          <p className={`mt-2 text-2xl font-semibold ${getTrendColor(forecast.summary.trend)}`}>
            {getTrendIcon(forecast.summary.trend)} {forecast.summary.trendPercentage.toFixed(1)}%
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 capitalize">
            {forecast.summary.trend}
          </p>
        </div>
      </div>

      {/* Scenarios */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <h3 className="text-sm font-medium text-green-700 dark:text-green-400">Best Case</h3>
          <p className="mt-2 text-xl font-semibold text-green-600 dark:text-green-400">
            R {forecast.scenarios.bestCase.toFixed(0)}
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="text-sm font-medium text-blue-700 dark:text-blue-400">Expected</h3>
          <p className="mt-2 text-xl font-semibold text-blue-600 dark:text-blue-400">
            R {forecast.scenarios.expected.toFixed(0)}
          </p>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <h3 className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Worst Case</h3>
          <p className="mt-2 text-xl font-semibold text-yellow-600 dark:text-yellow-400">
            R {forecast.scenarios.worstCase.toFixed(0)}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-96">
        <ResponsiveLine
          data={chartData}
          margin={{ top: 20, right: 120, bottom: 60, left: 80 }}
          xScale={{ type: 'point' }}
          yScale={{
            type: 'linear',
            min: 'auto',
            max: 'auto',
            stacked: false,
            reverse: false,
          }}
          axisTop={null}
          axisRight={null}
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: -45,
            legend: 'Month',
            legendOffset: 50,
            legendPosition: 'middle',
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'Net Cash Flow (R)',
            legendOffset: -60,
            legendPosition: 'middle',
            format: (value) => `R ${value}`,
          }}
          colors={['#2563eb', '#10b981', '#22c55e', '#eab308']}
          enablePoints={true}
          pointSize={6}
          pointColor={{ from: 'color' }}
          pointBorderWidth={2}
          pointBorderColor={{ from: 'serieColor' }}
          enableArea={false}
          areaOpacity={0.1}
          useMesh={true}
          legends={[
            {
              anchor: 'bottom-right',
              direction: 'column',
              justify: false,
              translateX: 100,
              translateY: 0,
              itemsSpacing: 0,
              itemDirection: 'left-to-right',
              itemWidth: 80,
              itemHeight: 20,
              itemOpacity: 0.75,
              symbolSize: 12,
              symbolShape: 'circle',
              symbolBorderColor: 'rgba(0, 0, 0, .5)',
              effects: [
                {
                  on: 'hover',
                  style: {
                    itemBackground: 'rgba(0, 0, 0, .03)',
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
            grid: {
              line: {
                stroke: '#e5e7eb',
                strokeWidth: 1,
              },
            },
            legends: {
              text: {
                fill: '#374151',
                fontSize: 11,
              },
            },
            tooltip: {
              container: {
                background: '#ffffff',
                color: '#374151',
                fontSize: 12,
                borderRadius: 4,
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                padding: '8px 12px',
              },
            },
          }}
        />
      </div>

      {/* Footer */}
      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        Generated at: {format(forecast.generatedAt, 'dd MMM yyyy HH:mm')}
      </div>
    </div>
  );
});

CashFlowForecast.displayName = 'CashFlowForecast';

export default CashFlowForecast;
