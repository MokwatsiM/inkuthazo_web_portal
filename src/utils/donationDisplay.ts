import type { Donation, DonationType } from "../types/donation";
import { isMonetaryDonation } from "../types/donation";

/** Human-friendly label for a donation type (e.g. "in_kind" → "In-kind"). */
export const donationTypeLabel = (type: DonationType): string => {
  const labels: Record<DonationType, string> = {
    investment: "Investment",
    donation: "Donation",
    sponsorship: "Sponsorship",
    grant: "Grant",
    in_kind: "In-kind",
    other: "Other",
  };
  return labels[type] ?? type;
};

/**
 * How a donation's value should be shown. Monetary donations show the Rand
 * amount; in-kind donations show "In-kind" (with an optional estimated value)
 * so they never read as cash.
 */
export const donationAmountDisplay = (donation: Donation): string => {
  if (isMonetaryDonation(donation.type)) {
    return `R ${donation.amount.toFixed(2)}`;
  }
  return donation.amount > 0
    ? `In-kind (est. R ${donation.amount.toFixed(2)})`
    : "In-kind";
};
