import React, { useState } from 'react';
import Button from '../ui/Button';
import type { Member } from '../../types';
import logger from '../../utils/logger';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Member, 'id' | 'join_date'>) => Promise<void>;
}

const AddMemberModal: React.FC<AddMemberModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    join_date: new Date().toISOString().split('T')[0],
    status: 'active' as Member['status'],
    role: 'member' as Member['role']
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSubmit(formData);
      onClose();
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        join_date: new Date().toISOString().split('T')[0],
        status: 'active',
        role: 'member'
      });
    } catch (error) {
      logger.error('Error adding member:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-surface dark:bg-surface-dark rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-text-primary dark:text-text-primary-dark">Add New Member</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary dark:text-text-primary-dark">Full Name</label>
              <input
                type="text"
                required
                className="mt-1 block w-full rounded-input border border-line dark:border-line-dark shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark"
                value={formData.full_name}
                onChange={e => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary dark:text-text-primary-dark">Email</label>
              <input
                type="email"
                required
                className="mt-1 block w-full rounded-input border border-line dark:border-line-dark shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark"
                value={formData.email}
                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary dark:text-text-primary-dark">Phone</label>
              <input
                type="tel"
                required
                className="mt-1 block w-full rounded-input border border-line dark:border-line-dark shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark"
                value={formData.phone}
                onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary dark:text-text-primary-dark">Join Date</label>
              <input
                type="date"
                required
                className="mt-1 block w-full rounded-input border border-line dark:border-line-dark shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark"
                value={formData.join_date}
                onChange={e => setFormData(prev => ({ ...prev, join_date: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary dark:text-text-primary-dark">Status</label>
              <select
                required
                className="mt-1 block w-full rounded-input border border-line dark:border-line-dark shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark"
                value={formData.status}
                onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as Member['status'] }))}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary dark:text-text-primary-dark">Role</label>
              <select
                required
                className="mt-1 block w-full rounded-input border border-line dark:border-line-dark shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark"
                value={formData.role}
                onChange={e => setFormData(prev => ({ ...prev, role: e.target.value as Member['role'] }))}
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit">Add Member</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMemberModal;