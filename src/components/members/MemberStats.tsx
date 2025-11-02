import React from "react";
import type { Contribution } from "../../types/contribution";
import type { Payout } from "../../types/payout";
import { TrendingUp, Clock, Upload, Wallet } from "lucide-react";

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
  // const rejectedContributions = contributions.filter(
  //   (c) => c.status === "rejected"
  // );

  const totalApprovedAmount = approvedContributions.reduce(
    (sum, c) => sum + c.amount,
    0
  );
  const totalPayouts = payouts.reduce((sum, p) => sum + p.amount, 0);
  const balance = totalApprovedAmount - totalPayouts;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* Total Approved Contributions */}
      <div className="rounded-xl border border-emerald-400/20 dark:border-emerald-400/20 bg-emerald-950/30 dark:bg-emerald-950/30 p-5 hover:border-emerald-400/30 hover:shadow transition">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-emerald-300/80 dark:text-emerald-300/80">Total Approved Contributions</p>
            <p className="mt-2 text-2xl tracking-tight font-semibold text-emerald-100 dark:text-emerald-100">R {totalApprovedAmount.toFixed(2)}</p>
          </div>
          <div className="h-9 w-9 rounded-lg border border-emerald-400/30 bg-emerald-400/10 flex items-center justify-center text-emerald-300">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Pending Contributions */}
      <div className="rounded-xl border border-amber-400/20 dark:border-amber-400/20 bg-amber-950/30 dark:bg-amber-950/30 p-5 hover:border-amber-400/30 hover:shadow transition">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-amber-300/80 dark:text-amber-300/80">Pending Contributions</p>
            <p className="mt-2 text-2xl tracking-tight font-semibold text-amber-100 dark:text-amber-100">{pendingContributions.length}</p>
          </div>
          <div className="h-9 w-9 rounded-lg border border-amber-400/30 bg-amber-400/10 flex items-center justify-center text-amber-300">
            <Clock className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Total Payouts */}
      <div className="rounded-xl border border-sky-400/20 dark:border-sky-400/20 bg-sky-950/30 dark:bg-sky-950/30 p-5 hover:border-sky-400/30 hover:shadow transition">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-sky-300/80 dark:text-sky-300/80">Total Payouts</p>
            <p className="mt-2 text-2xl tracking-tight font-semibold text-sky-100 dark:text-sky-100">R {totalPayouts.toFixed(2)}</p>
          </div>
          <div className="h-9 w-9 rounded-lg border border-sky-400/30 bg-sky-400/10 flex items-center justify-center text-sky-300">
            <Upload className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Current Balance */}
      <div className={`rounded-xl border p-5 hover:shadow transition ${
        balance >= 0
          ? 'border-emerald-400/20 dark:border-emerald-400/20 bg-emerald-950/30 dark:bg-emerald-950/30 hover:border-emerald-400/30'
          : 'border-rose-400/20 dark:border-rose-400/20 bg-rose-950/30 dark:bg-rose-950/30 hover:border-rose-400/30'
      }`}>
        <div className="flex items-start justify-between">
          <div>
            <p className={`text-sm ${balance >= 0 ? 'text-emerald-300/80 dark:text-emerald-300/80' : 'text-rose-300/80 dark:text-rose-300/80'}`}>Current Balance</p>
            <p className={`mt-2 text-2xl tracking-tight font-semibold ${balance >= 0 ? 'text-emerald-100 dark:text-emerald-100' : 'text-rose-100 dark:text-rose-100'}`}>R {balance.toFixed(2)}</p>
          </div>
          <div className={`h-9 w-9 rounded-lg border flex items-center justify-center ${
            balance >= 0
              ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
              : 'border-rose-400/30 bg-rose-400/10 text-rose-300'
          }`}>
            <Wallet className="h-5 w-5" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberStats;
