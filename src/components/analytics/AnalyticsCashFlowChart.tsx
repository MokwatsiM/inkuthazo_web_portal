import React from 'react';
import { ResponsiveBar } from '@nivo/bar';

export interface CashFlowData extends Record<string, string | number> {
  month: string;
  Contributions: number;
  'Payouts & Expenses': number;
  'Net Flow': number;
}

interface AnalyticsCashFlowChartProps {
  data: CashFlowData[];
  isDark: boolean;
}

const AnalyticsCashFlowChart = React.memo<AnalyticsCashFlowChartProps>(({ data, isDark }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Cash Flow Analysis</h3>
      <div className="h-[400px]">
        <ResponsiveBar
          data={data}
          keys={['Contributions', 'Payouts & Expenses', 'Net Flow']}
          indexBy="month"
          margin={{ top: 50, right: 130, bottom: 50, left: 80 }}
          padding={0.3}
          groupMode="grouped"
          colors={['#10b981', '#ef4444', '#3b82f6']}
          borderRadius={4}
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: -45,
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            format: (value) => `R ${value}`,
          }}
          labelSkipWidth={12}
          labelSkipHeight={12}
          theme={{
            axis: {
              ticks: { text: { fill: isDark ? '#d1d5db' : '#374151' } },
              legend: { text: { fill: isDark ? '#d1d5db' : '#374151' } },
            },
            legends: {
              text: { fill: isDark ? '#d1d5db' : '#374151' },
            },
          }}
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
              itemTextColor: isDark ? '#d1d5db' : '#374151',
            },
          ]}
          tooltip={({ id, value, indexValue }) => (
            <div className="bg-white dark:bg-gray-800 p-3 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="font-semibold">{indexValue}</div>
              <div className="text-sm">
                {id}: R {value.toFixed(0)}
              </div>
            </div>
          )}
        />
      </div>
    </div>
  );
});

AnalyticsCashFlowChart.displayName = 'AnalyticsCashFlowChart';

export default AnalyticsCashFlowChart;
