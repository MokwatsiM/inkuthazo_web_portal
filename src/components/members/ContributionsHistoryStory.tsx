import React from "react";
import Table from "../ui/Table";
import { formatDate } from "../../utils/dateUtils";
import type { Contribution } from "../../types/contribution";

interface ContributionsHistoryProps {
  contributions?: Contribution[];
}

const ContributionsHistory: React.FC<ContributionsHistoryProps> = ({
  contributions = [],
}) => {
  return (
    <div>
      <h4 className="text-lg font-semibold mb-4">Contributions History</h4>
      <Table headers={["Date", "Type", "Amount", "Status", "Notes"]}>
        {contributions.map((contribution) => (
          <tr key={contribution.id}>
            <td className="px-6 py-4 whitespace-nowrap">
              {formatDate(contribution.date)}
            </td>
            <td className="px-6 py-4 whitespace-nowrap capitalize">
              {contribution.type}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              R {contribution.amount.toFixed(2)}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span
                className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  contribution.status === "approved"
                    ? "bg-green-100 text-green-800"
                    : contribution.status === "rejected"
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {contribution.status}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              {contribution.review_notes || "-"}
            </td>
          </tr>
        ))}
        {contributions.length === 0 && (
          <tr>
            <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
              No contributions found
            </td>
          </tr>
        )}
      </Table>
    </div>
  );
};

export default ContributionsHistory;
