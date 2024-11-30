import React from "react";
import { ResponsiveBar } from "@nivo/bar";
import type { MemberAnalytics } from "../../types/analytics";

interface MembershipChartProps {
  data: MemberAnalytics["memberGrowth"];
}

const MembershipChart: React.FC<MembershipChartProps> = ({ data }) => {
  const chartData = data.map((d) => ({
    month: d.month.substring(0, 3),
    "New Members": d.newMembers,
    "Total Members": d.totalMembers,
  }));

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
      <ResponsiveBar
        data={chartData}
        keys={["New Members", "Total Members"]}
        indexBy="month"
        margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
        padding={0.3}
        valueScale={{ type: "linear" }}
        indexScale={{ type: "band", round: true }}
        colors={["#4F46E5", "#10B981"]}
        borderRadius={4}
        borderWidth={1}
        borderColor={{ from: "color", modifiers: [["darker", 0.2]] }}
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
          format: (value) => Math.round(Number(value)).toString(),
        }}
        enableLabel={true}
        labelSkipWidth={12}
        labelSkipHeight={12}
        labelFormat={(value) => Math.round(Number(value)).toString()}
        theme={theme}
        tooltip={({ id, value, color }) => (
          <div className="bg-white p-2 shadow-lg rounded-lg border border-gray-200">
            <span style={{ color }}>
              <strong>{id}</strong>: {value}
            </span>
          </div>
        )}
        legends={[
          {
            dataFrom: "keys",
            anchor: "bottom-right",
            direction: "column",
            justify: false,
            translateX: 120,
            translateY: 0,
            itemsSpacing: 2,
            itemWidth: 100,
            itemHeight: 20,
            itemDirection: "left-to-right",
            itemOpacity: 0.85,
            symbolSize: 12,
            symbolShape: "circle",
            effects: [
              {
                on: "hover",
                style: {
                  itemOpacity: 1,
                },
              },
            ],
          },
        ]}
      />
    </div>
  );
};

export default MembershipChart;
