import React, { useState } from "react";
import { Calendar, Settings, RefreshCw, CheckCircle, AlertTriangle, Trash2 } from "lucide-react";
import Button from "../components/ui/Button";
import PageHeader from "../components/ui/PageHeader";
import { useHostAssignments } from "../hooks/useHostAssignments";
import { useAuth } from "../hooks/useAuth";
import HostScheduleTable from "../components/hostAssignments/HostScheduleTable";
import GenerateScheduleModal from "../components/hostAssignments/GenerateScheduleModal";
import ExportButtons from "../components/hostAssignments/ExportButtons";
import { LoadingSkeleton } from "../components/ui/LoadingOverlay";
import { formatDate } from "../utils/dateUtils";

const HostAssignments: React.FC = () => {
  const { isAdmin } = useAuth();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);

  const {
    schedule,
    loading,
    error,
    generateSchedule,
    updateAssignment,
    swapAssignments,
    deleteSchedule,
    finalizeSchedule,
    refetchSchedule,
  } = useHostAssignments(selectedYear);

  const handleGenerateSchedule = async (params: any) => {
    try {
      await generateSchedule(params);
      setIsGenerateModalOpen(false);
    } catch (error) {
      console.error("Error generating schedule:", error);
    }
  };

  const handleFinalizeSchedule = async () => {
    if (window.confirm("Are you sure you want to finalize this schedule? This action cannot be undone.")) {
      try {
        await finalizeSchedule(selectedYear);
      } catch (error) {
        console.error("Error finalizing schedule:", error);
      }
    }
  };

  const handleDeleteSchedule = async () => {
    if (window.confirm("Are you sure you want to delete this entire schedule? This action cannot be undone.")) {
      try {
        await deleteSchedule(selectedYear);
      } catch (error) {
        console.error("Error deleting schedule:", error);
      }
    }
  };

  const yearOptions = Array.from(
    { length: 5 },
    (_, i) => currentYear - 2 + i
  );

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-400 mb-4" />
        <h3 className="text-lg font-medium text-text-primary dark:text-text-primary-dark mb-2">
          Access Denied
        </h3>
        <p className="text-text-secondary dark:text-text-secondary-dark">
          You don't have permission to manage host assignments.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Host Assignments"
        description="Manage burial society meeting host assignments"
        actions={
          <div className="flex items-center gap-3">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="rounded-input border border-line dark:border-line-dark shadow-sm focus:border-primary-500 focus:ring-primary-500 bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark"
            >
              {yearOptions.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <Button
              variant="ghost"
              icon={RefreshCw}
              onClick={() => refetchSchedule(selectedYear)}
              disabled={loading}
            >
              Refresh
            </Button>
            {!schedule && (
              <Button
                icon={Calendar}
                onClick={() => setIsGenerateModalOpen(true)}
                disabled={loading}
              >
                Generate Schedule
              </Button>
            )}
          </div>
        }
      />

      {/* Schedule Status */}
      {schedule && (
        <div className="bg-surface dark:bg-surface-dark rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-text-primary dark:text-text-primary-dark mb-2">
                {selectedYear} Host Schedule
              </h3>
              <div className="flex items-center gap-4 text-sm text-text-secondary dark:text-text-secondary-dark">
                <span>Generated: {formatDate(schedule.generated_at)}</span>
                <span>Last Modified: {formatDate(schedule.last_modified)}</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  schedule.is_finalized
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}>
                  {schedule.is_finalized ? (
                    <>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Finalized
                    </>
                  ) : (
                    <>
                      <Settings className="w-3 h-3 mr-1" />
                      Draft
                    </>
                  )}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ExportButtons schedule={schedule} />
              {!schedule.is_finalized && (
                <>
                  <Button
                    variant="ghost"
                    onClick={handleDeleteSchedule}
                    icon={Trash2}
                    size="small"
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                  Delete Schedule
                  </Button>
                  <Button
                    onClick={handleFinalizeSchedule}
                    icon={CheckCircle}
                    size="small"
                  >
                    Finalize Schedule
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Schedule Content */}
      {loading ? (
        <div className="bg-surface dark:bg-surface-dark rounded-lg shadow p-6">
          <LoadingSkeleton lines={10} className="space-y-4" />
        </div>
      ) : error ? (
        <div className="bg-surface dark:bg-surface-dark rounded-lg shadow p-6">
          <div className="text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-red-400 mb-4" />
            <h3 className="text-lg font-medium text-text-primary dark:text-text-primary-dark mb-2">Error</h3>
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      ) : schedule ? (
        <HostScheduleTable
          schedule={schedule}
          onUpdateAssignment={updateAssignment}
          onSwapAssignments={swapAssignments}
          canEdit={!schedule.is_finalized}
        />
      ) : (
        <div className="bg-surface dark:bg-surface-dark rounded-lg shadow p-12">
          <div className="text-center">
            <Calendar className="mx-auto h-12 w-12 text-text-tertiary dark:text-text-tertiary-dark mb-4" />
            <h3 className="text-lg font-medium text-text-primary dark:text-text-primary-dark mb-2">
              No Schedule Found
            </h3>
            <p className="text-text-secondary dark:text-text-secondary-dark mb-6">
              No host schedule exists for {selectedYear}. Generate one to get started.
            </p>
            <Button
              icon={Calendar}
              onClick={() => setIsGenerateModalOpen(true)}
            >
              Generate Schedule
            </Button>
          </div>
        </div>
      )}

      <GenerateScheduleModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        onSubmit={handleGenerateSchedule}
        year={selectedYear}
      />
    </div>
  );
};

export default HostAssignments;