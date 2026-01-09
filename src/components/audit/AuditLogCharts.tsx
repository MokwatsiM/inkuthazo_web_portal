import React from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsivePie } from '@nivo/pie';
import { useTheme } from '../../contexts/ThemeContext';

interface AuditLogChartsProps {
    stats: {
        actionCounts: Record<string, number>;
        dailyActivity: Record<string, number>;
        totalCount: number;
    };
}

const AuditLogCharts: React.FC<AuditLogChartsProps> = ({ stats }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const actionData = Object.entries(stats.actionCounts)
        .map(([action, count]) => ({
            action,
            count,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

    const dailyData = Object.entries(stats.dailyActivity)
        .map(([date, count]) => ({
            date,
            count,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const pieData = actionData.map((item) => ({
        id: item.action,
        label: item.action,
        value: item.count,
    }));

    const chartTheme = {
        axis: {
            ticks: {
                text: {
                    fill: isDark ? '#9ca3af' : '#4b5563',
                },
            },
        },
        grid: {
            line: {
                stroke: isDark ? '#374151' : '#e5e7eb',
            },
        },
        legends: {
            text: {
                fill: isDark ? '#9ca3af' : '#4b5563',
            },
        },
        tooltip: {
            container: {
                background: isDark ? '#1f2937' : '#ffffff',
                color: isDark ? '#f3f4f6' : '#111827',
            },
        },
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Activity by Action</h3>
                <div className="h-64">
                    <ResponsivePie
                        data={pieData}
                        margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
                        innerRadius={0.5}
                        padAngle={0.7}
                        cornerRadius={3}
                        activeOuterRadiusOffset={8}
                        colors={{ scheme: 'nivo' }}
                        borderWidth={1}
                        borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                        arcLinkLabelsSkipAngle={10}
                        arcLinkLabelsTextColor={isDark ? '#9ca3af' : '#4b5563'}
                        arcLinkLabelsThickness={2}
                        arcLinkLabelsColor={{ from: 'color' }}
                        arcLabelsSkipAngle={10}
                        arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
                        theme={chartTheme}
                    />
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Daily Activity</h3>
                <div className="h-64">
                    <ResponsiveBar
                        data={dailyData}
                        keys={['count']}
                        indexBy="date"
                        margin={{ top: 20, right: 20, bottom: 50, left: 50 }}
                        padding={0.3}
                        valueScale={{ type: 'linear' }}
                        indexScale={{ type: 'band', round: true }}
                        colors={{ scheme: 'nivo' }}
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
                        }}
                        labelSkipWidth={12}
                        labelSkipHeight={12}
                        theme={chartTheme}
                        role="application"
                        ariaLabel="Daily activity bar chart"
                    />
                </div>
            </div>
        </div>
    );
};

export default AuditLogCharts;
