import React from "react";
import Table from "../ui/Table";
import { formatDate } from "../../utils/dateUtils";
import type { Payout } from "../../types/payout";

interface PayoutsHistoryProps {
  payouts?: Payout[];
}

const PayoutsHistory: React.FC<PayoutsHistoryProps> = ({ payouts = [] }) => {
  return (
    <div>
      <h4 className="text-lg font-semibold mb-4">Payouts History</h4>
      <Table headers={["Date", "Reason", "Status", "Amount"]}>
        {payouts.map((payout) => (
          <tr key={payout.id}>
            <td className="px-6 py-4 whitespace-nowrap">
              {formatDate(payout.date)}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">{payout.reason}</td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span
                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  payout.status === "paid"
                    ? "bg-green-100 text-green-800"
                    : payout.status === "approved"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {payout.status}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              R {payout.amount.toFixed(2)}
            </td>
          </tr>
        ))}
        {payouts.length === 0 && (
          <tr>
            <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
              No payouts found
            </td>
          </tr>
        )}
      </Table>
    </div>
  );
};

export default PayoutsHistory;
