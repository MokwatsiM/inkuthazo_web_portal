// src/pages/Credits.tsx
import React, { useState, useEffect } from 'react';
import { Plus, DollarSign, TrendingUp, CheckCircle, AlertCircle, Loader2, Mail } from 'lucide-react';
import Button from '../components/ui/Button';
import { getCredits, getCreditSummary } from '../services/creditService';
import CreateCreditModal from '../components/credits/CreateCreditModal';
import CreditDetailModal from '../components/credits/CreditDetailModal';
import CreditNoticeModal from '../components/credits/CreditNoticeModal';
import PermissionGate from '../components/permissions/PermissionGate';
import type { Credit, CreditSummary as CreditSummaryType, CreditStatus } from '../types/credit';
import logger from '../utils/logger';

const Credits: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState<Credit[]>([]);
  const [summary, setSummary] = useState<CreditSummaryType | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [selectedCredit, setSelectedCredit] = useState<Credit | null>(null);
  const [statusFilter, setStatusFilter] = useState<CreditStatus | 'all'>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [creditsData, summaryData] = await Promise.all([
        getCredits(),
        getCreditSummary(),
      ]);
      setCredits(creditsData);
      setSummary(summaryData);
    } catch (error) {
      logger.error('Error fetching credits:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCredits = statusFilter === 'all'
    ? credits
    : credits.filter((c) => c.status === statusFilter);

  const getStatusBadge = (status: CreditStatus) => {
    const badges = {
      pending_review: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300', label: 'Pending Review' },
      needs_info: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300', label: 'Needs Info' },
      approved: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', label: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300', label: 'Rejected' },
      active: { color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300', label: 'Active' },
      settled: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300', label: 'Settled' },
      defaulted: { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300', label: 'Defaulted' },
    };
    const badge = badges[status];
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background-dark p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Credit Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage member credits and loans
            </p>
          </div>
          <div className="flex items-center gap-3">
            <PermissionGate resource="credits" action="view">
              <Button
                variant="secondary"
                onClick={() => setShowNoticeModal(true)}
                className="flex items-center gap-2"
              >
                <Mail className="w-5 h-5" />
                Credit Notices
              </Button>
            </PermissionGate>
            <PermissionGate resource="credits" action="create">
              <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Create Credit
              </Button>
            </PermissionGate>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Credits</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {summary.totalCredits}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    R {summary.totalAmount.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active Credits</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {summary.activeCredits}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    R {summary.activeAmount.toFixed(2)} owed
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Settled</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {summary.settledCredits}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    R {summary.settledAmount.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pending Review</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {summary.pendingReview}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-surface-dark rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Filter by Status:
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as CreditStatus | 'all')}
              className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all dark:text-white"
            >
              <option value="all">All Credits</option>
              <option value="pending_review">Pending Review</option>
              <option value="needs_info">Needs Info</option>
              <option value="active">Active</option>
              <option value="settled">Settled</option>
              <option value="rejected">Rejected</option>
              <option value="defaulted">Defaulted</option>
            </select>
          </div>
        </div>

        {/* Credits List */}
        <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {filteredCredits.length === 0 ? (
            <div className="p-12 text-center">
              <DollarSign className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No credits found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {statusFilter === 'all'
                  ? 'Get started by creating a new credit for a member.'
                  : `No credits with status: ${statusFilter}`
                }
              </p>
              {statusFilter === 'all' && (
                <PermissionGate resource="credits" action="create">
                  <Button onClick={() => setShowCreateModal(true)}>
                    Create First Credit
                  </Button>
                </PermissionGate>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Member
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredCredits.map((credit) => {
                    const progress = (credit.total_paid / credit.terms.total_amount) * 100;
                    return (
                      <tr
                        key={credit.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {credit.member_name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {credit.created_at.toDate().toLocaleDateString()}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                            {credit.reason}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              R {credit.terms.total_amount.toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {credit.terms.installments} payments
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {credit.status === 'active' || credit.status === 'settled' ? (
                            <div className="w-32">
                              <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                                <span>R {credit.total_paid.toFixed(2)}</span>
                                <span>{Math.round(progress)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                  className="bg-purple-600 h-2 rounded-full transition-all"
                                  style={{ width: `${Math.min(progress, 100)}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400 dark:text-gray-500">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(credit.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Button
                            variant="secondary"
                            size="small"
                            onClick={() => setSelectedCredit(credit)}
                          >
                            View Details
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateCreditModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchData();
          }}
        />
      )}

      {selectedCredit && (
        <CreditDetailModal
          credit={selectedCredit}
          onClose={() => setSelectedCredit(null)}
          onUpdate={fetchData}
        />
      )}

      <CreditNoticeModal
        isOpen={showNoticeModal}
        onClose={() => setShowNoticeModal(false)}
      />
    </div>
  );
};

export default Credits;
