// src/components/assets/AssetFormModal.tsx
import React, { useState } from "react";
import { X } from "lucide-react";
import { Timestamp } from "firebase/firestore";
import Button from "../ui/Button";
import { useAuth } from "../../hooks/useAuth";
import { createAsset, updateAsset } from "../../services/assetService";
import type {
  Asset,
  AssetCategory,
  AssetCondition,
  AssetStatus,
} from "../../types/asset";
import { getActionableErrorMessage } from "../../utils/errorMessages";
import { useModalA11y } from "../../hooks/useModalA11y";
import logger from "../../utils/logger";

interface AssetFormModalProps {
  asset?: Asset; // present when editing
  onClose: () => void;
  onSaved: () => void;
}

const toDateInput = (ts?: Timestamp) =>
  (ts ? ts.toDate() : new Date()).toISOString().split("T")[0];

const AssetFormModal: React.FC<AssetFormModalProps> = ({
  asset,
  onClose,
  onSaved,
}) => {
  const { user } = useAuth();
  const a11y = useModalA11y({ onClose });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEditing = !!asset;

  const [formData, setFormData] = useState({
    name: asset?.name ?? "",
    description: asset?.description ?? "",
    category: (asset?.category ?? "equipment") as AssetCategory,
    purchase_price: asset ? String(asset.purchase_price) : "",
    current_value: asset ? String(asset.current_value) : "",
    purchase_date: toDateInput(asset?.purchase_date),
    condition: (asset?.condition ?? "good") as AssetCondition,
    status: (asset?.status ?? "available") as AssetStatus,
    serial_number: asset?.serial_number ?? "",
    location: asset?.location ?? "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        category: formData.category,
        purchase_price: parseFloat(formData.purchase_price) || 0,
        current_value: parseFloat(formData.current_value) || 0,
        purchase_date: Timestamp.fromDate(new Date(formData.purchase_date)),
        condition: formData.condition,
        serial_number: formData.serial_number.trim() || undefined,
        location: formData.location.trim() || undefined,
      };

      if (isEditing && asset) {
        await updateAsset(
          asset.id,
          { ...payload, status: formData.status },
          user.uid,
          user.email || undefined
        );
      } else {
        await createAsset(
          { ...payload, created_by: user.uid },
          user.uid,
          user.email || undefined
        );
      }

      onSaved();
      onClose();
    } catch (err) {
      logger.error("Error saving asset:", err);
      setError(getActionableErrorMessage(err, "Failed to save asset. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-colors dark:text-white";
  const labelClass =
    "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2";

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        ref={a11y.ref}
        {...a11y.dialogProps}
        aria-labelledby="asset-form-title"
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-surface-dark rounded-[20px] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white dark:bg-surface-dark border-b border-gray-200 dark:border-gray-700 p-6 rounded-t-[20px]">
          <div className="flex items-center justify-between">
            <h2
              id="asset-form-title"
              className="text-2xl font-bold text-gray-900 dark:text-white"
            >
              {isEditing ? "Edit Asset" : "Add Asset"}
            </h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          <div>
            <label className={labelClass}>
              Asset Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className={inputClass}
              placeholder="e.g. Gazebo tent, PA speaker"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                Category <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className={inputClass}
              >
                <option value="equipment">Equipment</option>
                <option value="furniture">Furniture</option>
                <option value="vehicle">Vehicle</option>
                <option value="electronics">Electronics</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>
                Condition <span className="text-red-500">*</span>
              </label>
              <select
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                required
                className={inputClass}
              >
                <option value="new">New</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                Purchase Price (R) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="purchase_price"
                value={formData.purchase_price}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className={inputClass}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className={labelClass}>
                Current Value (R) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="current_value"
                value={formData.current_value}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className={inputClass}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                Purchase Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="purchase_date"
                value={formData.purchase_date}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </div>
            {isEditing && (
              <div>
                <label className={labelClass}>Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className={inputClass}
                  disabled={asset?.status === "rented_out"}
                >
                  <option value="available">Available</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="retired">Retired</option>
                  {asset?.status === "rented_out" && (
                    <option value="rented_out">Rented out</option>
                  )}
                </select>
                {asset?.status === "rented_out" && (
                  <p className="mt-1 text-xs text-gray-400">
                    Record the return to change status.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Serial / ID Number</label>
              <input
                type="text"
                name="serial_number"
                value={formData.serial_number}
                onChange={handleChange}
                className={inputClass}
                placeholder="Optional"
              />
            </div>
            <div>
              <label className={labelClass}>Storage Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className={inputClass}
                placeholder="Optional"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className={`${inputClass} resize-none`}
              placeholder="Notes about this asset..."
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} loading={loading} className="flex-1">
              {isEditing ? "Save Changes" : "Add Asset"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssetFormModal;
