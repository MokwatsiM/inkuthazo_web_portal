// src/components/contributions/DeleteContributionModal.tsx
import React from 'react';
import Button from '../ui/Button';
import type { Contribution } from '../../types';

interface DeleteContributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  contribution: Contribution;
}

const DeleteContributionModal: React.FC<DeleteContributionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  contribution
}) => {
  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Error deleting contribution:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Delete Contribution</h2>
        <p className="mb-4">
          Are you sure you want to delete this contribution of R{contribution.amount.toFixed(2)} from {contribution.members?.full_name}? 
          This action cannot be undone.
        </p>
        <div className="flex justify-end space-x-3">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm}>Delete</Button>
        </div>
      </div>
    </div>
  );
};

export default DeleteContributionModal;
