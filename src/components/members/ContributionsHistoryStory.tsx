import { FirebaseError } from "firebase/app";
import { CheckCircle, Edit2, PlusCircle, Trash2 } from "lucide-react";
import React, { useMemo, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useContributions } from "../../hooks/useContributions";
import { useNotifications } from "../../hooks/useNotifications";
import type {
  Contribution,
  ContributionStatus,
} from "../../types/contribution";
import { formatDate } from "../../utils/dateUtils";
import AddContributionModal from "../contributions/AddContributionModal";
import DeleteContributionModal from "../contributions/DeleteContributionModal";
import EditContributionModal from "../contributions/EditContributionModal";
import ReviewContributionModal from "../contributions/ReviewContributionModal";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Pagination from "../ui/Pagination";
import Table from "../ui/Table";

interface ContributionsHistoryProps {
  contributions?: Contribution[];
  memberId?: string;
  onContributionAdded?: () => void;
}

const ContributionsHistory: React.FC<ContributionsHistoryProps> = ({
  contributions = [],
  memberId,
  onContributionAdded,
}) => {
  const { reviewContribution, deleteContribution, updateContribution, addContribution } =
    useContributions();
  const { userDetails, isAdmin } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedContribution, setSelectedContribution] =
    useState<Contribution | null>(null);
  const { showError, showSuccess } = useNotifications();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Sort contributions by date (latest first) and calculate pagination
  const sortedContributions = useMemo(() => {
    return [...contributions].sort((a, b) => {
      return b.date.toDate().getTime() - a.date.toDate().getTime();
    });
  }, [contributions]);

  const totalPages = Math.ceil(sortedContributions.length / itemsPerPage);
  const paginatedContributions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedContributions.slice(startIndex, endIndex);
  }, [sortedContributions, currentPage, itemsPerPage]);

  // Reset to page 1 when contributions change
  useMemo(() => {
    setCurrentPage(1);
  }, [contributions.length]);

  const handleDeleteContribution = async () => {
    if (selectedContribution) {
      try {
        await deleteContribution(
          selectedContribution.id,
          selectedContribution.proof_of_payment
        );
        setIsDeleteModalOpen(false);
        setSelectedContribution(null);
        showSuccess(
          "Successfully deleted your: " +
          selectedContribution.members?.full_name +
          " contribution"
        );

        // Trigger refresh of member data
        if (onContributionAdded) {
          onContributionAdded();
        }
      } catch (error) {
        console.error("Error deleting contribution:", error);
      }
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
      showSuccess("Successfully updated your: " + data.type + " contribution");

      // Trigger refresh of member data
      if (onContributionAdded) {
        onContributionAdded();
      }
    } catch (error) {
      console.error("Error updating contribution:", error);
      if (error instanceof FirebaseError) {
        showError(error.message || "Error occured while updating contribution");
      }
      showError("An error occured while updating contribution");
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
      showSuccess("Your review was successful");

      // Trigger refresh of member data
      if (onContributionAdded) {
        onContributionAdded();
      }
    } catch (error) {
      console.error("Error reviewing contribution:", error);
      if (error instanceof FirebaseError) {
        showError(
          error.message || "Error occured while reviewing contribution"
        );
      }
      showError("An error occured while reviewing contribution");
    }
  };

  const handleAddContribution = async (
    data: Omit<Contribution, "id" | "members" | "status">,
    file?: File
  ) => {
    try {
      if (memberId) {
        data.member_id = memberId;
      }
      await addContribution(data, file);
      setIsAddModalOpen(false);
      showSuccess("Successfully recorded contribution for member");

      // Trigger refresh of member data
      if (onContributionAdded) {
        onContributionAdded();
      }
    } catch (error) {
      console.error("Error adding contribution:", error);
      if (error instanceof FirebaseError) {
        showError(error.message || "Error adding contribution");
      }
      showError("An error occurred while adding contribution");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg tracking-tight font-semibold text-text-primary dark:text-text-primary-dark">Contributions History</h4>
        {isAdmin && memberId && (
          <Button
            icon={PlusCircle}
            onClick={() => setIsAddModalOpen(true)}
            size="small"
          >
            Add Contribution
          </Button>
        )}
      </div>
      <Table
        headers={[
          "Date",
          "Type",
          "Amount",
          "Status",
          "Notes",
          ...(isAdmin ? ["Actions"] : []),
        ]}
      >
        {paginatedContributions.map((contribution) => (
          <tr key={contribution.id}>
            <td className="px-6 py-4 whitespace-nowrap">
              {formatDate(contribution.date)}
            </td>
            <td className="px-6 py-4 whitespace-nowrap capitalize">
              {contribution.type}
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
              {contribution.review_notes || "-"}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              {isAdmin && (
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
              )}
            </td>
          </tr>
        ))}
        {contributions.length === 0 && (
          <tr>
            <td colSpan={isAdmin ? 6 : 5} className="px-6 py-4 text-center text-text-secondary dark:text-text-secondary-dark">
              No contributions found
            </td>
          </tr>
        )}
      </Table>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Add Contribution Modal */}
      {isAdmin && memberId && (
        <AddContributionModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleAddContribution}
          isAdmin={true}
          memberId={memberId}
        />
      )}

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

export default ContributionsHistory;
