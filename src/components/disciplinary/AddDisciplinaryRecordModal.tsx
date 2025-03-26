import React, { useState } from "react";
import Button from "../ui/Button";
import { useAuth } from "../../hooks/useAuth";
import { useMembers } from "../../hooks/useMembers";
import type { DisciplinaryRecord } from "../../types";
import { toFirestoreTimestamp } from "../../utils/dateUtils";

interface AddDisciplinaryRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    data: Omit<DisciplinaryRecord, "id" | "status" | "created_at">
  ) => Promise<void>;
  memberId?: string;
}

const AddDisciplinaryRecordModal: React.FC<AddDisciplinaryRecordModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  memberId: defaultMemberId,
}) => {
  const { userDetails } = useAuth();
  const { members } = useMembers();
  const [formData, setFormData] = useState({
    member_id: defaultMemberId || "",
    infringement_type: "",
    description: "",
    penalty_amount: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen || !userDetails) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.member_id) {
      alert("Please select a member");
      return;
    }

    setLoading(true);

    try {
      await onSubmit({
        member_id: formData.member_id,
        infringement_type: formData.infringement_type,
        description: formData.description,
        penalty_amount: formData.penalty_amount
          ? parseFloat(formData.penalty_amount)
          : undefined,
        date: toFirestoreTimestamp(new Date(formData.date)),
        created_by: userDetails.id,
      });
      onClose();
    } catch (error) {
      console.error("Error adding disciplinary record:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Add Disciplinary Record</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!defaultMemberId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Member
              </label>
              <select
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200"
                value={formData.member_id}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    member_id: e.target.value,
                  }))
                }
              >
                <option value="">Select a member</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.full_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Infringement Type
            </label>
            <select
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200"
              value={formData.infringement_type}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  infringement_type: e.target.value,
                }))
              }
            >
              <option value="Non-payment of Contributions">
                Non payment/Late Payment
              </option>
              <option value="Non-attendance-meetings">
                Non-attendance meetings
              </option>
              <option value="Late attendance">Late attendance</option>
              <option value="Other">Other Reasons</option>
              {/* <option value="">Select a Infringement type</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.full_name}
                </option> */}
              {/* ))} */}
            </select>

            {/* <input
              type="text"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200"
              value={formData.infringement_type}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  infringement_type: e.target.value,
                }))
              }
              placeholder="e.g., Meeting Absence, Late Payment"
            /> */}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200"
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Provide details about the infringement..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Penalty Amount (Optional)
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">R</span>
              </div>
              <input
                type="number"
                step="0.01"
                className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200"
                value={formData.penalty_amount}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    penalty_amount: e.target.value,
                  }))
                }
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Date of Infringement
            </label>
            <input
              type="date"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200"
              value={formData.date}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, date: e.target.value }))
              }
            />
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Record"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDisciplinaryRecordModal;
