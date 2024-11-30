// src/components/analytics/ContributionTrends.tsx
import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { format } from "date-fns";
import type { Contribution } from "../../types";

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

  const data = Object.entries(monthlyData).map(([month, amount]) => ({
    month,
    amount,
  }));

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">
        Monthly Contribution Trends
      </h3>
      <LineChart width={600} height={300} data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="amount" stroke="#4F46E5" />
      </LineChart>
    </div>
  );
};

export default ContributionTrends;
