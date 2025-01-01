import React, { useState } from "react";
import { CheckCircle, ExternalLink } from "lucide-react";
import { useClaims } from "../hooks/useClaims";
import { useAuth } from "../hooks/useAuth";
import Button from "../components/ui/Button";
import Table from "../components/ui/Table";
import SearchInput from "../components/ui/SearchInput";
import ReviewClaimModal from "../components/claims/ReviewClaimModal";
import { formatDate } from "../utils/dateUtils";
import type { Claim } from "../types/claim";

const Claims: React.FC = () => {
  const { claims, loading, reviewClaim } = useClaims();
  const { userDetails } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<Claim["status"] | "all">(
    "all"
  );
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);

  const filteredClaims = claims.filter((claim) => {
    const matchesSearch =
      claim.members?.full_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      claim.claimant.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || claim.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Claims Management</h2>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <div className="flex flex-col md:flex-row gap-4">
            <SearchInput
              placeholder="Search by member or claimant name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="block w-48 rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as Claim["status"] | "all")
              }
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        <Table
          headers={[
            "Date",
            "Member",
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
              <td colSpan={8} className="px-6 py-4 text-center">
                Loading...
              </td>
            </tr>
          ) : filteredClaims.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                No claims found
              </td>
            </tr>
          ) : (
            filteredClaims.map((claim) => (
              <tr key={claim.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {formatDate(claim.date)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {claim.members?.full_name}
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
                  <span
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      claim.status === "approved"
                        ? "bg-green-100 text-green-800"
                        : claim.status === "rejected"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {claim.status}
                  </span>
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
                  {claim.status === "pending" && (
                    <Button
                      variant="secondary"
                      icon={CheckCircle}
                      onClick={() => {
                        setSelectedClaim(claim);
                        setIsReviewModalOpen(true);
                      }}
                      className="!p-2"
                    >
                      <span className="sr-only">Review</span>
                    </Button>
                  )}
                </td>
              </tr>
            ))
          )}
        </Table>
      </div>

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

export default Claims;
