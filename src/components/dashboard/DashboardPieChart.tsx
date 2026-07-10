import React from "react";
import { ResponsivePie } from "@nivo/pie";

interface DashboardPieChartProps {
  data: { name: string; value: number }[];
  colors?: string[];
}

const DEFAULT_COLORS = ["#4F46E5", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

const DashboardPieChart: React.FC<DashboardPieChartProps> = ({
  data,
  colors = DEFAULT_COLORS,
}) => (
  <ResponsivePie
    data={data.map((entry) => ({
      id: entry.name,
      label: entry.name,
      value: entry.value,
    }))}
    margin={{ top: 24, right: 88, bottom: 64, left: 88 }}
    innerRadius={0.6}
    padAngle={2}
    cornerRadius={4}
    colors={colors}
    valueFormat={(value) => `R ${Number(value).toFixed(2)}`}
    arcLinkLabelsTextColor="#6b7280"
    arcLinkLabelsThickness={2}
    arcLinkLabelsColor={{ from: "color" }}
    legends={[
      {
        anchor: "bottom",
        direction: "row",
        translateY: 56,
        itemWidth: 100,
        itemHeight: 18,
        itemTextColor: "#6b7280",
        symbolSize: 12,
        symbolShape: "circle",
      },
    ]}
  />
);

export default DashboardPieChart;
