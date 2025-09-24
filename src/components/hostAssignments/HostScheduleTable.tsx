import React, { useState } from "react";
import { Calendar, User, ArrowUpDown, Edit2 } from "lucide-react";
import { formatDate } from "../../utils/dateUtils";
import type { HostSchedule, HostAssignment } from "../../types";
import EditAssignmentModal from "./EditAssignmentModal";

interface HostScheduleTableProps {
  schedule: HostSchedule;
  onUpdateAssignment: (assignmentId: string, updates: Partial<HostAssignment>) => Promise<void>;
  onSwapAssignments: (assignment1Id: string, assignment2Id: string) => Promise<void>;
  canEdit: boolean;
}

const HostScheduleTable: React.FC<HostScheduleTableProps> = ({
  schedule,
  onUpdateAssignment,
  onSwapAssignments,
  canEdit,
}) => {
  const [draggedAssignment, setDraggedAssignment] = useState<HostAssignment | null>(null);
  const [editingAssignment, setEditingAssignment] = useState<HostAssignment | null>(null);

  const handleDragStart = (e: React.DragEvent, assignment: HostAssignment) => {
    if (!canEdit) return;
    setDraggedAssignment(assignment);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!canEdit) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetAssignment: HostAssignment) => {
    if (!canEdit || !draggedAssignment || draggedAssignment.id === targetAssignment.id) return;

    e.preventDefault();
    try {
      await onSwapAssignments(draggedAssignment.id, targetAssignment.id);
    } catch (error) {
      console.error("Error swapping assignments:", error);
    } finally {
      setDraggedAssignment(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedAssignment(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "missed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const sortedAssignments = [...schedule.assignments].sort((a, b) => a.month - b.month);

  return (
    <div className="bg-surface dark:bg-surface-dark rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-line dark:border-line-dark">
        <h3 className="text-lg font-medium text-text-primary dark:text-text-primary-dark flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          {schedule.year} Meeting Host Schedule
        </h3>
        <p className="text-sm text-text-secondary dark:text-text-secondary-dark mt-1">
          Second Sunday of each month • {canEdit ? "Drag and drop to reassign" : "Read-only view"}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-line dark:divide-line-dark">
          <thead className="bg-surface-2 dark:bg-surface-2-dark">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-text-secondary-dark uppercase tracking-wider">
                Month
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-text-secondary-dark uppercase tracking-wider">
                Meeting Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-text-secondary-dark uppercase tracking-wider">
                Host
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-text-secondary-dark uppercase tracking-wider">
                Status
              </th>
              {canEdit && (
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-text-secondary-dark uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-surface dark:bg-surface-dark divide-y divide-line dark:divide-line-dark">
            {sortedAssignments.map((assignment) => (
              <tr
                key={assignment.id}
                draggable={canEdit}
                onDragStart={(e) => handleDragStart(e, assignment)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, assignment)}
                onDragEnd={handleDragEnd}
                className={`hover:bg-surface-2 dark:hover:bg-surface-2-dark transition-colors ${
                  canEdit ? "cursor-move" : ""
                } ${
                  draggedAssignment?.id === assignment.id ? "opacity-50" : ""
                }`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-text-primary dark:text-text-primary-dark">
                    {monthNames[assignment.month - 1]}
                  </div>
                  <div className="text-sm text-text-secondary dark:text-text-secondary-dark">
                    {assignment.year}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-text-primary dark:text-text-primary-dark">
                    {formatDate(assignment.assigned_month)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8">
                      <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-800 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary-600" />
                      </div>
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-text-primary dark:text-text-primary-dark">
                        {assignment.member_name}
                      </div>
                      <div className="text-sm text-text-secondary dark:text-text-secondary-dark">
                        ID: {assignment.member_id.slice(0, 8)}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(assignment.status)}`}>
                    {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                  </span>
                </td>
                {canEdit && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary dark:text-text-secondary-dark">
                    <button
                      onClick={() => setEditingAssignment(assignment)}
                      className="text-primary-600 hover:text-primary-900 mr-3"
                      title="Edit assignment"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <ArrowUpDown className="h-4 w-4 text-text-tertiary dark:text-text-tertiary-dark" title="Drag to reorder" />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {canEdit && sortedAssignments.length > 0 && (
        <div className="px-6 py-4 bg-surface-2 dark:bg-surface-2-dark border-t border-line dark:border-line-dark">
          <p className="text-sm text-gray-600">
            💡 <strong>Tip:</strong> Drag and drop rows to swap host assignments between months.
            Click the edit icon to change assignment details or status.
          </p>
        </div>
      )}

      {editingAssignment && (
        <EditAssignmentModal
          assignment={editingAssignment}
          onClose={() => setEditingAssignment(null)}
          onSubmit={async (updates) => {
            await onUpdateAssignment(editingAssignment.id, updates);
            setEditingAssignment(null);
          }}
        />
      )}
    </div>
  );
};

export default HostScheduleTable;