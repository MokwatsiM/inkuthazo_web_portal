import React, { useState, useMemo } from "react";
import {
  PlusCircle,
  ExternalLink,
  Edit2,
  Trash2,
  CheckCircle,
  FileX,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { useContributions } from "../hooks/useContributions";
import { useAuth } from "../hooks/useAuth";
import Button from "../components/ui/Button";
import Table from "../components/ui/Table";
import SearchInput from "../components/ui/SearchInput";
import MonthFilter from "../components/contributions/MonthFilter";
import AddContributionModal from "../components/contributions/AddContributionModal";
import EditContributionModal from "../components/contributions/EditContributionModal";
import ReviewContributionModal from "../components/contributions/ReviewContributionModal";
import { formatDate } from "../utils/dateUtils";
import type { Contribution, ContributionStatus } from "../types/contribution";
import { useMembers } from "../hooks/useMembers"; // Add this import
import Pagination from "../components/ui/Pagination";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import Card, { CardBody, CardHeader } from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import PageHeader from "../components/ui/PageHeader";
import Badge from "../components/ui/Badge";
import DeleteContributionModal from "../components/contributions/DeleteContributionModal";
import { logger } from "../utils/logger";

const Contributions: React.FC = () => {
  const {
    contributions,
    loading,
    currentPage,
    totalPages,
    fetchPage,
    addContribution,
    updateContribution,
    deleteContribution,
    reviewContribution,
  } = useContributions();
  const { userDetails, isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<{
    start: Date | null;
    end: Date | null;
  }>({
    start: null,
    end: null,
  });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedContribution, setSelectedContribution] =
    useState<Contribution | null>(null);
  const { members } = useMembers();
  // const [contributionsToDelete, setContributionToDelete] =
  //   useState<Contribution | null>(null);

  const filteredContributions = useMemo(() => {
    return contributions.filter((contribution) => {
      const matchesSearch = contribution.members?.full_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesDate =
        dateRange.start && dateRange.end
          ? contribution.date.toDate() >= dateRange.start &&
          contribution.date.toDate() <= dateRange.end
          : true;
      if (isAdmin) {
        return matchesSearch && matchesDate;
      } else {
        return (
          matchesSearch &&
          matchesDate &&
          contribution.member_id === userDetails?.id
        );
      }
    });
  }, [contributions, searchTerm, dateRange, isAdmin, userDetails?.id]);

  // Calculate KPI statistics
  const stats = useMemo(() => {
    const total = filteredContributions.reduce(
      (sum, c) => sum + c.amount,
      0
    );
    const approved = filteredContributions.filter(
      (c) => c.status === "approved"
    );
    const pending = filteredContributions.filter(
      (c) => c.status === "pending"
    );
    const approvedTotal = approved.reduce((sum, c) => sum + c.amount, 0);
    const pendingTotal = pending.reduce((sum, c) => sum + c.amount, 0);

    return {
      totalAmount: total,
      approvedAmount: approvedTotal,
      pendingAmount: pendingTotal,
      approvedCount: approved.length,
      pendingCount: pending.length,
      totalCount: filteredContributions.length,
    };
  }, [filteredContributions]);

  const handleAddContribution = async (
    data: Omit<Contribution, "id" | "members" | "status">,
    file?: File
  ) => {
    try {
      if (!isAdmin && userDetails) {
        data.member_id = userDetails.id;
      }
      await addContribution(data, file);
      setIsAddModalOpen(false);
    } catch (error) {
      logger.error("Error adding contribution:", error);
    }
  };

  const handleUpdateContribution = async (
    id: string,
    data: Partial<Contribution>,
    file?: File
  ) => {
    try {
      await updateContribution(id, data, file);
      setIsEditModalOpen(false);
      setSelectedContribution(null);
    } catch (error) {
      logger.error("Error updating contribution:", error);
    }
  };

  const handleDeleteContribution = async () => {
    if (selectedContribution) {
      try {
        await deleteContribution(
          selectedContribution.id,
          selectedContribution.proof_of_payment
        );
        setIsDeleteModalOpen(false);
        setSelectedContribution(null);
      } catch (error) {
        logger.error("Error deleting contribution:", error);
      }
    }
  };

  const handleReviewContribution = async (
    id: string,
    status: ContributionStatus,
    notes: string
  ) => {
    if (!userDetails?.id) return;
    try {
      await reviewContribution(id, status, notes, userDetails.id);
      setIsReviewModalOpen(false);
      setSelectedContribution(null);
    } catch (error) {
      logger.error("Error reviewing contribution:", error);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contributions"
        description="View and manage all members contributions"
        actions={
          <Button icon={PlusCircle} onClick={() => setIsAddModalOpen(true)}>
            Record Contribution
          </Button>
        }
      />

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Contributions */}
        <div className="bg-white dark:bg-surface-dark rounded-[20px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_35px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Total Amount
                  </p>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    R {stats.totalAmount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  {stats.totalCount} contributions
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Approved Contributions */}
        <div className="bg-white dark:bg-surface-dark rounded-[20px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_35px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Approved
                  </p>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    R {stats.approvedAmount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-green-600 font-semibold">
                  {stats.approvedCount} approved
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Contributions */}
        <div className="bg-white dark:bg-surface-dark rounded-[20px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_35px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Pending Review
                  </p>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    R {stats.pendingAmount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <span className="text-amber-600 font-semibold">
                  {stats.pendingCount} pending
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Approval Rate */}
        <div className="bg-white dark:bg-surface-dark rounded-[20px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_35px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Approval Rate
                  </p>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalCount > 0
                      ? Math.round((stats.approvedCount / stats.totalCount) * 100)
                      : 0}%
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  of total submissions
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white dark:bg-surface-dark rounded-[20px] shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
        <Card>
          <div className="p-6 border-b border-gray-100 dark:border-gray-800">
            <CardHeader>
              <SearchInput
                placeholder="Search by member name..."
                value={searchTerm}
                onChange={setSearchTerm}
              />
              <MonthFilter
                onChange={(start, end) => setDateRange({ start, end })}
              />
            </CardHeader>
          </div>
          <CardBody>
            {loading ? (
              <LoadingSpinner />
            ) : (
              <Table
                headers={[
                  "Date",
                  "Member",
                  "Type",
                  "Amount",
                  "Status",
                  "Proof of Payment",
                  ...(isAdmin ? ["Actions"] : []),
                ]}
              >
                {filteredContributions.length === 0 ? (
                  <div className="text-center">
                    <EmptyState
                      icon={FileX}
                      title="No contributions found"
                      description="Start by adding your first contribution"
                    />
                  </div>
                ) : (
                  filteredContributions.map((contribution) => (
                    <tr key={contribution.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {formatDate(contribution.date.toDate())}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {contribution.members?.full_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap capitalize">
                        {contribution.type.replace('_', ' ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        R {contribution.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant={
                            contribution.status === "approved"
                              ? "success"
                              : contribution.status === "rejected"
                                ? "error"
                                : "warning"
                          }
                        >
                          {contribution.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {contribution.proof_of_payment ? (
                          <a
                            href={contribution.proof_of_payment}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-900 flex items-center"
                          >
                            View <ExternalLink className="ml-1 w-4 h-4" />
                          </a>
                        ) : (
                          <span className="text-gray-400">
                            No proof attached
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {contribution.status === "pending" && (
                            <button
                              onClick={() => {
                                setSelectedContribution(contribution);
                                setIsReviewModalOpen(true);
                              }}
                              className="p-1 text-green-600 hover:text-green-900 transition-colors"
                              title="Review"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedContribution(contribution);
                              setIsEditModalOpen(true);
                            }}
                            className="p-1 text-blue-600 hover:text-blue-900 transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedContribution(contribution);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-1 text-red-600 hover:text-red-900 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </Table>
            )}
            {!loading && contributions.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => fetchPage(page)}
              />
            )}
          </CardBody>
        </Card>
      </div>

      <AddContributionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddContribution}
        isAdmin={isAdmin}
        members={members}
      />

      {selectedContribution && (
        <>
          <EditContributionModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedContribution(null);
            }}
            onSubmit={handleUpdateContribution}
            contribution={selectedContribution}
          />

          <DeleteContributionModal
            isOpen={isDeleteModalOpen}
            onClose={() => {
              setIsDeleteModalOpen(false);
              setSelectedContribution(null);
            }}
            onConfirm={handleDeleteContribution}
            contribution={selectedContribution}
          />

          <ReviewContributionModal
            isOpen={isReviewModalOpen}
            onClose={() => {
              setIsReviewModalOpen(false);
              setSelectedContribution(null);
            }}
            onSubmit={handleReviewContribution}
            contribution={selectedContribution}
          />
        </>
      )}
    </div>
  );
};

export default Contributions;
