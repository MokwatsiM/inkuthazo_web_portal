import React, { useState } from 'react';
import { useMembers } from '../../hooks/useMembers';
import Button from '../ui/Button';
import type { Payout } from '../../types';

interface AddPayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Payout, 'id' | 'members'>) => Promise<void>;
}

const AddPayoutModal: React.FC<AddPayoutModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const { members } = useMembers();
  const [formData, setFormData] = useState({
    member_id: '',
    amount: '',
    reason: '',
    status: 'pending' as Payout['status']
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSubmit({
        ...formData,
        amount: parseFloat(formData.amount)
      });
      onClose();
    } catch (error) {
      console.error('Error adding payout:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Record New Payout</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Member</label>
              <select
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                value={formData.member_id}
                onChange={e => setFormData(prev => ({ ...prev, member_id: e.target.value }))}
              >
                <option value="">Select a member</option>
                {members.map(member => (
                  <option key={member.id} value={member.id}>
                    {member.full_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Amount (R)</label>
              <input
                type="number"
                step="0.01"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                value={formData.amount}
                onChange={e => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Reason</label>
              <textarea
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                value={formData.reason}
                onChange={e => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                value={formData.status}
                onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as Payout['status'] }))}
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit">Record Payout</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPayoutModal;