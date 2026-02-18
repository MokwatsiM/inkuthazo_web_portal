// src/components/credits/ReviewCreditModal.tsx
import React, { useState } from 'react';
import { X, CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import Button from '../ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { reviewCredit } from '../../services/creditService';
import type { Credit, CreditReviewAction } from '../../types/credit';

interface ReviewCreditModalProps {
  credit: Credit;
  onClose: () => void;
  onSuccess: () => void;
}

const ReviewCreditModal: React.FC<ReviewCreditModalProps> = ({ credit, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<CreditReviewAction>('approve');
  const [notes, setNotes] = useState('');
  const [additionalInfoRequested, setAdditionalInfoRequested] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!notes.trim()) {
      alert('Please provide review notes');
      return;
    }

    if (action === 'request_info' && !additionalInfoRequested.trim()) {
      alert('Please specify what additional information is needed');
      return;
    }

    // Confirmation for approve/reject
    if (action === 'approve') {
      if (
        !confirm(
          `Are you sure you want to APPROVE this credit of R${credit.terms.total_amount.toFixed(2)} for ${credit.member_name}?\n\nThis will create an expense entry and activate the credit.`
        )
      ) {
        return;
      }
    }

    if (action === 'reject') {
      if (
        !confirm(
          `Are you sure you want to REJECT this credit request for ${credit.member_name}?\n\nThis action cannot be undone.`
        )
      ) {
        return;
      }
    }

    setLoading(true);
    try {
      await reviewCredit(
        credit.id,
        action,
        notes,
        user.uid,
        user.email || 'Chairperson',
        action === 'request_info' ? additionalInfoRequested : undefined
      );

      const actionText =
        action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'sent back';
      alert(`Credit ${actionText} successfully!`);
      onSuccess();
    } catch (error) {
      console.error('Error reviewing credit:', error);
      alert('Failed to review credit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = () => {
    switch (action) {
      case 'approve':
        return <CheckCircle className="w-6 h-6 text-white" />;
      case 'reject':
        return <XCircle className="w-6 h-6 text-white" />;
      case 'request_info':
        return <Info className="w-6 h-6 text-white" />;
    }
  };

  const getActionColor = () => {
    switch (action) {
      case 'approve':
        return 'from-green-500 to-green-600';
      case 'reject':
        return 'from-red-500 to-red-600';
      case 'request_info':
        return 'from-blue-500 to-blue-600';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-surface-dark rounded-[20px] shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-50 to-teal-50 dark:from-purple-900/20 dark:to-teal-900/20 border-b border-gray-200 dark:border-gray-700 p-6 rounded-t-[20px]">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className={`w-16 h-16 bg-gradient-to-br ${getActionColor()} rounded-xl flex items-center justify-center shadow-lg`}>
                {getActionIcon()}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Review Credit Request
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">{credit.member_name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/50 dark:hover:bg-gray-800 rounded-xl transition-all"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Credit Summary */}
          <div className="bg-gray-50 dark:bg-gray-900/30 rounded-xl p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Credit Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Member</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {credit.member_name}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Request Date</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {format(credit.created_at.toDate(), 'MMMM dd, yyyy')}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Amount</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  R {credit.terms.total_amount.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Principal: R{credit.terms.principal_amount.toFixed(2)} + Fee: R
                  {credit.terms.additional_fee.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Payment Plan</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {credit.terms.installments} Installments
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  R{credit.terms.installment_amount.toFixed(2)} per payment
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Reason</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {credit.reason}
                </p>
              </div>
              {credit.description && (
                <div className="md:col-span-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Description</p>
                  <p className="text-sm text-gray-900 dark:text-white">{credit.description}</p>
                </div>
              )}
              <div className="md:col-span-2">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Created By</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {credit.created_by_name}
                </p>
              </div>
            </div>
          </div>

          {/* Additional Info (if re-reviewing) */}
          {credit.additional_info_response && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                Additional Information Provided
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                {credit.additional_info_response}
              </p>
            </div>
          )}

          {/* Review Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Action Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Your Decision <span className="text-red-500">*</span>
              </label>
              <div className="space-y-3">
                {/* Approve */}
                <label className="flex items-start gap-3 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-all has-[:checked]:border-green-500 has-[:checked]:bg-green-50 dark:has-[:checked]:bg-green-900/20">
                  <input
                    type="radio"
                    name="action"
                    value="approve"
                    checked={action === 'approve'}
                    onChange={(e) => setAction(e.target.value as CreditReviewAction)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <span className="font-medium text-gray-900 dark:text-white">
                        Approve Credit
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Approve this credit request. An expense will be created and the member can
                      start making payments.
                    </p>
                  </div>
                </label>

                {/* Reject */}
                <label className="flex items-start gap-3 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-all has-[:checked]:border-red-500 has-[:checked]:bg-red-50 dark:has-[:checked]:bg-red-900/20">
                  <input
                    type="radio"
                    name="action"
                    value="reject"
                    checked={action === 'reject'}
                    onChange={(e) => setAction(e.target.value as CreditReviewAction)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                      <span className="font-medium text-gray-900 dark:text-white">
                        Reject Credit
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Reject this credit request. The member will be notified of the rejection.
                    </p>
                  </div>
                </label>

                {/* Request Info */}
                <label className="flex items-start gap-3 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-all has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 dark:has-[:checked]:bg-blue-900/20">
                  <input
                    type="radio"
                    name="action"
                    value="request_info"
                    checked={action === 'request_info'}
                    onChange={(e) => setAction(e.target.value as CreditReviewAction)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <span className="font-medium text-gray-900 dark:text-white">
                        Request More Information
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Send this back to the admin to provide additional details before making a
                      decision.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Additional Info Request (if action is request_info) */}
            {action === 'request_info' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  What information do you need? <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={additionalInfoRequested}
                  onChange={(e) => setAdditionalInfoRequested(e.target.value)}
                  required
                  rows={3}
                  placeholder="Specify what additional information is required..."
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white resize-none"
                />
              </div>
            )}

            {/* Review Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Review Notes <span className="text-red-500">*</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                required
                rows={4}
                placeholder="Provide your review notes and reasoning..."
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all dark:text-white resize-none"
              />
            </div>

            {/* Warning for Approve */}
            {action === 'approve' && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-900 dark:text-yellow-300 mb-1">
                      Confirm Approval
                    </p>
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      By approving this credit, an expense of R
                      {credit.terms.total_amount.toFixed(2)} will be automatically created, and the
                      member will be able to start making repayments. This action cannot be undone.
                    </p>
                  </div>
                </div>
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
                {action === 'approve'
                  ? 'Approve Credit'
                  : action === 'reject'
                  ? 'Reject Credit'
                  : 'Request Information'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReviewCreditModal;
