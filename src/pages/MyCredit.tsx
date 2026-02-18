// src/pages/MyCredit.tsx
import React, { useState, useEffect } from 'react';
import {
  HandCoins,
  Loader2,
  Calendar,
  DollarSign,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../hooks/useAuth';
import { getMemberActiveCredit, getCredits } from '../services/creditService';
import type { Credit } from '../types/credit';

const MyCredit: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeCredit, setActiveCredit] = useState<Credit | null>(null);
  const [creditHistory, setCreditHistory] = useState<Credit[]>([]);

  useEffect(() => {
    if (user) {
      fetchMemberCredits();
    }
  }, [user]);

  const fetchMemberCredits = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [active, history] = await Promise.all([
        getMemberActiveCredit(user.uid),
        getCredits({ member_id: user.uid }),
      ]);
      setActiveCredit(active);
      setCreditHistory(history.filter((c) => c.status !== 'active'));
    } catch (error) {
      console.error('Error fetching member credits:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending_review: {
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
        label: 'Pending Review',
        icon: Clock,
      },
      needs_info: {
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
        label: 'Needs Info',
        icon: AlertCircle,
      },
      approved: {
        color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
        label: 'Approved',
        icon: CheckCircle,
      },
      rejected: {
        color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
        label: 'Rejected',
        icon: AlertCircle,
      },
      active: {
        color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
        label: 'Active',
        icon: TrendingUp,
      },
      settled: {
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
        label: 'Settled',
        icon: CheckCircle,
      },
      defaulted: {
        color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
        label: 'Defaulted',
        icon: AlertCircle,
      },
    };
    const badge = badges[status as keyof typeof badges];
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-4 h-4" />
        {badge.label}
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

  const progress = activeCredit
    ? (activeCredit.total_paid / activeCredit.terms.total_amount) * 100
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background-dark p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Credit</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View and track your credit repayment
          </p>
        </div>

        {/* Active Credit */}
        {activeCredit ? (
          <div className="bg-gradient-to-br from-purple-50 to-teal-50 dark:from-purple-900/20 dark:to-teal-900/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <HandCoins className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Active Credit
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">{activeCredit.reason}</p>
                </div>
              </div>
              {getStatusBadge(activeCredit.status)}
            </div>

            {/* Amount Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white dark:bg-gray-900 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Amount</p>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  R {activeCredit.terms.total_amount.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Principal: R{activeCredit.terms.principal_amount.toFixed(2)} + Fee: R
                  {activeCredit.terms.additional_fee.toFixed(2)}
                </p>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Paid</p>
                </div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  R {activeCredit.total_paid.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {activeCredit.payments.length} of {activeCredit.terms.installments} payments
                </p>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Remaining</p>
                </div>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  R {activeCredit.remaining_balance.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {activeCredit.terms.installments - activeCredit.payments.length} payments left
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                <span>Repayment Progress</span>
                <span className="font-bold">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                <div
                  className="bg-gradient-to-r from-purple-500 to-purple-600 h-4 rounded-full transition-all flex items-center justify-end pr-2"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                >
                  {progress > 10 && (
                    <span className="text-xs font-bold text-white">{Math.round(progress)}%</span>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Schedule */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                Payment Schedule
              </h3>
              <div className="bg-white dark:bg-gray-900 rounded-xl p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Installments</p>
                    <p className="font-bold text-gray-900 dark:text-white">
                      {activeCredit.terms.installments}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Per Payment</p>
                    <p className="font-bold text-gray-900 dark:text-white">
                      R {activeCredit.terms.installment_amount.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Completed</p>
                    <p className="font-bold text-green-600 dark:text-green-400">
                      {activeCredit.payments.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Remaining</p>
                    <p className="font-bold text-orange-600 dark:text-orange-400">
                      {activeCredit.terms.installments - activeCredit.payments.length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment History */}
            {activeCredit.payments.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                  Payment History
                </h3>
                <div className="space-y-2">
                  {activeCredit.payments.map((payment) => (
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
                            Payment {payment.payment_number} of {activeCredit.terms.installments}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {format(payment.paid_at.toDate(), 'MMMM dd, yyyy')}
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

            {/* How to Pay */}
            <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">
                    How to Make Payments
                  </p>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    To make a credit payment, go to <strong>Contributions</strong> → <strong>Add
                    Contribution</strong> → Select <strong>Credit Payment</strong> as the type.
                    Your payments will automatically be linked to this credit.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <HandCoins className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                No Active Credit
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                You don't have any active credits at the moment.
              </p>
            </div>
          </div>
        )}

        {/* Credit History */}
        {creditHistory.length > 0 && (
          <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Credit History
            </h2>
            <div className="space-y-3">
              {creditHistory.map((credit) => (
                <div
                  key={credit.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/30 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-500 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {credit.reason}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {format(credit.created_at.toDate(), 'MMMM dd, yyyy')} - R
                        {credit.terms.total_amount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(credit.status)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCredit;
