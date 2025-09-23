import React, { useState } from "react";
import { X, Calendar, Users, AlertTriangle } from "lucide-react";
import Button from "../ui/Button";
import { useMembers } from "../../hooks/useMembers";
import type { GenerateHostScheduleParams } from "../../types";

interface GenerateScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (params: GenerateHostScheduleParams) => Promise<void>;
  year: number;
}

const GenerateScheduleModal: React.FC<GenerateScheduleModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  year,
}) => {
  const { members, loading } = useMembers();
  const [excludeAdmins, setExcludeAdmins] = useState(true);
  const [excludeMemberIds, setExcludeMemberIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const eligibleMembers = members.filter(member =>
    member.status === "approved" || member.status === "active"
  );

  const nonAdminMembers = eligibleMembers.filter(member => member.role !== "admin");
  const adminMembers = eligibleMembers.filter(member => member.role === "admin");

  const finalEligibleMembers = eligibleMembers.filter(member => {
    if (excludeAdmins && member.role === "admin") return false;
    if (excludeMemberIds.includes(member.id)) return false;
    return true;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (finalEligibleMembers.length < 12) {
      alert("You need at least 12 eligible members to generate a full year schedule. Consider including more members.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        year,
        excludeAdmins,
        excludeMemberIds,
      });
    } catch (error) {
      console.error("Error generating schedule:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMemberExclusionChange = (memberId: string, exclude: boolean) => {
    if (exclude) {
      setExcludeMemberIds(prev => [...prev, memberId]);
    } else {
      setExcludeMemberIds(prev => prev.filter(id => id !== memberId));
    }
  };

  const resetSelections = () => {
    setExcludeAdmins(true);
    setExcludeMemberIds([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Calendar className="w-6 h-6 text-primary-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">
              Generate Host Schedule for {year}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{eligibleMembers.length}</div>
              <div className="text-sm text-gray-600">Total Eligible</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">{finalEligibleMembers.length}</div>
              <div className="text-sm text-gray-600">Will Be Included</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-500">12</div>
              <div className="text-sm text-gray-600">Months Needed</div>
            </div>
          </div>

          {/* Warning if insufficient members */}
          {finalEligibleMembers.length < 12 && (
            <div className="flex items-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  Insufficient Members
                </p>
                <p className="text-sm text-yellow-700">
                  You have {finalEligibleMembers.length} eligible members, but need at least 12 for a full year schedule.
                  Some members may be assigned multiple months.
                </p>
              </div>
            </div>
          )}

          {/* Exclude Admins Option */}
          <div className="space-y-3">
            <label className="flex items-start">
              <input
                type="checkbox"
                checked={excludeAdmins}
                onChange={(e) => setExcludeAdmins(e.target.checked)}
                className="mt-0.5 h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-900">
                  Exclude administrators from hosting ({adminMembers.length} admins)
                </div>
                <div className="text-sm text-gray-600">
                  Admins typically manage the meetings rather than host them
                </div>
              </div>
            </label>
          </div>

          {/* Member Exclusion List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-900">
                Exclude specific members
              </label>
              <button
                type="button"
                onClick={resetSelections}
                className="text-sm text-primary-600 hover:text-primary-800"
              >
                Reset selections
              </button>
            </div>

            {loading ? (
              <div className="text-sm text-gray-500">Loading members...</div>
            ) : (
              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                {nonAdminMembers.map((member) => (
                  <label
                    key={member.id}
                    className="flex items-center p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <input
                      type="checkbox"
                      checked={excludeMemberIds.includes(member.id)}
                      onChange={(e) => handleMemberExclusionChange(member.id, e.target.checked)}
                      className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">
                        {member.full_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {member.email} • {member.status}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Schedule Generation Info */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              How schedule generation works:
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Members are randomly assigned to the second Sunday of each month</li>
              <li>• Each eligible member will host approximately once per year</li>
              <li>• If there are fewer than 12 members, some may host multiple times</li>
              <li>• You can edit assignments after generation using drag and drop</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
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
              icon={Users}
              disabled={submitting || finalEligibleMembers.length === 0}
              loading={submitting}
            >
              Generate Schedule
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GenerateScheduleModal;