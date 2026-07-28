import React, { useState } from "react";
import { getFriendlyErrorMessage } from "../../utils/errorMessages";
import Button from "../ui/Button";
import { UserPlus } from "lucide-react";
import type { Member } from "../../types";

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    data: Pick<Member, "full_name" | "email" | "phone">
  ) => Promise<void>;
}

const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await onSubmit(formData);
      onClose();
      setFormData({ full_name: "", email: "", phone: "" });
    } catch (err) {
      setError(
        getFriendlyErrorMessage(err, "Failed to send invitation")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-surface dark:bg-surface-dark rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-text-primary dark:text-text-primary-dark">Invite New Member</h2>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary dark:text-text-primary-dark">
              Full Name
            </label>
            <input
              type="text"
              required
              className="mt-1 block w-full rounded-input border border-line dark:border-line-dark bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200"
              value={formData.full_name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, full_name: e.target.value }))
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary dark:text-text-primary-dark">
              Email
            </label>
            <input
              type="email"
              required
              className="mt-1 block w-full rounded-input border border-line dark:border-line-dark bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200"
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary dark:text-text-primary-dark">
              Phone
            </label>
            <input
              type="tel"
              required
              className="mt-1 block w-full rounded-input border border-line dark:border-line-dark bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200"
              value={formData.phone}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, phone: e.target.value }))
              }
            />
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" icon={UserPlus} disabled={loading}>
              {loading ? "Sending Invite..." : "Send Invitation"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InviteMemberModal;
