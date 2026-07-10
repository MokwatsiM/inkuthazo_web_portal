// src/components/analytics/ContributionTrends.tsx
import React from "react";
import { ResponsiveLine } from "@nivo/line";
import { format } from "date-fns";
import type { Contribution } from "../../types/contribution";

interface ContributionTrendsProps {
  contributions: Contribution[];
}

const ContributionTrends: React.FC<ContributionTrendsProps> = ({
  contributions,
}) => {
  const monthlyData = contributions.reduce((acc, curr) => {
    const month = format(curr.date.toDate(), "MMM yyyy");
    acc[month] = (acc[month] || 0) + curr.amount;
    return acc;
  }, {} as Record<string, number>);

  const chartData = [
    {
      id: "Contributions",
      data: Object.entries(monthlyData).map(([month, amount]) => ({
        x: month,
        y: amount,
      })),
    },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">
        Monthly Contribution Trends
      </h3>
      <div className="h-[300px]">
        <ResponsiveLine
          data={chartData}
          margin={{ top: 20, right: 30, bottom: 50, left: 60 }}
          xScale={{ type: "point" }}
          yScale={{ type: "linear", min: "auto", max: "auto" }}
          curve="monotoneX"
          colors={["#4F46E5"]}
          pointSize={8}
          pointBorderWidth={2}
          useMesh
          axisBottom={{ tickSize: 0, tickPadding: 8, tickRotation: -30 }}
          axisLeft={{ tickSize: 0, tickPadding: 8 }}
          theme={{
            grid: { line: { stroke: "#eee", strokeWidth: 1 } },
            tooltip: {
              container: {
                background: "white",
                padding: "8px",
                borderRadius: "4px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              },
            },
          }}
        />
      </div>
    </div>
  );
};

export default ContributionTrends;
