import React, { useState } from "react";
import { X, User, Calendar } from "lucide-react";
import Button from "../ui/Button";
import { useMembers } from "../../hooks/useMembers";
import type { HostAssignment } from "../../types";

interface EditAssignmentModalProps {
  assignment: HostAssignment;
  onClose: () => void;
  onSubmit: (updates: Partial<HostAssignment>) => Promise<void>;
}

const EditAssignmentModal: React.FC<EditAssignmentModalProps> = ({
  assignment,
  onClose,
  onSubmit,
}) => {
  const { members } = useMembers();
  const [selectedMemberId, setSelectedMemberId] = useState(assignment.member_id);
  const [status, setStatus] = useState(assignment.status);
  const [notes, setNotes] = useState(assignment.notes || "");
  const [submitting, setSubmitting] = useState(false);

  const eligibleMembers = members.filter(
    member => member.status === "approved" || member.status === "active"
  );

  const selectedMember = members.find(member => member.id === selectedMemberId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedMember) {
      alert("Please select a valid member");
      return;
    }

    setSubmitting(true);
    try {
      const updates: Partial<HostAssignment> = {
        member_id: selectedMemberId,
        member_name: selectedMember.full_name,
        status,
      };

      // Only include notes if it has content
      const trimmedNotes = notes.trim();
      if (trimmedNotes) {
        updates.notes = trimmedNotes;
      }

      await onSubmit(updates);
    } catch (error) {
      console.error("Error updating assignment:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Calendar className="w-6 h-6 text-primary-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">
              Edit Assignment
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Assignment Info */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              Assignment Details
            </h3>
            <div className="text-sm text-gray-600">
              <div><strong>Month:</strong> {monthNames[assignment.month - 1]} {assignment.year}</div>
              <div><strong>Date:</strong> {new Date(assignment.assigned_month.toDate()).toLocaleDateString()}</div>
              <div><strong>Current Host:</strong> {assignment.member_name}</div>
            </div>
          </div>

          {/* Member Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign to Member
            </label>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              required
            >
              <option value="">Select a member...</option>
              {eligibleMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.full_name} ({member.email})
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              required
            >
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="missed">Missed</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              placeholder="Add any notes about this assignment..."
            />
          </div>

          {/* Selected Member Preview */}
          {selectedMember && (
            <div className="p-3 bg-primary-50 border border-primary-200 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-8 w-8">
                  <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary-600" />
                  </div>
                </div>
                <div className="ml-3">
                  <div className="text-sm font-medium text-primary-900">
                    {selectedMember.full_name}
                  </div>
                  <div className="text-sm text-primary-700">
                    {selectedMember.email} • {selectedMember.phone}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !selectedMemberId}
              loading={submitting}
            >
              Update Assignment
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAssignmentModal;