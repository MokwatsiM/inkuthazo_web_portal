import React, { useState } from "react";
import { PlusCircle, ExternalLink, CheckCircle } from "lucide-react";
import { formatDate } from "../../utils/dateUtils";
import { useClaims } from "../../hooks/useClaims";
import { useAuth } from "../../hooks/useAuth";
import Button from "../ui/Button";
import Table from "../ui/Table";
import AddClaimModal from "./AddClaimModal";
import ReviewClaimModal from "./ReviewClaimModal";
import type { Member } from "../../types";
import type { Claim } from "../../types/claim";
import LoadingSpinner from "../ui/LoadingSpinner";
import Badge from "../ui/Badge";

interface ClaimsSectionProps {
  member: Member;
}

const ClaimsSection: React.FC<ClaimsSectionProps> = ({ member }) => {
  const { claims, loading, submitClaim, reviewClaim } = useClaims(member.id);
  const { userDetails, isAdmin } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);

  const handleSubmitClaim = async (
    data: Omit<Claim, "id" | "members" | "status">,
    files?: File[]
  ) => {
    try {
      await submitClaim(data, files);
      setIsAddModalOpen(false);
    } catch (error) {
      console.error("Error submitting claim:", error);
    }
  };

  const handleReviewClaim = async (
    id: string,
    status: Claim["status"],
    notes: string
  ) => {
    if (!userDetails?.id) return;
    try {
      await reviewClaim(id, status, notes, userDetails.id);
      setIsReviewModalOpen(false);
      setSelectedClaim(null);
    } catch (error) {
      console.error("Error reviewing claim:", error);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Claims</h3>
        <Button icon={PlusCircle} onClick={() => setIsAddModalOpen(true)}>
          Submit Claim
        </Button>
      </div>

      <Table
        headers={[
          "Date",
          "Claimant",
          "Type",
          "Amount",
          "Status",
          "Documents",
          "Actions",
        ]}
      >
        {loading ? (
          <tr>
            <td colSpan={7} className="px-6 py-4 text-center">
              <LoadingSpinner />
            </td>
          </tr>
        ) : claims.length === 0 ? (
          <tr>
            <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
              No claims found
            </td>
          </tr>
        ) : (
          claims.map((claim) => (
            <tr key={claim.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                {formatDate(claim.date)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {claim.claimant.full_name}
                {claim.claimant.relationship && (
                  <span className="text-gray-500 text-sm">
                    {" "}
                    ({claim.claimant.relationship})
                  </span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap capitalize">
                {claim.type}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                R {claim.amount.toFixed(2)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Badge
                  variant={
                    claim.status === "approved"
                      ? "success"
                      : claim.status === "rejected"
                      ? "error"
                      : "warning"
                  }
                >
                  {claim.status}
                </Badge>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {claim.documents_url?.map((url, index) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-900 flex items-center mb-1"
                  >
                    Document {index + 1}{" "}
                    <ExternalLink className="ml-1 w-4 h-4" />
                  </a>
                ))}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {isAdmin && claim.status === "pending" && (
                  <button
                    onClick={() => {
                      setSelectedClaim(claim);
                      setIsReviewModalOpen(true);
                    }}
                    className="text-indigo-600 hover:text-indigo-900 flex items-center"
                  >
                    <CheckCircle className="w-5 h-5 mr-1" />
                    Review
                  </button>
                )}
              </td>
            </tr>
          ))
        )}
      </Table>

      <AddClaimModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleSubmitClaim}
        member={member}
      />

      {selectedClaim && (
        <ReviewClaimModal
          isOpen={isReviewModalOpen}
          onClose={() => {
            setIsReviewModalOpen(false);
            setSelectedClaim(null);
          }}
          onSubmit={handleReviewClaim}
          claim={selectedClaim}
        />
      )}
    </div>
  );
};

export default ClaimsSection;
