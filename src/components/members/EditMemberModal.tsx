import React, { useState, useEffect } from "react";
import Button from "../ui/Button";
import { useAuth } from "../../hooks/useAuth";
import { toFirestoreTimestamp } from "../../utils/dateUtils";
import type { Member } from "../../types";
import { format } from "date-fns";

interface EditMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Member>) => Promise<void>;
  member: Member;
}

const EditMemberModal: React.FC<EditMemberModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  member,
}) => {
  const { isAdmin } = useAuth();
  const [formData, setFormData] = useState({
    full_name: member.full_name,
    email: member.email,
    phone: member.phone,
    status: member.status,
    role: member.role,
    join_date: format(member.join_date.toDate(), "yyyy-MM-dd"),
  });

  useEffect(() => {
    setFormData({
      full_name: member.full_name,
      email: member.email,
      phone: member.phone,
      status: member.status,
      role: member.role,
      join_date: format(member.join_date.toDate(), "yyyy-MM-dd"),
    });
  }, [member]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updatedData: Partial<Member> = {
        ...formData,
        join_date: toFirestoreTimestamp(formData.join_date),
      };
      await onSubmit(updatedData);
      onClose();
    } catch (error) {
      console.error("Error updating member:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Edit Member</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    full_name: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                disabled={isAdmin === false}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                type="tel"
                pattern="[0-9]{10}$"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
                maxLength={10}
              />
            </div>
            {isAdmin && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Join Date
                </label>
                <input
                  type="date"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  value={formData.join_date}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      join_date: e.target.value,
                    }))
                  }
                />
              </div>
            )}

            {isAdmin && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <select
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  value={formData.role}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      role: e.target.value as Member["role"],
                    }))
                  }
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            )}
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Update Member</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMemberModal;
