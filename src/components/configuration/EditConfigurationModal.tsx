import React, { useState, useEffect } from "react";
import { getFriendlyErrorMessage } from "../../utils/errorMessages";
import Button from "../ui/Button";
import { formatDate } from "../../utils/dateUtils";
import type {
  Configuration,
  ConfigurationType,
} from "../../types/configuration";
import { Timestamp } from "firebase/firestore";

interface EditConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, data: Partial<Configuration>) => Promise<void>;
  configuration: Configuration;
}

const EditConfigurationModal: React.FC<EditConfigurationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  configuration,
}) => {
  const [formData, setFormData] = useState({
    name: configuration.name,
    description: configuration.description,
    value: configuration.value,
    effective_date: configuration.effective_date
      .toDate()
      .toISOString()
      .split("T")[0],
    end_date: configuration.end_date
      ? configuration.end_date.toDate().toISOString().split("T")[0]
      : "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFormData({
      name: configuration.name,
      description: configuration.description,
      value: configuration.value,
      effective_date: configuration.effective_date
        .toDate()
        .toISOString()
        .split("T")[0],
      end_date: configuration.end_date
        ? configuration.end_date.toDate().toISOString().split("T")[0]
        : "",
    });
  }, [configuration]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const updateData: Partial<Configuration> = {
        name: formData.name,
        description: formData.description,
        value: formData.value,
        effective_date: Timestamp.fromDate(new Date(formData.effective_date)),
      };

      // Only include end_date if a value is provided
      if (formData.end_date) {
        updateData.end_date = Timestamp.fromDate(new Date(formData.end_date));
      }

      await onSubmit(configuration.id, updateData);
    } catch (err) {
      setError(
        getFriendlyErrorMessage(err, "Failed to update configuration")
      );
    } finally {
      setLoading(false);
    }
  };

  const getTypeDisplayName = (type: ConfigurationType) => {
    const names = {
      monthly_fee: "Monthly Fee",
      late_penalty: "Late Payment Penalty",
      registration_fee: "Registration Fee",
      other: "Other",
    };
    return names[type];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Edit Configuration</h2>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
            {error}
          </div>
        )}

        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">Type:</span>{" "}
            {getTypeDisplayName(configuration.type)}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">Current Effective Date:</span>{" "}
            {formatDate(configuration.effective_date)}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">Current End Date:</span>{" "}
            {configuration.end_date ? formatDate(configuration.end_date) : "No end date (active indefinitely)"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Name
            </label>
            <input
              type="text"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200"
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Value (R)
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">R</span>
              </div>
              <input
                type="number"
                step="0.01"
                required
                min="0"
                className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200"
                value={formData.value}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    value: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              New Effective Date
            </label>
            <input
              type="date"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200"
              value={formData.effective_date}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  effective_date: e.target.value,
                }))
              }
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Changes will take effect from this date onwards
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              End Date (Optional)
            </label>
            <input
              type="date"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200"
              value={formData.end_date}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  end_date: e.target.value,
                }))
              }
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Leave empty for configuration to remain active indefinitely. Set an end date to automatically expire this configuration.
            </p>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Configuration"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditConfigurationModal;
