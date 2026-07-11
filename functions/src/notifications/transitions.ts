import { NotificationType } from "./types";

/**
 * Pure mapping of a document status transition to a notification type.
 * No Firebase imports — unit-testable.
 */

export type LifecycleCollection =
  | "contributions"
  | "claims"
  | "credits"
  | "donations"
  | "members";

export function mapStatusTransition(
  collection: LifecycleCollection,
  before: string | undefined,
  after: string | undefined
): NotificationType | null {
  if (!before || !after || before === after) return null;

  switch (collection) {
    case "contributions":
      if (before !== "pending") return null;
      if (after === "approved") return "contribution_approved";
      if (after === "rejected") return "contribution_rejected";
      return null;

    case "claims":
      if (before !== "pending") return null;
      if (after === "approved") return "claim_approved";
      if (after === "rejected") return "claim_rejected";
      return null;

    case "credits":
      if (before === "pending_review" || before === "needs_info") {
        // reviewCredit sets 'active' on approval; accept 'approved' too
        if (after === "active" || after === "approved") return "credit_approved";
        if (after === "rejected") return "credit_rejected";
        if (after === "needs_info" && before === "pending_review")
          return "credit_needs_info";
        return null;
      }
      if (before === "active" && after === "settled") return "credit_settled";
      return null;

    case "donations":
      if (before !== "pending") return null;
      if (after === "approved") return "donation_approved";
      if (after === "rejected") return "donation_rejected";
      return null;

    case "members":
      if (before !== "pending") return null;
      if (after === "approved" || after === "active") return "member_approved";
      return null;
  }
}
