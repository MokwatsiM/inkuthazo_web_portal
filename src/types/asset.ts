import { Timestamp } from "firebase/firestore";

export type AssetCategory =
  | "equipment"
  | "furniture"
  | "vehicle"
  | "electronics"
  | "other";

export type AssetCondition = "new" | "good" | "fair" | "poor";

export type AssetStatus =
  | "available"
  | "rented_out"
  | "maintenance"
  | "retired";

/**
 * A movable asset owned by the organisation. `current_value` is manually
 * maintained by an admin — there is no automatic depreciation.
 */
export interface Asset {
  id: string;
  name: string;
  description?: string;
  category: AssetCategory;

  // Valuation
  purchase_price: number;
  purchase_date: Timestamp;
  current_value: number; // admin-editable current worth

  // State
  status: AssetStatus;
  condition: AssetCondition;
  serial_number?: string;
  location?: string;

  // Metadata
  created_by: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export type RenterType = "member" | "outsider";

export type RentalStatus = "active" | "returned" | "overdue";

/**
 * A single rental event for an asset. The `rental_fee` is income to the
 * organisation and DOES count toward its balance (unlike an in-kind donation).
 */
export interface AssetRental {
  id: string;
  asset_id: string;
  asset_name: string; // denormalised for list views

  // Who has it
  renter_type: RenterType;
  member_id?: string; // set when renter_type === 'member'
  renter_name: string;
  contact?: string; // phone/email, mainly for outsiders

  // Money & dates
  rental_fee: number; // income; adds to the org balance
  start_date: Timestamp;
  due_date: Timestamp;
  returned_date?: Timestamp;

  status: RentalStatus;
  notes?: string;

  created_by: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface AssetSummary {
  totalAssets: number;
  /** Sum of current_value across non-retired assets. */
  totalValue: number;
  /** Assets currently rented out. */
  rentedOutCount: number;
  /** Total rental income earned (active + returned rentals). */
  totalRentalIncome: number;
}

/** Human-friendly label for an asset status. */
export const assetStatusLabel = (status: AssetStatus): string => {
  const labels: Record<AssetStatus, string> = {
    available: "Available",
    rented_out: "Rented out",
    maintenance: "Maintenance",
    retired: "Retired",
  };
  return labels[status] ?? status;
};

/** Human-friendly label for an asset category. */
export const assetCategoryLabel = (category: AssetCategory): string => {
  const labels: Record<AssetCategory, string> = {
    equipment: "Equipment",
    furniture: "Furniture",
    vehicle: "Vehicle",
    electronics: "Electronics",
    other: "Other",
  };
  return labels[category] ?? category;
};

/** An asset can only be rented out when it is available. */
export const isAssetAvailable = (asset: Pick<Asset, "status">): boolean =>
  asset.status === "available";

/**
 * Whether an active rental is past its due date (given a reference "now").
 * Returned rentals are never overdue.
 */
export const isRentalOverdue = (
  rental: Pick<AssetRental, "status" | "due_date">,
  now: Date = new Date()
): boolean =>
  rental.status === "active" && rental.due_date.toDate() < now;
