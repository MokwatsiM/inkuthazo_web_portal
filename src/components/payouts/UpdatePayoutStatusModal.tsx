// src/components/payouts/UpdatePayoutStatusModal.tsx
import React, { useState } from 'react';
import Button from '../ui/Button';
import type { Payout } from '../../types';

interface UpdatePayoutStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (status: Payout['status']) => Promise<void>;
  payout: Payout;
}

const UpdatePayoutStatusModal: React.FC<UpdatePayoutStatusModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  payout
}) => {
  const [status, setStatus] = useState<Payout['status']>(payout.status);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      await onConfirm(status);
      onClose();
    } catch (error) {
      console.error('Error updating payout status:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Update Payout Status</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <select
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            value={status}
            onChange={(e) => setStatus(e.target.value as Payout['status'])}
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="paid">Paid</option>
          </select>
        </div>
        <div className="flex justify-end space-x-3">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm}>Update Status</Button>
        </div>
      </div>
    </div>
  );
};

export default UpdatePayoutStatusModal;
