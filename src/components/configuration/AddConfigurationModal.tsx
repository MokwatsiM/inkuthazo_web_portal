import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import Button from "../ui/Button";
import { addConfiguration } from "../../services/configurationService";
import type {
  ConfigurationInput,
  ConfigurationType,
} from "../../types/configuration";

interface AddConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => Promise<void>;
}

const AddConfigurationModal: React.FC<AddConfigurationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const { userDetails } = useAuth();
  const [formData, setFormData] = useState<ConfigurationInput>({
    type: "monthly_fee",
    name: "",
    description: "",
    value: 0,
    effective_date: new Date(),
    end_date: undefined,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userDetails?.id) return;

    setLoading(true);
    setError(null);

    try {
      await addConfiguration(formData, userDetails.id);
      await onSubmit();
      setFormData({
        type: "monthly_fee",
        name: "",
        description: "",
        value: 0,
        effective_date: new Date(),
        end_date: undefined,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to add configuration"
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
      <div className="bg-surface dark:bg-surface-dark rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-text-primary dark:text-text-primary-dark">Add New Configuration</h2>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary dark:text-text-primary-dark">
              Configuration Type
            </label>
            <select
              required
              className="mt-1 block w-full rounded-input border border-line dark:border-line-dark bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200"
              value={formData.type}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  type: e.target.value as ConfigurationType,
                }))
              }
            >
              <option value="monthly_fee">Monthly Fee</option>
              <option value="late_penalty">Late Payment Penalty</option>
              <option value="registration_fee">Registration Fee</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary dark:text-text-primary-dark">
              Name
            </label>
            <input
              type="text"
              required
              className="mt-1 block w-full rounded-input border border-line dark:border-line-dark bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder={`Enter ${getTypeDisplayName(
                formData.type
              ).toLowerCase()} name`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary dark:text-text-primary-dark">
              Description
            </label>
            <textarea
              required
              className="mt-1 block w-full rounded-input border border-line dark:border-line-dark bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200"
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Describe this configuration..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary dark:text-text-primary-dark">
              Value (R)
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-text-secondary dark:text-text-secondary-dark sm:text-sm">R</span>
              </div>
              <input
                type="number"
                step="0.01"
                required
                min="0"
                className="pl-7 block w-full rounded-input border border-line dark:border-line-dark bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200"
                value={formData.value}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    value: parseFloat(e.target.value) || 0,
                  }))
                }
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary dark:text-text-primary-dark">
              Effective Date
            </label>
            <input
              type="date"
              required
              className="mt-1 block w-full rounded-input border border-line dark:border-line-dark bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200"
              value={formData.effective_date.toISOString().split("T")[0]}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  effective_date: new Date(e.target.value),
                }))
              }
            />
            <p className="mt-1 text-sm text-text-secondary dark:text-text-secondary-dark">
              This configuration will take effect from this date onwards
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary dark:text-text-primary-dark">
              End Date (Optional)
            </label>
            <input
              type="date"
              className="mt-1 block w-full rounded-input border border-line dark:border-line-dark bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200"
              value={formData.end_date ? formData.end_date.toISOString().split("T")[0] : ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  end_date: e.target.value ? new Date(e.target.value) : undefined,
                }))
              }
            />
            <p className="mt-1 text-sm text-text-secondary dark:text-text-secondary-dark">
              Leave empty for configuration to remain active indefinitely. Set an end date to automatically expire this configuration.
            </p>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Configuration"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddConfigurationModal;
