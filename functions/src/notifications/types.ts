export type NotificationType =
  | "contribution_submitted"
  | "contribution_approved"
  | "contribution_rejected"
  | "claim_approved"
  | "claim_rejected"
  | "credit_approved"
  | "credit_rejected"
  | "credit_needs_info"
  | "credit_settled"
  | "donation_approved"
  | "donation_rejected"
  | "member_approved"
  | "hosting_reminder"
  | "arrears_notice"
  | "credit_notice";

export interface NotificationEvent {
  type: NotificationType;
  /**
   * Deterministic notification document id. Trigger retries reuse the same
   * key, so `create()` deduplicates automatically.
   */
  key: string;
  /** Recipient auth uid (== members/{id}) */
  recipientId: string;
  /** Provenance for debugging */
  source: { collection: string; docId: string };
  /** Template variables (amounts, month names, review notes, ...) */
  data: Record<string, string>;
}
