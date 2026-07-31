import type { AssetStatus, RentalStatus } from "../types/asset";

/** Tailwind badge classes for an asset status. */
export const assetStatusBadgeClass = (status: AssetStatus): string => {
  const styles: Record<AssetStatus, string> = {
    available:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    rented_out:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    maintenance:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    retired: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  };
  return styles[status] ?? styles.retired;
};

/** Human-friendly label for a rental status. */
export const rentalStatusLabel = (status: RentalStatus): string => {
  const labels: Record<RentalStatus, string> = {
    active: "Out on rental",
    returned: "Returned",
    overdue: "Overdue",
  };
  return labels[status] ?? status;
};

/** Tailwind badge classes for a rental status. */
export const rentalStatusBadgeClass = (status: RentalStatus): string => {
  const styles: Record<RentalStatus, string> = {
    active: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    returned:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    overdue: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  };
  return styles[status] ?? styles.active;
};
