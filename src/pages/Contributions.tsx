import React, { useState } from "react";
import {
  PlusCircle,
  ExternalLink,
  Edit2,
  Trash2,
  CheckCircle,
} from "lucide-react";
import { useContributions } from "../hooks/useContributions";
import { useAuth } from "../hooks/useAuth";
import Button from "../components/ui/Button";
import Table from "../components/ui/Table";
import SearchInput from "../components/ui/SearchInput";
import MonthFilter from "../components/contributions/MonthFilter";
import AddContributionModal from "../components/contributions/AddContributionModal";
import EditContributionModal from "../components/contributions/EditContributionModal";
import DeleteContributionModal from "../components/contributions/DeleteContributionModal";
import ReviewContributionModal from "../components/contributions/ReviewContributionModal";
import { formatDate } from "../utils/dateUtils";
import type { Contribution, ContributionStatus } from "../types/contribution";
import { useMembers } from "../hooks/useMembers"; // Add this import
import Pagination from "../components/ui/Pagination";

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

  const filteredContributions = contributions.filter((contribution) => {
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
      console.error("Error adding contribution:", error);
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
      console.error("Error updating contribution:", error);
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
        console.error("Error deleting contribution:", error);
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
      console.error("Error reviewing contribution:", error);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Contributions</h2>
        <Button icon={PlusCircle} onClick={() => setIsAddModalOpen(true)}>
          Record Contribution
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <div className="flex flex-col md:flex-row gap-4">
            <SearchInput
              placeholder="Search by member name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <MonthFilter
              onChange={(start, end) => setDateRange({ start, end })}
            />
          </div>
        </div>

        <Table
          headers={[
            "Date",
            "Member",
            "Type",
            "Amount",
            "Status",
            "Proof of Payment",
            ...(isAdmin ? ["Actions"] : []),
            "Actions",
          ]}
        >
          {loading ? (
            <tr>
              <td colSpan={isAdmin ? 8 : 7} className="px-6 py-4 text-center">
                Loading...
              </td>
            </tr>
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
                  {contribution.type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  R {contribution.amount.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      contribution.status === "approved"
                        ? "bg-green-100 text-green-800"
                        : contribution.status === "rejected"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {contribution.status}
                  </span>
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
                    <span className="text-gray-400">No proof attached</span>
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
        {!loading && contributions.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => fetchPage(page)}
          />
        )}
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
