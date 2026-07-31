// src/components/donations/DonationDetailModal.tsx
import React from 'react';
import { X, Users, Building2, Gift, TrendingUp, Award, Target, DollarSign, Calendar, FileText, CreditCard, Hash, Check, Mail, Phone, Package } from 'lucide-react';
import { format } from 'date-fns';
import Button from '../ui/Button';
import type { Donation } from '../../types/donation';
import { isMonetaryDonation } from '../../types/donation';
import { donationAmountDisplay, donationTypeLabel } from '../../utils/donationDisplay';

interface DonationDetailModalProps {
  donation: Donation;
  onClose: () => void;
  onUpdate: () => void;
}

const DonationDetailModal: React.FC<DonationDetailModalProps> = ({
  donation,
  onClose,
}) => {
  const getDonationTypeIcon = (type: string) => {
    switch (type) {
      case 'investment':
        return <TrendingUp className="w-5 h-5 text-white" />;
      case 'donation':
        return <Gift className="w-5 h-5 text-white" />;
      case 'sponsorship':
        return <Award className="w-5 h-5 text-white" />;
      case 'grant':
        return <Target className="w-5 h-5 text-white" />;
      case 'in_kind':
        return <Package className="w-5 h-5 text-white" />;
      default:
        return <DollarSign className="w-5 h-5 text-white" />;
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'member':
        return <Users className="w-5 h-5 text-white" />;
      case 'organization':
        return <Building2 className="w-5 h-5 text-white" />;
      default:
        return <Users className="w-5 h-5 text-white" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'from-green-500 to-green-600';
      case 'rejected':
        return 'from-red-500 to-red-600';
      default:
        return 'from-amber-500 to-amber-600';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-surface-dark rounded-[20px] shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-50 to-teal-50 dark:from-purple-900/20 dark:to-teal-900/20 border-b border-gray-200 dark:border-gray-700 p-6 rounded-t-[20px]">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                {getDonationTypeIcon(donation.type)}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {donation.donor_name}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {donationTypeLabel(donation.type)} Details
                </p>
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
            className={`bg-gradient-to-r ${getStatusColor(donation.status)} rounded-xl p-4 text-white`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium opacity-90">Status</p>
                  <p className="text-lg font-bold">
                    {donation.status.charAt(0).toUpperCase() + donation.status.slice(1)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">{donationAmountDisplay(donation)}</p>
                <p className="text-sm opacity-90">
                  {isMonetaryDonation(donation.type)
                    ? 'Total Amount'
                    : 'Not added to balance'}
                </p>
              </div>
            </div>
          </div>

          {/* Main Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Source Information */}
            <div className="bg-gray-50 dark:bg-gray-900/30 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  {getSourceIcon(donation.source)}
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Source</h3>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Type</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                    {donation.source}
                  </p>
                </div>
                {donation.organization && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Organization</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {donation.organization}
                    </p>
                  </div>
                )}
                {donation.member_id && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Member ID</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white font-mono">
                      {donation.member_id}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Date and Type */}
            <div className="bg-gray-50 dark:bg-gray-900/30 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Details</h3>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Date</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {format(donation.date.toDate(), 'MMMM dd, yyyy')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Type</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {donationTypeLabel(donation.type)}
                  </p>
                </div>
                {donation.tax_deductible && (
                  <div className="flex items-center gap-2 pt-2">
                    <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">
                      Tax Deductible
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          {(donation.contact_email || donation.contact_phone) && (
            <div className="bg-gray-50 dark:bg-gray-900/30 rounded-xl p-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {donation.contact_email && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {donation.contact_email}
                      </p>
                    </div>
                  </div>
                )}
                {donation.contact_phone && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                      <Phone className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {donation.contact_phone}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Description and Purpose */}
          {(donation.description || donation.purpose) && (
            <div className="bg-gray-50 dark:bg-gray-900/30 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Description & Purpose
                </h3>
              </div>
              <div className="space-y-3">
                {donation.description && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Description</p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {donation.description}
                    </p>
                  </div>
                )}
                {donation.purpose && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Purpose</p>
                    <p className="text-sm text-gray-900 dark:text-white">{donation.purpose}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Payment Information */}
          {(donation.payment_method || donation.reference_number) && (
            <div className="bg-gray-50 dark:bg-gray-900/30 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Payment Information
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {donation.payment_method && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Method</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {donation.payment_method}
                    </p>
                  </div>
                )}
                {donation.reference_number && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Reference</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white font-mono">
                      {donation.reference_number}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Receipt Information */}
          {donation.receipt_issued && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <Hash className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-900 dark:text-green-300">
                    Receipt Issued
                  </p>
                  {donation.receipt_number && (
                    <p className="text-xs text-green-700 dark:text-green-400 font-mono">
                      {donation.receipt_number}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Review Information */}
          {donation.reviewed_by && donation.reviewed_at && (
            <div className="bg-gray-50 dark:bg-gray-900/30 rounded-xl p-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">
                Review Information
              </h3>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Reviewed By</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {donation.reviewed_by}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Reviewed At</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {format(donation.reviewed_at.toDate(), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
                {donation.review_notes && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Notes</p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {donation.review_notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Important Note for Member Donations */}
          {donation.source === 'member' && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>Note:</strong> This donation from a member does NOT count towards their
                monthly contribution requirements. It is tracked separately as additional income to
                the society.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button onClick={onClose} variant="secondary" className="flex-1">
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonationDetailModal;
