import React from "react";
import Table from "../ui/Table";
import { formatDate } from "../../utils/dateUtils";
import type { Contribution } from "../../types/contribution";
import Badge from "../ui/Badge";

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
              <Badge
                variant={
                  contribution.status === "approved"
                    ? "success"
                    : contribution.status === "rejected"
                    ? "error"
                    : "warning"
                }
              >
                {contribution.status}
              </Badge>
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
