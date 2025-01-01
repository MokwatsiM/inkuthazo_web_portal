import React, { useState, useRef } from "react";
import { Upload } from "lucide-react";
import Button from "../ui/Button";
import type { Contribution } from "../../types/contribution";
import { toFirestoreTimestamp } from "../../utils/dateUtils";
import { useNotifications } from "../../hooks/useNotifications";
import { Member } from "../../types";

interface AddContributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    data: Omit<Contribution, "id" | "members" | "status">,
    file?: File
  ) => Promise<void>;
  isAdmin: boolean;
  members?: Member[];
}

const AddContributionModal: React.FC<AddContributionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isAdmin,
  members,
}) => {
  const { showError } = useNotifications();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    member_id: "",
    amount: "",
    type: "monthly" as Contribution["type"],
    date: new Date().toISOString().split("T")[0],
  });
  const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSubmit(
        {
          member_id: formData.member_id,
          amount: parseFloat(formData.amount),
          type: formData.type,
          date: toFirestoreTimestamp(new Date(formData.date)),
        },
        selectedFile
      );

      onClose();
      setFormData({
        member_id: "",
        amount: "",
        type: "monthly",
        date: new Date().toISOString().split("T")[0],
      });
      setSelectedFile(undefined);
    } catch (error) {
      showError(
        error instanceof Error ? error.message : "Failed to add contribution"
      );
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Record New Contribution</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {isAdmin && members!.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Member
                </label>
                <select
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  value={formData.member_id}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      member_id: e.target.value,
                    }))
                  }
                >
                  <option value="">Select a member</option>

                  {members!.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.full_name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Amount (R)
              </label>
              <input
                type="number"
                step="0.01"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                value={formData.amount}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, amount: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Type
              </label>
              <select
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                value={formData.type}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    type: e.target.value as Contribution["type"],
                  }))
                }
              >
                <option value="monthly">Monthly</option>
                <option value="registration">Registration</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Date
              </label>
              <input
                type="date"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                value={formData.date}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, date: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Proof of Payment
              </label>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                required={!isAdmin} // Required for members, optional for admins
              />
              <div className="mt-1 flex items-center">
                <Button
                  type="button"
                  variant="secondary"
                  icon={Upload}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {selectedFile ? selectedFile.name : "Upload File"}
                </Button>
              </div>
              {selectedFile && (
                <p className="mt-2 text-sm text-gray-500">
                  Selected file: {selectedFile.name}
                </p>
              )}
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Record Contribution</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddContributionModal;
