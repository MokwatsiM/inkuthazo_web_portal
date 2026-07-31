// src/components/donations/DonationFormModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import Button from '../ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { createDonation } from '../../services/donationService';
import { getDocs, collection } from 'firebase/firestore';
import { db } from '../../config/firebase';
import type { DonationType, DonationSource } from '../../types/donation';
import type { Member } from '../../types';
import logger from '../../utils/logger';

interface DonationFormModalProps {
  onClose: () => void;
}

const DonationFormModal: React.FC<DonationFormModalProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [formData, setFormData] = useState({
    source: 'outsider' as DonationSource,
    donor_name: '',
    member_id: '',
    organization: '',
    contact_email: '',
    contact_phone: '',
    type: 'donation' as DonationType,
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    purpose: '',
    payment_method: '',
    reference_number: '',
    tax_deductible: false,
  });

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const membersRef = collection(db, 'members');
      const snapshot = await getDocs(membersRef);
      const membersList = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as Member)
      );
      setMembers(membersList.filter((m) => m.status === 'approved'));
    } catch (error) {
      logger.error('Error fetching members:', error);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });

      // Auto-fill donor name if member is selected
      if (name === 'member_id' && value) {
        const selectedMember = members.find((m) => m.id === value);
        if (selectedMember) {
          setFormData({
            ...formData,
            member_id: value,
            donor_name: selectedMember.full_name,
            contact_email: selectedMember.email,
            contact_phone: selectedMember.phone,
          });
        }
      }

      // Clear member_id if source changes away from member
      if (name === 'source' && value !== 'member') {
        setFormData({
          ...formData,
          source: value as DonationSource,
          member_id: '',
          donor_name: '',
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const donationData = {
        source: formData.source,
        donor_name: formData.donor_name,
        member_id: formData.source === 'member' ? formData.member_id : undefined,
        organization: formData.source === 'organization' ? formData.organization : undefined,
        contact_email: formData.contact_email || undefined,
        contact_phone: formData.contact_phone || undefined,
        type: formData.type,
        // In-kind donations may have no value; a blank estimate is recorded
        // as 0 and is excluded from the org's monetary totals either way.
        amount: parseFloat(formData.amount) || 0,
        date: Timestamp.fromDate(new Date(formData.date)),
        description: formData.description || undefined,
        purpose: formData.purpose || undefined,
        payment_method: formData.payment_method || undefined,
        reference_number: formData.reference_number || undefined,
        tax_deductible: formData.tax_deductible,
        created_by: user.uid,
      };

      await createDonation(donationData, user.uid, user.email || undefined);

      alert('Donation added successfully!');
      onClose();
    } catch (error) {
      logger.error('Error creating donation:', error);
      alert('Failed to add donation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isInKind = formData.type === 'in_kind';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-surface-dark rounded-[20px] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-surface-dark border-b border-gray-200 dark:border-gray-700 p-6 rounded-t-[20px]">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Add Donation/Investment
            </h2>
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
          {/* Source Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Source <span className="text-red-500">*</span>
            </label>
            <select
              name="source"
              value={formData.source}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all dark:text-white"
            >
              <option value="member">Member</option>
              <option value="outsider">Outsider</option>
              <option value="organization">Organization</option>
            </select>
          </div>

          {/* Member Selection (if source is member) */}
          {formData.source === 'member' && (
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
                <option value="">Select a member...</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.full_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Donor Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Donor Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="donor_name"
              value={formData.donor_name}
              onChange={handleChange}
              required
              disabled={formData.source === 'member' && !!formData.member_id}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all dark:text-white disabled:opacity-50"
              placeholder="Enter donor name"
            />
          </div>

          {/* Organization (if source is organization) */}
          {formData.source === 'organization' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Organization Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="organization"
                value={formData.organization}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all dark:text-white"
                placeholder="Enter organization name"
              />
            </div>
          )}

          {/* Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Contact Email
              </label>
              <input
                type="email"
                name="contact_email"
                value={formData.contact_email}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all dark:text-white"
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Contact Phone
              </label>
              <input
                type="tel"
                name="contact_phone"
                value={formData.contact_phone}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all dark:text-white"
                placeholder="+27 00 000 0000"
              />
            </div>
          </div>

          {/* Type and Amount */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type <span className="text-red-500">*</span>
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all dark:text-white"
              >
                <option value="investment">Investment</option>
                <option value="donation">Donation</option>
                <option value="sponsorship">Sponsorship</option>
                <option value="grant">Grant</option>
                <option value="in_kind">In-kind (goods / paid on our behalf)</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {isInKind ? (
                  <>Estimated value (R){" "}
                    <span className="text-xs text-gray-400">(optional)</span>
                  </>
                ) : (
                  <>Amount (R) <span className="text-red-500">*</span></>
                )}
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                required={!isInKind}
                min="0"
                step="0.01"
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all dark:text-white"
                placeholder={isInKind ? "e.g. 2000 (optional)" : "0.00"}
              />
            </div>
          </div>

          {isInKind && (
            <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 text-xs text-amber-800 dark:text-amber-300">
              In-kind donations (goods given, or something bought/subscribed on
              the club's behalf) are recorded for the log but do{" "}
              <strong>not</strong> add to the club's cash balance. Use the
              description below to note what was contributed. The estimated
              value is optional and for reporting only.
            </div>
          )}

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all dark:text-white"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all dark:text-white resize-none"
              placeholder="Enter additional details..."
            />
          </div>

          {/* Purpose */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Purpose
            </label>
            <input
              type="text"
              name="purpose"
              value={formData.purpose}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all dark:text-white"
              placeholder="What is this donation for?"
            />
          </div>

          {/* Payment Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Payment Method
              </label>
              <select
                name="payment_method"
                value={formData.payment_method}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all dark:text-white"
              >
                <option value="">Select method...</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="EFT">EFT</option>
                <option value="Cash">Cash</option>
                <option value="Check">Check</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reference Number
              </label>
              <input
                type="text"
                name="reference_number"
                value={formData.reference_number}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all dark:text-white"
                placeholder="Transaction reference"
              />
            </div>
          </div>

          {/* Tax Deductible */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="tax_deductible"
              checked={formData.tax_deductible}
              onChange={handleChange}
              id="tax_deductible"
              className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
            />
            <label
              htmlFor="tax_deductible"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Tax Deductible
            </label>
          </div>

          {/* Note about member contributions */}
          {formData.source === 'member' && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>Note:</strong> This donation will NOT count towards the member's monthly
                contribution requirements. It is tracked separately as additional income.
              </p>
            </div>
          )}

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
              Add Donation
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DonationFormModal;
