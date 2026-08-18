// src/components/assets/AssetDetailModal.tsx
import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { X, Package, Calendar, Tag, MapPin, Hash, User } from "lucide-react";
import Button from "../ui/Button";
import { useAuth } from "../../hooks/useAuth";
import { getAssetRentals, returnAsset } from "../../services/assetService";
import type { Asset, AssetRental } from "../../types/asset";
import {
  assetCategoryLabel,
  assetStatusLabel,
  isRentalOverdue,
} from "../../types/asset";
import {
  assetStatusBadgeClass,
  rentalStatusBadgeClass,
  rentalStatusLabel,
} from "../../utils/assetDisplay";
import { getActionableErrorMessage } from "../../utils/errorMessages";
import { useModalA11y } from "../../hooks/useModalA11y";
import logger from "../../utils/logger";

interface AssetDetailModalProps {
  asset: Asset;
  onClose: () => void;
  onUpdate: () => void;
}

const AssetDetailModal: React.FC<AssetDetailModalProps> = ({
  asset,
  onClose,
  onUpdate,
}) => {
  const { user } = useAuth();
  const a11y = useModalA11y({ onClose });
  const [rentals, setRentals] = useState<AssetRental[]>([]);
  const [loading, setLoading] = useState(true);
  const [returningId, setReturningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadRentals = async () => {
    setLoading(true);
    try {
      setRentals(await getAssetRentals(asset.id));
    } catch (err) {
      logger.error("Error loading rentals:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRentals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asset.id]);

  const handleReturn = async (rentalId: string) => {
    if (!user) return;
    setReturningId(rentalId);
    setError(null);
    try {
      await returnAsset(rentalId, new Date(), user.uid, user.email || undefined);
      await loadRentals();
      onUpdate(); // asset status changed back to available
    } catch (err) {
      logger.error("Error returning asset:", err);
      setError(
        getActionableErrorMessage(err, "Failed to record return. Please try again.")
      );
    } finally {
      setReturningId(null);
    }
  };

  const detailRow = (
    Icon: React.ComponentType<{ className?: string }>,
    label: string,
    value: React.ReactNode
  ) => (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-gray-400 mt-0.5" />
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          {value}
        </p>
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        ref={a11y.ref}
        {...a11y.dialogProps}
        aria-labelledby="asset-detail-title"
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-surface-dark rounded-[20px] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-surface-dark border-b border-gray-200 dark:border-gray-700 p-6 rounded-t-[20px]">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Package className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2
                  id="asset-detail-title"
                  className="text-2xl font-bold text-gray-900 dark:text-white"
                >
                  {asset.name}
                </h2>
                <span
                  className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${assetStatusBadgeClass(
                    asset.status
                  )}`}
                >
                  {assetStatusLabel(asset.status)}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Valuation banner */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-900/30 rounded-xl p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Current Value
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                R {asset.current_value.toFixed(2)}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900/30 rounded-xl p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Purchase Price
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                R {asset.purchase_price.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {detailRow(Tag, "Category", assetCategoryLabel(asset.category))}
            {detailRow(
              Package,
              "Condition",
              asset.condition.charAt(0).toUpperCase() + asset.condition.slice(1)
            )}
            {detailRow(
              Calendar,
              "Purchase Date",
              format(asset.purchase_date.toDate(), "MMMM dd, yyyy")
            )}
            {asset.serial_number &&
              detailRow(Hash, "Serial / ID", asset.serial_number)}
            {asset.location && detailRow(MapPin, "Location", asset.location)}
          </div>

          {asset.description && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Description
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {asset.description}
              </p>
            </div>
          )}

          {/* Rental history */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
              Rental History
            </h3>
            {loading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Loading rentals...
              </p>
            ) : rentals.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                This asset has never been rented out.
              </p>
            ) : (
              <div className="space-y-3">
                {rentals.map((rental) => {
                  const overdue = isRentalOverdue(rental);
                  const displayStatus = overdue ? "overdue" : rental.status;
                  return (
                    <div
                      key={rental.id}
                      className="bg-gray-50 dark:bg-gray-900/30 rounded-xl p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {rental.renter_name}
                            </p>
                            <span className="text-xs text-gray-400 capitalize">
                              ({rental.renter_type})
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {format(rental.start_date.toDate(), "dd MMM yyyy")} →{" "}
                            {format(rental.due_date.toDate(), "dd MMM yyyy")}
                            {rental.returned_date &&
                              ` · returned ${format(
                                rental.returned_date.toDate(),
                                "dd MMM yyyy"
                              )}`}
                          </p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                            Fee: R {rental.rental_fee.toFixed(2)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${rentalStatusBadgeClass(
                              displayStatus
                            )}`}
                          >
                            {rentalStatusLabel(displayStatus)}
                          </span>
                          {rental.status === "active" && (
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => handleReturn(rental.id)}
                              disabled={returningId === rental.id}
                              loading={returningId === rental.id}
                              className="!py-1 !px-3 text-xs"
                            >
                              Record return
                            </Button>
                          )}
                        </div>
                      </div>
                      {rental.notes && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          {rental.notes}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button type="button" variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetDetailModal;
