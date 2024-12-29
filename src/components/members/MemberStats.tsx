import React from "react";
import StatCard from "../stats/StatCard";
import type { Contribution } from "../../types/contribution";
import type { Payout } from "../../types/payout";

interface MemberStatsProps {
  contributions?: Contribution[];
  payouts?: Payout[];
}

const MemberStats: React.FC<MemberStatsProps> = ({
  contributions = [],
  payouts = [],
}) => {
  const approvedContributions = contributions.filter(
    (c) => c.status === "approved"
  );
  const pendingContributions = contributions.filter(
    (c) => c.status === "pending"
  );
  const rejectedContributions = contributions.filter(
    (c) => c.status === "rejected"
  );

  const totalApprovedAmount = approvedContributions.reduce(
    (sum, c) => sum + c.amount,
    0
  );
  const totalPayouts = payouts.reduce((sum, p) => sum + p.amount, 0);
  const balance = totalApprovedAmount - totalPayouts;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <StatCard
        title="Total Approved Contributions"
        value={`R ${totalApprovedAmount.toFixed(2)}`}
        className="bg-green-50"
      />
      <StatCard
        title="Pending Contributions"
        value={pendingContributions.length.toString()}
        className="bg-yellow-50"
      />
      <StatCard
        title="Total Payouts"
        value={`R ${totalPayouts.toFixed(2)}`}
        className="bg-blue-50"
      />
      <StatCard
        title="Current Balance"
        value={`R ${balance.toFixed(2)}`}
        className={balance >= 0 ? "bg-green-50" : "bg-red-50"}
      />
    </div>
  );
};

export default MemberStats;
