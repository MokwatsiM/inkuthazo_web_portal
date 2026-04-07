// src/components/credits/CreditDetailModal.tsx
import React, { useState } from 'react';
import {
  X,
  DollarSign,
  User,
  FileText,
  Calendar,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';
import { format } from 'date-fns';
import Button from '../ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { provideAdditionalInfo, deleteCredit } from '../../services/creditService';
import type { Credit } from '../../types/credit';
import logger from '../../utils/logger';

interface CreditDetailModalProps {
  credit: Credit;
  onClose: () => void;
  onUpdate: () => void;
}

const CreditDetailModal: React.FC<CreditDetailModalProps> = ({ credit, onClose, onUpdate }) => {
  const { user } = useAuth();
  const [showInfoResponse, setShowInfoResponse] = useState(false);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const getStatusColor = (status: string) => {
    const colors = {
      pending_review: 'from-yellow-500 to-yellow-600',
      needs_info: 'from-blue-500 to-blue-600',
      approved: 'from-green-500 to-green-600',
      rejected: 'from-red-500 to-red-600',
      active: 'from-purple-500 to-purple-600',
      settled: 'from-gray-500 to-gray-600',
      defaulted: 'from-orange-500 to-orange-600',
    };
    return colors[status as keyof typeof colors] || 'from-gray-500 to-gray-600';
  };

  const handleProvideInfo = async () => {
    if (!user || !additionalInfo.trim()) return;

    setLoading(true);
    try {
      await provideAdditionalInfo(credit.id, additionalInfo, user.uid);
      alert('Additional information provided successfully!');
      setShowInfoResponse(false);
      setAdditionalInfo('');
      onUpdate();
    } catch (error) {
      logger.error('Error providing additional info:', error);
      alert('Failed to provide additional information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;

    if (credit.payments.length > 0) {
      alert('Cannot delete credit with existing payments');
      return;
    }

    if (!confirm(`Are you sure you want to delete this credit for ${credit.member_name}?`)) {
      return;
    }

    setLoading(true);
    try {
      await deleteCredit(credit.id, user.uid);
      alert('Credit deleted successfully!');
      onUpdate();
      onClose();
    } catch (error) {
      logger.error('Error deleting credit:', error);
      alert('Failed to delete credit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const progress = (credit.total_paid / credit.terms.total_amount) * 100;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-surface-dark rounded-[20px] shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-50 to-teal-50 dark:from-purple-900/20 dark:to-teal-900/20 border-b border-gray-200 dark:border-gray-700 p-6 rounded-t-[20px]">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Credit Details
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
          {/* Status Banner */}
          <div
            className={`bg-gradient-to-r ${getStatusColor(credit.status)} rounded-xl p-4 text-white`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  {credit.status === 'active' || credit.status === 'settled' ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <AlertCircle className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium opacity-90">Status</p>
                  <p className="text-lg font-bold capitalize">
                    {credit.status.replace('_', ' ')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">R {credit.terms.total_amount.toFixed(2)}</p>
                <p className="text-sm opacity-90">Total Amount</p>
              </div>
            </div>
          </div>

          {/* Member Information */}
          <div className="bg-gray-50 dark:bg-gray-900/30 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Member Information
              </h3>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Name</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {credit.member_name}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Member ID</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white font-mono">
                  {credit.member_id}
                </p>
              </div>
            </div>
          </div>

          {/* Credit Details */}
          <div className="bg-gray-50 dark:bg-gray-900/30 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Credit Details</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Reason</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{credit.reason}</p>
              </div>
              {credit.description && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Description</p>
                  <p className="text-sm text-gray-900 dark:text-white">{credit.description}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Created By</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {credit.created_by_name}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Created On</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {format(credit.created_at.toDate(), 'MMMM dd, yyyy HH:mm')}
                </p>
              </div>
            </div>
          </div>

          {/* Credit Terms */}
          <div className="bg-gray-50 dark:bg-gray-900/30 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Payment Terms</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Principal Amount</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  R {credit.terms.principal_amount.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Additional Fee</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  R {credit.terms.additional_fee.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Installments</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {credit.terms.installments} payments
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Per Installment</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  R {credit.terms.installment_amount.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Progress */}
          {(credit.status === 'active' || credit.status === 'settled') && (
            <div className="bg-gray-50 dark:bg-gray-900/30 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Payment Progress
                </h3>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span>
                      Paid: R {credit.total_paid.toFixed(2)} of R{' '}
                      {credit.terms.total_amount.toFixed(2)}
                    </span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Payments Made</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {credit.payments.length} / {credit.terms.installments}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Remaining Balance</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      R {credit.remaining_balance.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Payment History */}
                {credit.payments.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Payment History
                    </p>
                    <div className="space-y-2">
                      {credit.payments.map((payment) => (
                        <div
                          key={payment.id}
                          className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                Payment {payment.payment_number}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {format(payment.paid_at.toDate(), 'MMM dd, yyyy')}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">
                            R {payment.amount.toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Review Information */}
          {credit.review && (
            <div className="bg-gray-50 dark:bg-gray-900/30 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Review Details</h3>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Reviewed By</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {credit.review.reviewer_name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Action</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                    {credit.review.action.replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Notes</p>
                  <p className="text-sm text-gray-900 dark:text-white">{credit.review.notes}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Reviewed On</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {format(credit.review.reviewed_at.toDate(), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
                {credit.review.additional_info_requested && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Information Requested
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {credit.review.additional_info_requested}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Additional Info Response (if provided) */}
          {credit.additional_info_response && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                Additional Information Provided
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                {credit.additional_info_response}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                Updated {format(credit.additional_info_updated_at!.toDate(), 'MMM dd, yyyy HH:mm')}
              </p>
            </div>
          )}

          {/* Needs Info - Provide Response */}
          {credit.status === 'needs_info' && !showInfoResponse && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-300 mb-3">
                The chairperson has requested additional information for this credit.
              </p>
              <Button onClick={() => setShowInfoResponse(true)} variant="secondary" size="small">
                Provide Additional Information
              </Button>
            </div>
          )}

          {/* Info Response Form */}
          {showInfoResponse && (
            <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3">
                Provide Additional Information
              </h4>
              <textarea
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                rows={4}
                placeholder="Enter the requested information..."
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all dark:text-white resize-none mb-3"
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowInfoResponse(false)}
                  variant="secondary"
                  size="small"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleProvideInfo}
                  size="small"
                  disabled={loading || !additionalInfo.trim()}
                  loading={loading}
                >
                  Submit Information
                </Button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            {credit.payments.length === 0 && credit.status === 'pending_review' && (
              <Button
                onClick={handleDelete}
                variant="secondary"
                disabled={loading}
                className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Delete Credit
              </Button>
            )}
            <Button onClick={onClose} variant="secondary" className="flex-1">
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditDetailModal;
