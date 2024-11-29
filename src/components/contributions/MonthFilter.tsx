import React from "react";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";

interface MonthFilterProps {
  onChange: (startDate: Date | null, endDate: Date | null) => void;
}

const MonthFilter: React.FC<MonthFilterProps> = ({ onChange }) => {
  const months = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(new Date(), i);
    return {
      label: format(date, "MMMM yyyy"),
      startDate: startOfMonth(date),
      endDate: endOfMonth(date),
    };
  });

  return (
    <select
      className="block w-48 rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
      onChange={(e) => {
        if (!e.target.value) {
          onChange(null, null);
          return;
        }
        const [start, end] = e.target.value
          .split("|")
          .map((date) => new Date(date));
        onChange(start, end);
      }}
      defaultValue={`${months[0].startDate.toISOString()}|${months[0].endDate.toISOString()}`}
    >
      <option value="">All Time</option>
      {months.map((month, index) => (
        <option
          key={index}
          value={`${month.startDate.toISOString()}|${month.endDate.toISOString()}`}
        >
          {month.label}
        </option>
      ))}
    </select>
  );
};

export default MonthFilter;
