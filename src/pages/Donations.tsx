// src/pages/Donations.tsx
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  DollarSign,
  Users,
  TrendingUp,
  Plus,
  Filter,
  Download,
  Search,
  Eye,
  Edit,
  Trash2,
  Check,
  X,
  Building2,
  Gift,
  Target,
  Award,
} from 'lucide-react';
import Button from '../components/ui/Button';
import KPICard from '../components/ui/KPICard';
import { useAuth } from '../hooks/useAuth';
import {
  getDonations,
  getDonationSummary,
  reviewDonation,
  deleteDonation,
} from '../services/donationService';
import type { Donation, DonationFilter, DonationSummary } from '../types/donation';
import DonationFormModal from '../components/donations/DonationFormModal';
import DonationDetailModal from '../components/donations/DonationDetailModal';

const Donations: React.FC = () => {
  const { user } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [summary, setSummary] = useState<DonationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [filters, setFilters] = useState<DonationFilter>({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [donationsData, summaryData] = await Promise.all([
        getDonations(filters, 100),
        getDonationSummary(),
      ]);

      setDonations(donationsData.donations);
      setSummary(summaryData);
    } catch (error) {
      console.error('Error fetching donations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (donationId: string, status: 'approved' | 'rejected', notes: string) => {
    if (!user) return;

    try {
      await reviewDonation(
        donationId,
        {
          status,
          notes,
          reviewer_id: user.uid,
          reviewed_at: new Date(),
        },
        user.uid,
        user.email || undefined
      );

      await fetchData();
    } catch (error) {
      console.error('Error reviewing donation:', error);
      alert('Failed to review donation');
    }
  };

  const handleDelete = async (donationId: string) => {
    if (!user) return;
    if (!confirm('Are you sure you want to delete this donation?')) return;

    try {
      await deleteDonation(donationId, user.uid, user.email || undefined);
      await fetchData();
    } catch (error) {
      console.error('Error deleting donation:', error);
      alert('Failed to delete donation');
    }
  };

  const handleViewDetails = (donation: Donation) => {
    setSelectedDonation(donation);
    setShowDetailModal(true);
  };

  const getDonationTypeIcon = (type: string) => {
    switch (type) {
      case 'investment':
        return <TrendingUp className="w-4 h-4" />;
      case 'donation':
        return <Gift className="w-4 h-4" />;
      case 'sponsorship':
        return <Award className="w-4 h-4" />;
      case 'grant':
        return <Target className="w-4 h-4" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'member':
        return <Users className="w-4 h-4" />;
      case 'organization':
        return <Building2 className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
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

  const filteredDonations = donations.filter((donation) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      donation.donor_name.toLowerCase().includes(search) ||
      donation.type.toLowerCase().includes(search) ||
      donation.source.toLowerCase().includes(search) ||
      (donation.description && donation.description.toLowerCase().includes(search))
    );
  });

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Donations & Investments
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track income from donations, investments, sponsorships, and grants
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Donation
        </Button>
      </div>

      {/* KPI Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Total Donations"
            value={summary.totalDonations.toString()}
            subtitle={`R ${summary.totalAmount.toFixed(2)} total`}
            icon={Gift}
            gradient="purple"
          />
          <KPICard
            title="From Members"
            value={summary.bySource.member.count.toString()}
            subtitle={`R ${summary.bySource.member.amount.toFixed(2)}`}
            icon={Users}
            gradient="blue"
          />
          <KPICard
            title="From Organizations"
            value={summary.bySource.organization.count.toString()}
            subtitle={`R ${summary.bySource.organization.amount.toFixed(2)}`}
            icon={Building2}
            gradient="teal"
          />
          <KPICard
            title="Pending Review"
            value={summary.byStatus.pending.count.toString()}
            subtitle={`R ${summary.byStatus.pending.amount.toFixed(2)}`}
            icon={TrendingUp}
            gradient="amber"
          />
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-[20px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)] border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Filter Donations</h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {filteredDonations.length} {filteredDonations.length === 1 ? 'donation' : 'donations'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by donor name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all dark:text-white"
            />
          </div>

          <select
            value={filters.source || ''}
            onChange={(e) =>
              setFilters({ ...filters, source: e.target.value as any || undefined })
            }
            className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all dark:text-white"
          >
            <option value="">All Sources</option>
            <option value="member">Members</option>
            <option value="outsider">Outsiders</option>
            <option value="organization">Organizations</option>
          </select>

          <select
            value={filters.type || ''}
            onChange={(e) =>
              setFilters({ ...filters, type: e.target.value as any || undefined })
            }
            className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all dark:text-white"
          >
            <option value="">All Types</option>
            <option value="investment">Investment</option>
            <option value="donation">Donation</option>
            <option value="sponsorship">Sponsorship</option>
            <option value="grant">Grant</option>
            <option value="other">Other</option>
          </select>

          <select
            value={filters.status || ''}
            onChange={(e) =>
              setFilters({ ...filters, status: e.target.value as any || undefined })
            }
            className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all dark:text-white"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Donations List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-[20px] p-12 text-center shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
            <div className="inline-block w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-400 dark:text-gray-500">Loading donations...</p>
          </div>
        ) : filteredDonations.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-[20px] p-12 text-center shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-900 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Gift className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-400 dark:text-gray-500">No donations found</p>
            <p className="text-sm text-gray-400 dark:text-gray-600 mt-2">
              {searchTerm || Object.keys(filters).length > 0
                ? 'Try adjusting your filters'
                : 'Add your first donation to get started'}
            </p>
          </div>
        ) : (
          filteredDonations.map((donation) => (
            <div
              key={donation.id}
              className="bg-white dark:bg-gray-800 rounded-[20px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_35px_rgba(0,0,0,0.08)] transition-all duration-300 border border-gray-100 dark:border-gray-700"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                      {getDonationTypeIcon(donation.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                        {donation.donor_name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {format(donation.date.toDate(), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Amount</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        R {donation.amount.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Type</p>
                      <div className="flex items-center gap-2">
                        {getDonationTypeIcon(donation.type)}
                        <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                          {donation.type}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Source</p>
                      <div className="flex items-center gap-2">
                        {getSourceIcon(donation.source)}
                        <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                          {donation.source}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Status</p>
                      {getStatusBadge(donation.status)}
                    </div>
                  </div>

                  {donation.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {donation.description}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => handleViewDetails(donation)}
                      className="flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      View
                    </Button>

                    {donation.status === 'pending' && (
                      <>
                        <Button
                          variant="secondary"
                          size="small"
                          onClick={() =>
                            handleReview(donation.id, 'approved', 'Approved by admin')
                          }
                          className="flex items-center gap-1 text-green-600 hover:text-green-700"
                        >
                          <Check className="w-3 h-3" />
                          Approve
                        </Button>
                        <Button
                          variant="secondary"
                          size="small"
                          onClick={() =>
                            handleReview(donation.id, 'rejected', 'Rejected by admin')
                          }
                          className="flex items-center gap-1 text-red-600 hover:text-red-700"
                        >
                          <X className="w-3 h-3" />
                          Reject
                        </Button>
                      </>
                    )}

                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => handleDelete(donation.id)}
                      className="flex items-center gap-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <DonationFormModal
          onClose={() => {
            setShowCreateModal(false);
            fetchData();
          }}
        />
      )}

      {showDetailModal && selectedDonation && (
        <DonationDetailModal
          donation={selectedDonation}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedDonation(null);
          }}
          onUpdate={fetchData}
        />
      )}
    </div>
  );
};

export default Donations;
