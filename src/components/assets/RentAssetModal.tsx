// src/components/assets/RentAssetModal.tsx
import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Timestamp, collection, getDocs } from "firebase/firestore";
import { db } from "../../config/firebase";
import Button from "../ui/Button";
import { useAuth } from "../../hooks/useAuth";
import { rentOutAsset } from "../../services/assetService";
import type { Asset, RenterType } from "../../types/asset";
import type { Member } from "../../types";
import { getActionableErrorMessage } from "../../utils/errorMessages";
import logger from "../../utils/logger";

interface RentAssetModalProps {
  asset: Asset;
  onClose: () => void;
  onRented: () => void;
}

const today = () => new Date().toISOString().split("T")[0];

const RentAssetModal: React.FC<RentAssetModalProps> = ({
  asset,
  onClose,
  onRented,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);

  const [formData, setFormData] = useState({
    renter_type: "member" as RenterType,
    member_id: "",
    renter_name: "",
    contact: "",
    rental_fee: "",
    start_date: today(),
    due_date: today(),
    notes: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const snapshot = await getDocs(collection(db, "members"));
        const list = snapshot.docs.map(
          (d) => ({ id: d.id, ...d.data() } as Member)
        );
        setMembers(list.filter((m) => m.status === "approved"));
      } catch (err) {
        logger.error("Error fetching members:", err);
      }
    })();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === "member_id" && value) {
      const selected = members.find((m) => m.id === value);
      setFormData((prev) => ({
        ...prev,
        member_id: value,
        renter_name: selected?.full_name ?? prev.renter_name,
        contact: selected?.phone ?? prev.contact,
      }));
      return;
    }

    if (name === "renter_type") {
      setFormData((prev) => ({
        ...prev,
        renter_type: value as RenterType,
        member_id: "",
        renter_name: "",
        contact: "",
      }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (new Date(formData.due_date) < new Date(formData.start_date)) {
      setError("Due date cannot be before the start date.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const isMember = formData.renter_type === "member";
      await rentOutAsset(
        {
          asset_id: asset.id,
          asset_name: asset.name,
          renter_type: formData.renter_type,
          member_id: isMember ? formData.member_id : undefined,
          renter_name: formData.renter_name.trim(),
          contact: formData.contact.trim() || undefined,
          rental_fee: parseFloat(formData.rental_fee) || 0,
          start_date: Timestamp.fromDate(new Date(formData.start_date)),
          due_date: Timestamp.fromDate(new Date(formData.due_date)),
          notes: formData.notes.trim() || undefined,
          created_by: user.uid,
        },
        user.uid,
        user.email || undefined
      );

      onRented();
      onClose();
    } catch (err) {
      logger.error("Error renting out asset:", err);
      setError(
        getActionableErrorMessage(err, "Failed to record rental. Please try again.")
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all dark:text-white";
  const labelClass =
    "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2";
  const isMember = formData.renter_type === "member";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-surface-dark rounded-[20px] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-surface-dark border-b border-gray-200 dark:border-gray-700 p-6 rounded-t-[20px]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Rent Out Asset
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {asset.name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
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
              Renter <span className="text-red-500">*</span>
            </label>
            <select
              name="renter_type"
              value={formData.renter_type}
              onChange={handleChange}
              required
              className={inputClass}
            >
              <option value="member">Member</option>
              <option value="outsider">Outsider</option>
            </select>
          </div>

          {isMember && (
            <div>
              <label className={labelClass}>
                Select Member <span className="text-red-500">*</span>
              </label>
              <select
                name="member_id"
                value={formData.member_id}
                onChange={handleChange}
                required
                className={inputClass}
              >
                <option value="">Select a member...</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                Renter Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="renter_name"
                value={formData.renter_name}
                onChange={handleChange}
                required
                disabled={isMember && !!formData.member_id}
                className={`${inputClass} disabled:opacity-50`}
                placeholder="Enter renter name"
              />
            </div>
            <div>
              <label className={labelClass}>Contact</label>
              <input
                type="text"
                name="contact"
                value={formData.contact}
                onChange={handleChange}
                className={inputClass}
                placeholder="Phone or email"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>
                Rental Fee (R) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="rental_fee"
                value={formData.rental_fee}
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
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>
                Due Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="due_date"
                value={formData.due_date}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </div>
          </div>

          <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 text-xs text-blue-800 dark:text-blue-300">
            The rental fee is recorded as income and counts toward the club's
            balance. Set it to 0 if you are lending this asset for free.
          </div>

          <div>
            <label className={labelClass}>Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={2}
              className={`${inputClass} resize-none`}
              placeholder="Any conditions or notes about this rental..."
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
              Rent Out
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RentAssetModal;
