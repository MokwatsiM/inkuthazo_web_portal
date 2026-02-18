// src/pages/CreditReviews.tsx
import React, { useState, useEffect } from 'react';
import { ClipboardList, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import Button from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';
import { getPendingCredits } from '../services/creditService';
import ReviewCreditModal from '../components/credits/ReviewCreditModal';
import { format } from 'date-fns';
import type { Credit } from '../types/credit';

const CreditReviews: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [pendingCredits, setPendingCredits] = useState<Credit[]>([]);
  const [selectedCredit, setSelectedCredit] = useState<Credit | null>(null);

  useEffect(() => {
    fetchPendingCredits();
  }, []);

  const fetchPendingCredits = async () => {
    setLoading(true);
    try {
      const credits = await getPendingCredits();
      setPendingCredits(credits);
    } catch (error) {
      console.error('Error fetching pending credits:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'pending_review') {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
          Pending Review
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
        Needs Info
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background-dark p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Credit Review Queue
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Review and approve member credit requests
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white dark:bg-surface-dark rounded-xl px-4 py-2 shadow-sm border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">Pending Reviews</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {pendingCredits.length}
              </p>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">
                Chairperson Review Process
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                As a chairperson, you can <strong>approve</strong>, <strong>reject</strong>, or{' '}
                <strong>request additional information</strong> for credit applications. Approved
                credits will automatically create an expense entry and become active for the member
                to start repaying.
              </p>
            </div>
          </div>
        </div>

        {/* Credits Queue */}
        {pendingCredits.length === 0 ? (
          <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                All caught up!
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                There are no credit applications pending your review at this time.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingCredits.map((credit) => (
              <div
                key={credit.id}
                className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                        <ClipboardList className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          {credit.member_name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Requested {format(credit.created_at.toDate(), 'MMMM dd, yyyy')}
                        </p>
                      </div>
                      {getStatusBadge(credit.status)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-3">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Total Amount
                        </p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          R {credit.terms.total_amount.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Principal: R{credit.terms.principal_amount.toFixed(2)} + Fee: R
                          {credit.terms.additional_fee.toFixed(2)}
                        </p>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-3">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Payment Plan
                        </p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {credit.terms.installments} Installments
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          R{credit.terms.installment_amount.toFixed(2)} per payment
                        </p>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-3">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Reason</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {credit.reason}
                        </p>
                      </div>
                    </div>

                    {credit.description && (
                      <div className="mb-4">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Additional Details
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {credit.description}
                        </p>
                      </div>
                    )}

                    {credit.status === 'needs_info' && credit.review && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
                        <p className="text-xs font-medium text-blue-900 dark:text-blue-300 mb-1">
                          Information Requested
                        </p>
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          {credit.review.additional_info_requested}
                        </p>
                        {credit.additional_info_response && (
                          <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-700">
                            <p className="text-xs font-medium text-blue-900 dark:text-blue-300 mb-1">
                              Response Provided
                            </p>
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                              {credit.additional_info_response}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>Created by: {credit.created_by_name}</span>
                    </div>
                  </div>

                  <div className="ml-6">
                    <Button onClick={() => setSelectedCredit(credit)}>Review Credit</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedCredit && (
        <ReviewCreditModal
          credit={selectedCredit}
          onClose={() => setSelectedCredit(null)}
          onSuccess={() => {
            setSelectedCredit(null);
            fetchPendingCredits();
          }}
        />
      )}
    </div>
  );
};

export default CreditReviews;
