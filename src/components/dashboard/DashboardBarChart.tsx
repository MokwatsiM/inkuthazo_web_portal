import React from "react";
import { ResponsiveBar } from "@nivo/bar";

interface DashboardBarChartProps {
  data: { month: string; contributions: number }[];
  color?: string;
}

const chartTheme = {
  axis: {
    ticks: {
      text: { fontSize: 11, fill: "#6b7280" },
    },
  },
  grid: {
    line: { stroke: "#e5e7eb", strokeWidth: 1, strokeDasharray: "3 3" },
  },
  tooltip: {
    container: {
      background: "white",
      border: "1px solid #e5e7eb",
      borderRadius: "12px",
      padding: "12px",
    },
  },
};

const DashboardBarChart: React.FC<DashboardBarChartProps> = ({
  data,
  color = "#7C5CFC",
}) => (
  <ResponsiveBar
    data={data}
    keys={["contributions"]}
    indexBy="month"
    margin={{ top: 10, right: 10, bottom: 36, left: 64 }}
    padding={0.35}
    colors={[color]}
    borderRadius={6}
    enableLabel={false}
    axisTop={null}
    axisRight={null}
    axisBottom={{ tickSize: 0, tickPadding: 8 }}
    axisLeft={{ tickSize: 0, tickPadding: 8 }}
    valueFormat={(value) => `R ${Number(value).toFixed(2)}`}
    theme={chartTheme}
  />
);

export default DashboardBarChart;
