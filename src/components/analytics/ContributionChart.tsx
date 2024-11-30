import React from "react";
import { ResponsiveLine } from "@nivo/line";
import type { ContributionAnalytics } from "../../types/analytics";

interface ContributionChartProps {
  data: ContributionAnalytics["monthlyTrends"];
}

const ContributionChart: React.FC<ContributionChartProps> = ({ data }) => {
  const chartData = [
    {
      id: "Contributions",
      data: data.map((d) => ({
        x: d.month.substring(0, 3),
        y: d.amount,
      })),
    },
  ];

  const theme = {
    axis: {
      ticks: {
        text: {
          fontSize: 11,
        },
      },
    },
    grid: {
      line: {
        stroke: "#eee",
        strokeWidth: 1,
      },
    },
    tooltip: {
      container: {
        background: "white",
        padding: "8px",
        borderRadius: "4px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      },
    },
  };

  return (
    <div className="h-[400px]">
      <ResponsiveLine
        data={chartData}
        margin={{ top: 50, right: 110, bottom: 50, left: 80 }}
        xScale={{ type: "point" }}
        yScale={{
          type: "linear",
          min: "auto",
          max: "auto",
          stacked: false,
        }}
        curve="monotoneX"
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: -45,
          format: (value) => value.toString(),
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          format: (value) => `R${Math.round(Number(value)).toLocaleString()}`,
        }}
        enablePoints={true}
        pointSize={8}
        pointColor={{ theme: "background" }}
        pointBorderWidth={2}
        pointBorderColor={{ from: "serieColor" }}
        enableArea={true}
        areaOpacity={0.1}
        useMesh={true}
        theme={theme}
        tooltip={({ point }) => (
          <div className="bg-white p-2 shadow-lg rounded-lg border border-gray-200">
            <strong>point.data.x</strong>: R
            {Number(point.data.y).toLocaleString()}
          </div>
        )}
        legends={[
          {
            anchor: "bottom-right",
            direction: "column",
            justify: false,
            translateX: 100,
            translateY: 0,
            itemsSpacing: 0,
            itemDirection: "left-to-right",
            itemWidth: 80,
            itemHeight: 20,
            symbolSize: 12,
            symbolShape: "circle",
          },
        ]}
      />
    </div>
  );
};

export default ContributionChart;
