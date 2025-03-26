import React, { useState } from "react";
import { format } from "date-fns";
import { CheckCircle, AlertCircle, ChevronRight, Trash2 } from "lucide-react";
import Button from "../ui/Button";
import type { DisciplinaryRecord } from "../../types";

interface DisciplinaryRecordsListProps {
  records: DisciplinaryRecord[];
  onResolve: (record: DisciplinaryRecord) => void;
  onDelete: (record: DisciplinaryRecord) => void;
  canResolve: boolean;
  canDelete: boolean;
}

const DisciplinaryRecordsList: React.FC<DisciplinaryRecordsListProps> = ({
  records,
  onResolve,
  onDelete,
  canResolve,
  canDelete,
}) => {
  const [selectedRecord, setSelectedRecord] =
    useState<DisciplinaryRecord | null>(null);

  const RecordCard = ({
    record,
  }: {
    record: DisciplinaryRecord & { memberName?: string };
  }) => (
    <div
      className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => setSelectedRecord(record)}
    >
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">
              {record.memberName || "Unknown Member"}
            </h3>
            <span
              className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                record.status === "resolved"
                  ? "bg-green-100 text-green-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {record.status === "resolved" ? (
                <div className="flex items-center space-x-1">
                  <CheckCircle className="w-3 h-3" />
                  <span>Resolved</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>Pending</span>
                </div>
              )}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {record.infringement_type}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            {format(record.date.toDate(), "dd MMM yyyy")}
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400" />
      </div>
    </div>
  );

  const RecordDetails = ({ record }: { record: DisciplinaryRecord }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg m-4">
        <div className="space-y-4">
          <div className="flex justify-between items-start">
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
              {record.status}
            </span>
          </div>

          <div className="space-y-2">
            <p className="text-gray-600 dark:text-gray-300">
              {record.description}
            </p>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <p>Date: {format(record.date.toDate(), "dd MMM yyyy")}</p>
              {record.penalty_amount && (
                <p>Penalty: R {record.penalty_amount.toFixed(2)}</p>
              )}
            </div>
          </div>

          {record.status === "resolved" && record.resolution_notes && (
            <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded">
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

          <div className="flex justify-end space-x-3 mt-4">
            {canResolve && record.status === "pending" && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onResolve(record);
                  setSelectedRecord(null);
                }}
              >
                Resolve
              </Button>
            )}
            {canDelete && (
              <Button
                variant="secondary"
                className="!bg-red-100 !text-red-700 hover:!bg-red-200"
                icon={Trash2}
                onClick={(e) => {
                  e.stopPropagation();
                  if (
                    window.confirm(
                      "Are you sure you want to delete this record? This action cannot be undone."
                    )
                  ) {
                    onDelete(record);
                    setSelectedRecord(null);
                  }
                }}
              >
                Delete
              </Button>
            )}
            <Button variant="secondary" onClick={() => setSelectedRecord(null)}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-2">
      {records.map((record) => (
        <RecordCard key={record.id} record={record} />
      ))}
      {records.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400 text-center py-4">
          No disciplinary records found.
        </p>
      )}
      {selectedRecord && <RecordDetails record={selectedRecord} />}
    </div>
  );
};

export default DisciplinaryRecordsList;
