// src/components/credits/CreateCreditModal.tsx
import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calculator } from 'lucide-react';
import Button from '../ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { createCredit, getMemberActiveCredit } from '../../services/creditService';
import { getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import type { Member } from '../../types';
import logger from '../../utils/logger';

interface CreateCreditModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CreateCreditModal: React.FC<CreateCreditModalProps> = ({ onClose, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [formData, setFormData] = useState({
    member_id: '',
    member_name: '',
    reason: '',
    description: '',
    principal_amount: '',
    additional_fee: '',
    installments: '3',
  });

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const membersRef = collection(db, 'members');
      const q = query(membersRef, where('status', '==', 'approved'));
      const snapshot = await getDocs(q);
      const membersList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Member[];
      setMembers(membersList);
    } catch (error) {
      logger.error('Error fetching members:', error);
    }
  };

  const handleChange = async (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Auto-fill member name when member is selected
    if (name === 'member_id' && value) {
      const selectedMember = members.find((m) => m.id === value);
      if (selectedMember) {
        // Check if member already has an active credit
        const activeCredit = await getMemberActiveCredit(value);
        if (activeCredit) {
          alert(
            `${selectedMember.full_name} already has an active credit of R${activeCredit.terms.total_amount.toFixed(2)}. A member can only have one active credit at a time.`
          );
          setFormData({ ...formData, member_id: '', member_name: '' });
          return;
        }
        setFormData({ ...formData, member_id: value, member_name: selectedMember.full_name });
      }
    }
  };

  const calculateTotals = () => {
    const principal = parseFloat(formData.principal_amount) || 0;
    const fee = parseFloat(formData.additional_fee) || 0;
    const total = principal + fee;
    const installments = parseInt(formData.installments) || 1;
    const perInstallment = total / installments;

    return {
      total,
      perInstallment,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate
    if (!formData.member_id) {
      alert('Please select a member');
      return;
    }

    const principal = parseFloat(formData.principal_amount);
    if (principal <= 0) {
      alert('Principal amount must be greater than 0');
      return;
    }

    const installments = parseInt(formData.installments);
    if (installments <= 0) {
      alert('Installments must be at least 1');
      return;
    }

    setLoading(true);
    try {
      await createCredit(
        {
          member_id: formData.member_id,
          member_name: formData.member_name,
          reason: formData.reason,
          description: formData.description || undefined,
          principal_amount: principal,
          additional_fee: parseFloat(formData.additional_fee) || 0,
          installments,
        },
        user.uid,
        user.email || 'Admin'
      );

      alert('Credit created successfully and sent for chairperson review!');
      onSuccess();
    } catch (error) {
      logger.error('Error creating credit:', error);
      alert('Failed to create credit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const { total, perInstallment } = calculateTotals();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-surface-dark rounded-[20px] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-surface-dark border-b border-gray-200 dark:border-gray-700 p-6 rounded-t-[20px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Create Member Credit
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  This will be sent to chairperson for review
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Member Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Member <span className="text-red-500">*</span>
            </label>
            <select
              name="member_id"
              value={formData.member_id}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all dark:text-white"
            >
              <option value="">Choose a member...</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.full_name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Members can only have one active credit at a time
            </p>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Reason for Credit <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              required
              placeholder="e.g., Medical Emergency, Education, Business"
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all dark:text-white"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Additional Details (Optional)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Provide any additional context or details..."
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all dark:text-white resize-none"
            />
          </div>

          {/* Credit Terms Card */}
          <div className="bg-gradient-to-br from-purple-50 to-teal-50 dark:from-purple-900/20 dark:to-teal-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Credit Terms</h3>
            </div>

            <div className="space-y-4">
              {/* Principal Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Principal Amount (R) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="principal_amount"
                  value={formData.principal_amount}
                  onChange={handleChange}
                  required
                  min="1"
                  step="0.01"
                  placeholder="1000.00"
                  className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all dark:text-white"
                />
              </div>

              {/* Additional Fee */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Additional Fee (R)
                </label>
                <input
                  type="number"
                  name="additional_fee"
                  value={formData.additional_fee}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Optional processing or administrative fee
                </p>
              </div>

              {/* Installments */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Number of Installments <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="installments"
                  value={formData.installments}
                  onChange={handleChange}
                  required
                  min="1"
                  step="1"
                  placeholder="3"
                  className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  How many payments will the member make?
                </p>
              </div>

              {/* Calculated Totals */}
              <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Amount:</span>
                    <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                      R {total.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Per Installment:
                    </span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      R {perInstallment.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Info Banner */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>Note:</strong> This credit will be sent to the chairperson for review. Once
              approved, an expense entry will be automatically created, and the member can start
              making payments through the contributions system.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} loading={loading} className="flex-1">
              Create Credit Request
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCreditModal;
