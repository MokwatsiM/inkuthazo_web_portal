import React from "react";
import Button from "../ui/Button";
import type { Member } from "../../types";

interface ApproveMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  member: Member;
}

const ApproveMemberModal: React.FC<ApproveMemberModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  member,
}) => {
  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error("Error approving member:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Approve Member</h2>
        <p className="mb-4">
          Are you sure you want to approve {member.full_name}? This will allow
          them to make contributions.
        </p>
        <div className="flex justify-end space-x-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>Approve</Button>
        </div>
      </div>
    </div>
  );
};

export default ApproveMemberModal;
