import React, { useState } from "react";
import { Calendar, User, Clock, Info } from "lucide-react";
import { useMemberHostAssignments } from "../../hooks/useHostAssignments";
import { useAuth } from "../../hooks/useAuth";
import { formatDate } from "../../utils/dateUtils";
import { LoadingSkeleton } from "../ui/LoadingOverlay";
import Button from "../ui/Button";
import { FileSpreadsheet, FileText } from "lucide-react";
import { exportHostScheduleToExcel, exportHostScheduleToPDF } from "../../services/hostAssignmentExportService";
import { useHostAssignments } from "../../hooks/useHostAssignments";

const MemberHostView: React.FC = () => {
  const { userDetails } = useAuth();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const { assignments, loading, error } = useMemberHostAssignments(userDetails?.id);
  const { schedule } = useHostAssignments(selectedYear);
  const [isExporting, setIsExporting] = useState(false);

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const filteredAssignments = assignments.filter(assignment => assignment.year === selectedYear);

  const handleExportExcel = async () => {
    if (!schedule) return;
    try {
      setIsExporting(true);
      await exportHostScheduleToExcel(schedule);
    } catch (error) {
      console.error('Export to Excel failed:', error);
      alert('Failed to export to Excel. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    if (!schedule) return;
    try {
      setIsExporting(true);
      await exportHostScheduleToPDF(schedule);
    } catch (error) {
      console.error('Export to PDF failed:', error);
      alert('Failed to export to PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "confirmed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "missed":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return "✅";
      case "confirmed":
        return "✓";
      case "missed":
        return "❌";
      default:
        return "⏳";
    }
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const isUpcoming = (assignmentDate: Date) => {
    const today = new Date();
    const diffTime = assignmentDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 30; // Within next 30 days
  };

  const sortedAssignments = [...filteredAssignments].sort((a, b) => a.month - b.month);

  if (loading) {
    return (
      <div className="bg-surface dark:bg-surface-dark rounded-lg shadow p-6">
        <LoadingSkeleton lines={5} className="space-y-4" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-surface dark:bg-surface-dark rounded-lg shadow p-6">
        <div className="text-center">
          <Calendar className="mx-auto h-8 w-8 text-red-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-surface dark:bg-surface-dark rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Calendar className="w-6 h-6 text-primary-600 mr-3" />
            <h2 className="text-xl font-semibold text-text-text-primary-900 dark:text-text-primary-dar">
              My Hosting Schedule
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {schedule && (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  icon={FileSpreadsheet}
                  onClick={handleExportExcel}
                  disabled={isExporting}
                  size="small"
                >
                  Excel
                </Button>
                <Button
                  variant="ghost"
                  icon={FileText}
                  onClick={handleExportPDF}
                  disabled={isExporting}
                  size="small"
                >
                  PDF
                </Button>
              </div>
            )}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="block w-full rounded-input border border-line dark:border-line-dark bg-surface dark:bg-surface-dark text-text-primary
          +  dark:text-text-primary-dark shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200"
            >
              {yearOptions.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <Info className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Social Society Meeting Hosting</p>
            <p>
              Meetings are held on the second Sunday of each month. As a host, you'll be responsible
              for providing the venue and refreshments for the meeting.
            </p>
          </div>
        </div>
      </div>

      {/* Assignments */}
      {sortedAssignments.length === 0 ? (
        <div className="bg-surface dark:bg-surface-dark rounded-lg shadow p-12">
          <div className="text-center">
            <Calendar className="mx-auto h-12 w-12 text-text-secondary dark:text-text-secondary-dark mb-4" />
            <h3 className="text-lg font-medium text-text-primary dark:text-text-primary-dark mb-2">
              No Hosting Assignments
            </h3>
            <p className="text-text-secondary dark:text-text-secondary-dark">
              You don't have any hosting assignments for {selectedYear}.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedAssignments.map((assignment) => {
            const assignmentDate = assignment.assigned_month.toDate();
            const upcoming = isUpcoming(assignmentDate);

            return (
              <div
                key={assignment.id}
                className={`bg-surface dark:bg-surface-dark rounded-lg shadow border-l-4 p-6 ${
                  upcoming ? "border-l-orange-400 bg-orange-50 dark:bg-orange-900/20" : "border-l-primary-400"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8">
                      <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary-600" />
                      </div>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-medium text-text-primary dark:text-text-primary-dark">
                        {monthNames[assignment.month - 1]}
                      </h3>
                      <p className="text-sm text-text-secondary dark:text-text-secondary-dark">{assignment.year}</p>
                    </div>
                  </div>
                  {upcoming && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      <Clock className="w-3 h-3 mr-1" />
                      Upcoming
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-text-primary-700 dark:text-text-primary-700-dark">Meeting Date</p>
                    <p className="text-sm text-text-gray-900 dark:text-text-primary-900-dark">{formatDate(assignment.assigned_month)}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-text-text-primary-700 dark:text-text-primary-dark">Status</p>
                    <span className={`inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded-full border ${getStatusColor(assignment.status)}`}>
                      <span className="mr-1">{getStatusIcon(assignment.status)}</span>
                      {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                    </span>
                  </div>

                  {assignment.notes && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Notes</p>
                      <p className="text-sm text-gray-600">{assignment.notes}</p>
                    </div>
                  )}

                  {upcoming && (
                    <div className="mt-4 p-3 bg-orange-100 border border-orange-200 rounded-lg">
                      <p className="text-sm font-medium text-orange-800 mb-1">
                        Reminder: You're hosting soon!
                      </p>
                      <p className="text-xs text-orange-700">
                        Please confirm your availability and prepare the venue.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="bg-surface dark:bg-surface-dark rounded-lg shadow p-6">
        <h3 className="text-sm font-medium text-text-gray-900 dark:text-text-primary-900-dark mb-3">Status Legend</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center">
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200 mr-2">
              ⏳ Pending
            </span>
          </div>
          <div className="flex items-center">
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 border border-blue-200 mr-2">
              ✓ Confirmed
            </span>
          </div>
          <div className="flex items-center">
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 border border-green-200 mr-2">
              ✅ Completed
            </span>
          </div>
          <div className="flex items-center">
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 border border-red-200 mr-2">
              ❌ Missed
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberHostView;