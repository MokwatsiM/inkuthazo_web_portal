// src/pages/MyDonations.tsx
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Gift,
  TrendingUp,
  Award,
  Target,
  DollarSign,
  Calendar,
  FileText,
  Eye,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getMemberDonations } from '../services/donationService';
import type { Donation } from '../types/donation';
import DonationDetailModal from '../components/donations/DonationDetailModal';

const MyDonations: React.FC = () => {
  const { user } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    if (user) {
      fetchMyDonations();
    }
  }, [user]);

  const fetchMyDonations = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const memberDonations = await getMemberDonations(user.uid);
      setDonations(memberDonations);
    } catch (error) {
      console.error('Error fetching my donations:', error);
    } finally {
      setLoading(false);
    }
  };

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
      default:
        return <DollarSign className="w-5 h-5 text-white" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
      approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    };

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-semibold ${styles[status as keyof typeof styles]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const handleViewDetails = (donation: Donation) => {
    setSelectedDonation(donation);
    setShowDetailModal(true);
  };

  const totalDonations = donations.filter(d => d.status === 'approved').reduce((sum, d) => sum + d.amount, 0);
  const pendingDonations = donations.filter(d => d.status === 'pending').length;
  const approvedDonations = donations.filter(d => d.status === 'approved').length;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            My Donations
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View your donation history and contributions to the society
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-[20px] p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-blue-900 dark:text-blue-300 mb-1">
              About Your Donations
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-300">
              These are your voluntary donations to the society. <strong>These do NOT count towards your monthly contribution requirements.</strong> They are tracked separately as additional contributions.
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-[20px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)] border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Approved</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                R {totalDonations.toFixed(2)}
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {approvedDonations} approved donation{approvedDonations !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-[20px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)] border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Pending Review</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {pendingDonations}
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Awaiting admin approval
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-[20px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)] border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Donations</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {donations.length}
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            All time donations
          </p>
        </div>
      </div>

      {/* Donations List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-[20px] p-12 text-center shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
            <div className="inline-block w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-400 dark:text-gray-500">Loading your donations...</p>
          </div>
        ) : donations.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-[20px] p-12 text-center shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-900 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Gift className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-400 dark:text-gray-500 mb-2">No donations yet</p>
            <p className="text-sm text-gray-400 dark:text-gray-600">
              Your voluntary donations will appear here once recorded by an admin
            </p>
          </div>
        ) : (
          donations.map((donation) => (
            <div
              key={donation.id}
              className="bg-white dark:bg-gray-800 rounded-[20px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_35px_rgba(0,0,0,0.08)] transition-all duration-300 border border-gray-100 dark:border-gray-700"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                      {getDonationTypeIcon(donation.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white capitalize">
                          {donation.type}
                        </h3>
                        {getStatusBadge(donation.status)}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {format(donation.date.toDate(), 'MMMM dd, yyyy')}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Amount</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        R {donation.amount.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Date</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {format(donation.date.toDate(), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    </div>
                    {donation.purpose && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Purpose</p>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {donation.purpose}
                        </span>
                      </div>
                    )}
                  </div>

                  {donation.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {donation.description}
                    </p>
                  )}

                  {donation.status === 'approved' && donation.receipt_issued && (
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-xs text-green-700 dark:text-green-300">
                      <FileText className="w-3 h-3" />
                      Receipt Issued: {donation.receipt_number}
                    </div>
                  )}

                  <div className="mt-4">
                    <button
                      onClick={() => handleViewDetails(donation)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all text-sm font-medium"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedDonation && (
        <DonationDetailModal
          donation={selectedDonation}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedDonation(null);
          }}
          onUpdate={fetchMyDonations}
        />
      )}
    </div>
  );
};

export default MyDonations;
