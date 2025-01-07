import React, { useState } from "react";
import Table from "../ui/Table";
import { formatDate } from "../../utils/dateUtils";
import type {
  Contribution,
  ContributionStatus,
} from "../../types/contribution";
import Badge from "../ui/Badge";
import { useAuth } from "../../hooks/useAuth";
import { CheckCircle, Edit2, Trash2 } from "lucide-react";
import ReviewContributionModal from "../contributions/ReviewContributionModal";
import DeleteContributionModal from "../contributions/DeleteContributionModal";
import EditContributionModal from "../contributions/EditContributionModal";
import { useContributions } from "../../hooks/useContributions";
import { useNotifications } from "../../hooks/useNotifications";
import { FirebaseError } from "firebase/app";

interface ContributionsHistoryProps {
  contributions?: Contribution[];
}

const ContributionsHistory: React.FC<ContributionsHistoryProps> = ({
  contributions = [],
}) => {
  const { reviewContribution, deleteContribution, updateContribution } =
    useContributions();
  const { userDetails, isAdmin } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedContribution, setSelectedContribution] =
    useState<Contribution | null>(null);
  const { showError, showSuccess } = useNotifications();

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
  return (
    <div>
      <h4 className="text-lg font-semibold mb-4">Contributions History</h4>
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
        {contributions.map((contribution) => (
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
            <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
              No contributions found
            </td>
          </tr>
        )}
      </Table>
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
