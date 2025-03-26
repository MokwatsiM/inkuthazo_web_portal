import React from "react";
import { format } from "date-fns";
import { CheckCircle, AlertCircle } from "lucide-react";
import Button from "../ui/Button";
import type { DisciplinaryRecord } from "../../types";

interface DisciplinaryRecordsListProps {
  records: DisciplinaryRecord[];
  onResolve: (record: DisciplinaryRecord) => void;
  canResolve: boolean;
}

const DisciplinaryRecordsList: React.FC<DisciplinaryRecordsListProps> = ({
  records,
  onResolve,
  canResolve,
}) => {
  return (
    <div className="space-y-4">
      {records.map((record) => (
        <div
          key={record.id}
          className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold">
                  {record.infringement_type}
                </h3>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    record.status === "resolved"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {record.status === "resolved" ? (
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="w-4 h-4" />
                      <span>Resolved</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1">
                      <AlertCircle className="w-4 h-4" />
                      <span>Pending</span>
                    </div>
                  )}
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                {record.description}
              </p>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <p>Date: {format(record.date.toDate(), "dd MMM yyyy")}</p>
                {record.penalty_amount && (
                  <p>Penalty: R {record.penalty_amount.toFixed(2)}</p>
                )}
              </div>
              {record.status === "resolved" && record.resolution_notes && (
                <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    <span className="font-medium">Resolution: </span>
                    {record.resolution_notes}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Resolved on{" "}
                    {format(record.resolved_at!.toDate(), "dd MMM yyyy")}
                  </p>
                </div>
              )}
            </div>
            {canResolve && record.status === "pending" && (
              <Button
                variant="secondary"
                onClick={() => onResolve(record)}
                className="ml-4"
              >
                Resolve
              </Button>
            )}
          </div>
        </div>
      ))}
      {records.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400 text-center py-4">
          No disciplinary records found.
        </p>
      )}
    </div>
  );
};

export default DisciplinaryRecordsList;
