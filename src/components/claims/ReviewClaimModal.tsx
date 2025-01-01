import React, { useState } from "react";
import { ExternalLink } from "lucide-react";
import Button from "../ui/Button";
import { formatDate } from "../../utils/dateUtils";
import type { Claim, ClaimStatus } from "../../types/claim";

interface ReviewClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, status: ClaimStatus, notes: string) => Promise<void>;
  claim: Claim;
}

const ReviewClaimModal: React.FC<ReviewClaimModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  claim,
}) => {
  const [status, setStatus] = useState<ClaimStatus>("pending");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(claim.id, status, notes);
      onClose();
    } catch (error) {
      console.error("Error reviewing claim:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Review Claim</h2>

        <div className="mb-6 space-y-4">
          <div>
            <p className="text-sm text-gray-500">Member</p>
            <p className="font-medium">{claim.members?.full_name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Claimant</p>
            <p className="font-medium">
              {claim.claimant.full_name}
              {claim.claimant.relationship &&
                ` (${claim.claimant.relationship})`}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Type</p>
            <p className="font-medium capitalize">{claim.type}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Amount</p>
            <p className="font-medium">R {claim.amount.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Date</p>
            <p className="font-medium">{formatDate(claim.date)}</p>
          </div>
          {claim.documents_url && claim.documents_url.length > 0 && (
            <div>
              <p className="text-sm text-gray-500">Supporting Documents</p>
              <div className="space-y-1">
                {claim.documents_url.map((url, index) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-900 flex items-center"
                  >
                    Document {index + 1}{" "}
                    <ExternalLink className="ml-1 w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200"
              value={status}
              onChange={(e) => setStatus(e.target.value as ClaimStatus)}
            >
              <option value="pending">Pending</option>
              <option value="approved">Approve</option>
              <option value="rejected">Reject</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Review Notes
            </label>
            <textarea
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about your decision..."
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit Review"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewClaimModal;
