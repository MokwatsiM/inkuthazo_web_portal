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
      <div className="bg-surface dark:bg-surface-dark rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-line dark:border-line-dark">
          <div className="flex items-center">
            <Calendar className="w-6 h-6 text-primary-600 mr-3" />
            <h2 className="text-xl font-semibold text-text-primary dark:text-text-primary-dark">
              Generate Host Schedule for {year}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-hover dark:hover:bg-surface-hover-dark rounded-lg transition-colors text-text-primary dark:text-text-primary-dark"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-surface-secondary dark:bg-surface-secondary-dark rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-text-primary dark:text-text-primary-dark">{eligibleMembers.length}</div>
              <div className="text-sm text-text-secondary dark:text-text-secondary-dark">Total Eligible</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">{finalEligibleMembers.length}</div>
              <div className="text-sm text-text-secondary dark:text-text-secondary-dark">Will Be Included</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-text-secondary dark:text-text-secondary-dark">12</div>
              <div className="text-sm text-text-secondary dark:text-text-secondary-dark">Months Needed</div>
            </div>
          </div>

          {/* Warning if insufficient members */}
          {finalEligibleMembers.length < 12 && (
            <div className="flex items-center p-4 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-warning-800 dark:text-warning-200">
                  Insufficient Members
                </p>
                <p className="text-sm text-warning-700 dark:text-warning-300">
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
                className="mt-0.5 h-4 w-4 text-primary-600 border-line dark:border-line-dark rounded focus:ring-primary-500 bg-surface dark:bg-surface-dark"
              />
              <div className="ml-3">
                <div className="text-sm font-medium text-text-primary dark:text-text-primary-dark">
                  Exclude administrators from hosting ({adminMembers.length} admins)
                </div>
                <div className="text-sm text-text-secondary dark:text-text-secondary-dark">
                  Admins typically manage the meetings rather than host them
                </div>
              </div>
            </label>
          </div>

          {/* Member Exclusion List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-text-primary dark:text-text-primary-dark">
                Exclude specific members
              </label>
              <button
                type="button"
                onClick={resetSelections}
                className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300"
              >
                Reset selections
              </button>
            </div>

            {loading ? (
              <div className="text-sm text-text-secondary dark:text-text-secondary-dark">Loading members...</div>
            ) : (
              <div className="max-h-48 overflow-y-auto border border-line dark:border-line-dark rounded-lg">
                {nonAdminMembers.map((member) => (
                  <label
                    key={member.id}
                    className="flex items-center p-3 hover:bg-surface-hover dark:hover:bg-surface-hover-dark border-b border-line dark:border-line-dark last:border-b-0"
                  >
                    <input
                      type="checkbox"
                      checked={excludeMemberIds.includes(member.id)}
                      onChange={(e) => handleMemberExclusionChange(member.id, e.target.checked)}
                      className="h-4 w-4 text-primary-600 border-line dark:border-line-dark rounded focus:ring-primary-500 bg-surface dark:bg-surface-dark"
                    />
                    <div className="ml-3">
                      <div className="text-sm font-medium text-text-primary dark:text-text-primary-dark">
                        {member.full_name}
                      </div>
                      <div className="text-sm text-text-secondary dark:text-text-secondary-dark">
                        {member.email} • {member.status}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Schedule Generation Info */}
          <div className="p-4 bg-info-50 dark:bg-info-900/20 border border-info-200 dark:border-info-800 rounded-lg">
            <h4 className="text-sm font-medium text-info-900 dark:text-info-100 mb-2">
              How schedule generation works:
            </h4>
            <ul className="text-sm text-info-800 dark:text-info-200 space-y-1">
              <li>• Members are randomly assigned to the second Sunday of each month</li>
              <li>• Each eligible member will host approximately once per year</li>
              <li>• If there are fewer than 12 members, some may host multiple times</li>
              <li>• You can edit assignments after generation using drag and drop</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-line dark:border-line-dark">
            <Button
              type="button"
              variant="secondary"
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