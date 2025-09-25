import React, { useState } from "react";
import { ExternalLink } from "lucide-react";
import Button from "../ui/Button";
import { formatDate } from "../../utils/dateUtils";
import type {
  Contribution,
  ContributionStatus,
} from "../../types/contribution";

interface ReviewContributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    id: string,
    status: ContributionStatus,
    notes: string
  ) => Promise<void>;
  contribution: Contribution;
}

const ReviewContributionModal: React.FC<ReviewContributionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  contribution,
}) => {
  const [status, setStatus] = useState<ContributionStatus>("pending");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(contribution.id, status, notes);
      onClose();
    } catch (error) {
      console.error("Error reviewing contribution:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-surface dark:bg-surface-dark rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-text-primary dark:text-text-primary-dark">Review Contribution</h2>

        <div className="mb-6 space-y-4">
          <div>
            <p className="text-sm text-text-secondary dark:text-text-secondary-dark">Member</p>
            <p className="font-medium text-text-primary dark:text-text-primary-dark">{contribution.members?.full_name}</p>
          </div>
          <div>
            <p className="text-sm text-text-secondary dark:text-text-secondary-dark">Amount</p>
            <p className="font-medium text-text-primary dark:text-text-primary-dark">R {contribution.amount.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-text-secondary dark:text-text-secondary-dark">Date</p>
            <p className="font-medium text-text-primary dark:text-text-primary-dark">{formatDate(contribution.date)}</p>
          </div>
          <div>
            <p className="text-sm text-text-secondary dark:text-text-secondary-dark">Type</p>
            <p className="font-medium capitalize text-text-primary dark:text-text-primary-dark">{contribution.type}</p>
          </div>
          {contribution.proof_of_payment && (
            <div>
              <p className="text-sm text-text-secondary dark:text-text-secondary-dark">Proof of Payment</p>
              <a
                href={contribution.proof_of_payment}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 flex items-center"
              >
                View Document <ExternalLink className="ml-1 w-4 h-4" />
              </a>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary dark:text-text-primary-dark">
              Status
            </label>
            <select
              required
              className="mt-1 block w-full rounded-input border border-line dark:border-line-dark bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200"
              value={status}
              onChange={(e) => setStatus(e.target.value as ContributionStatus)}
            >
              <option value="pending">Pending</option>
              <option value="approved">Approve</option>
              <option value="rejected">Reject</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary dark:text-text-primary-dark">
              Review Notes
            </label>
            <textarea
              className="mt-1 block w-full rounded-input border border-line dark:border-line-dark bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200"
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

export default ReviewContributionModal;
