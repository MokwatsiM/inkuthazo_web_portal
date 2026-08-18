// src/pages/Assets.tsx
import React, { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  Package,
  Wallet,
  ArrowLeftRight,
  TrendingUp,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import { assetCategoryVisual } from "../utils/assetCategoryVisual";
import Button from "../components/ui/Button";
import KPICard from "../components/ui/KPICard";
import { useAuth } from "../hooks/useAuth";
import { usePermissions } from "../hooks/usePermissions";
import { useNotifications } from "../hooks/useNotifications";
import {
  getAssets,
  getAllRentals,
  buildAssetSummary,
  deleteAsset,
} from "../services/assetService";
import type { Asset, AssetRental, AssetStatus } from "../types/asset";
import {
  assetCategoryLabel,
  assetStatusLabel,
  isAssetAvailable,
} from "../types/asset";
import { assetStatusBadgeClass, formatMoney } from "../utils/assetDisplay";
import { getActionableErrorMessage } from "../utils/errorMessages";
import AssetFormModal from "../components/assets/AssetFormModal";
import RentAssetModal from "../components/assets/RentAssetModal";
import AssetDetailModal from "../components/assets/AssetDetailModal";
import { ConfirmModal } from "../components/ui/Modal";
import logger from "../utils/logger";

const STATUS_FILTERS: Array<{ value: AssetStatus | "all"; label: string }> = [
  { value: "all", label: "All Statuses" },
  { value: "available", label: "Available" },
  { value: "rented_out", label: "Rented out" },
  { value: "maintenance", label: "Maintenance" },
  { value: "retired", label: "Retired" },
];

const Assets: React.FC = () => {
  const { user } = useAuth();
  const { canCreate, canEdit, canDelete } = usePermissions();
  const { showSuccess, showError } = useNotifications();

  const [assets, setAssets] = useState<Asset[]>([]);
  const [rentals, setRentals] = useState<AssetRental[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AssetStatus | "all">("all");

  const [showCreate, setShowCreate] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [rentingAsset, setRentingAsset] = useState<Asset | null>(null);
  const [detailAsset, setDetailAsset] = useState<Asset | null>(null);
  const [deletingAsset, setDeletingAsset] = useState<Asset | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [assetsData, rentalsData] = await Promise.all([
        getAssets(),
        getAllRentals(),
      ]);
      setAssets(assetsData);
      setRentals(rentalsData);
    } catch (err) {
      logger.error("Error fetching assets:", err);
      setError(getActionableErrorMessage(err, "Failed to load assets."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const summary = useMemo(
    () => buildAssetSummary(assets, rentals),
    [assets, rentals]
  );

  const filteredAssets = useMemo(() => {
    const term = search.trim().toLowerCase();
    return assets.filter((a) => {
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (!term) return true;
      return (
        a.name.toLowerCase().includes(term) ||
        assetCategoryLabel(a.category).toLowerCase().includes(term) ||
        (a.serial_number ?? "").toLowerCase().includes(term) ||
        (a.location ?? "").toLowerCase().includes(term)
      );
    });
  }, [assets, search, statusFilter]);

  const handleConfirmDelete = async () => {
    if (!user || !deletingAsset) return;
    setDeleteLoading(true);
    try {
      await deleteAsset(deletingAsset.id, user.uid, user.email || undefined);
      showSuccess(`"${deletingAsset.name}" was deleted.`);
      setDeletingAsset(null);
      await fetchData();
    } catch (err) {
      logger.error("Error deleting asset:", err);
      showError(
        getActionableErrorMessage(err, "Failed to delete asset. Please try again.")
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Assets
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Track movable assets, their value, and rentals
          </p>
        </div>
        {canCreate("assets") && (
          <Button icon={Plus} onClick={() => setShowCreate(true)}>
            Add Asset
          </Button>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Assets"
          value={summary.totalAssets.toString()}
          subtitle={`${summary.rentedOutCount} rented out`}
          icon={Package}
          gradient="purple"
        />
        <KPICard
          title="Total Value"
          value={`R ${formatMoney(summary.totalValue)}`}
          subtitle="Current value (excl. retired)"
          icon={Wallet}
          gradient="blue"
        />
        <KPICard
          title="Currently Rented"
          value={summary.rentedOutCount.toString()}
          subtitle="Assets out on rental"
          icon={ArrowLeftRight}
          gradient="amber"
        />
        <KPICard
          title="Rental Income"
          value={`R ${formatMoney(summary.totalRentalIncome)}`}
          subtitle="Total earned (adds to balance)"
          icon={TrendingUp}
          gradient="green"
        />
      </div>

      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-300"
        >
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-[20px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)] border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Filter Assets
          </h3>
          {!loading && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {filteredAssets.length}{" "}
              {filteredAssets.length === 1 ? "asset" : "assets"}
            </span>
          )}
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, category, serial, location..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-colors dark:text-white"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as AssetStatus | "all")
            }
            className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-colors dark:text-white"
          >
            {STATUS_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          Loading assets...
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="flex flex-col items-center text-center py-16 px-6">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center mb-4">
            <Package className="w-7 h-7 text-purple-500 dark:text-purple-400" />
          </div>
          {assets.length === 0 ? (
            <>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                No assets yet
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm">
                Add the club's movable assets to track their value and record
                rentals to members or outsiders.
              </p>
              {canCreate("assets") && (
                <Button
                  icon={Plus}
                  onClick={() => setShowCreate(true)}
                  className="mt-5"
                >
                  Add your first asset
                </Button>
              )}
            </>
          ) : (
            <>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                No assets match your filters
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm">
                Try a different search term or status.
              </p>
              <Button
                variant="secondary"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                }}
                className="mt-5"
              >
                Clear filters
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              className="bg-white dark:bg-gray-800 rounded-[20px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)] border border-gray-100 dark:border-gray-700"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  {(() => {
                    const { Icon, tile } = assetCategoryVisual(asset.category);
                    return (
                      <div
                        className={`w-12 h-12 bg-gradient-to-br ${tile} rounded-xl flex items-center justify-center shadow-lg shrink-0`}
                      >
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                    );
                  })()}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                        {asset.name}
                      </h3>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${assetCategoryVisual(
                          asset.category
                        ).chip}`}
                      >
                        {assetCategoryLabel(asset.category)}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${assetStatusBadgeClass(
                          asset.status
                        )}`}
                      >
                        {assetStatusLabel(asset.status)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      R {formatMoney(asset.current_value)} · bought{" "}
                      {format(asset.purchase_date.toDate(), "MMM yyyy")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {canCreate("assets") && isAssetAvailable(asset) && (
                    <Button
                      variant="secondary"
                      icon={ArrowLeftRight}
                      onClick={() => setRentingAsset(asset)}
                    >
                      Rent out
                    </Button>
                  )}
                  <button
                    onClick={() => setDetailAsset(asset)}
                    className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                    title="View details"
                    aria-label={`View details for ${asset.name}`}
                  >
                    <Eye className="w-5 h-5 text-gray-500" />
                  </button>
                  {canEdit("assets") && (
                    <button
                      onClick={() => setEditingAsset(asset)}
                      className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                      title="Edit"
                      aria-label={`Edit ${asset.name}`}
                    >
                      <Edit className="w-5 h-5 text-gray-500" />
                    </button>
                  )}
                  {canDelete("assets") && (
                    <button
                      onClick={() => setDeletingAsset(asset)}
                      disabled={deleteLoading && deletingAsset?.id === asset.id}
                      className="p-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete"
                      aria-label={`Delete ${asset.name}`}
                    >
                      <Trash2 className="w-5 h-5 text-red-500" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showCreate && (
        <AssetFormModal
          onClose={() => setShowCreate(false)}
          onSaved={fetchData}
        />
      )}
      {editingAsset && (
        <AssetFormModal
          asset={editingAsset}
          onClose={() => setEditingAsset(null)}
          onSaved={fetchData}
        />
      )}
      {rentingAsset && (
        <RentAssetModal
          asset={rentingAsset}
          onClose={() => setRentingAsset(null)}
          onRented={fetchData}
        />
      )}
      {detailAsset && (
        <AssetDetailModal
          asset={detailAsset}
          onClose={() => setDetailAsset(null)}
          onUpdate={fetchData}
        />
      )}

      <ConfirmModal
        isOpen={!!deletingAsset}
        onClose={() => !deleteLoading && setDeletingAsset(null)}
        onConfirm={handleConfirmDelete}
        title="Delete asset"
        message={
          deletingAsset
            ? `Delete "${deletingAsset.name}"? This cannot be undone. Rental history for this asset is kept.`
            : ""
        }
        confirmLabel="Delete"
        variant="danger"
        loading={deleteLoading}
      />
    </div>
  );
};

export default Assets;
