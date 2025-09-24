import React, { useState } from "react";
import Button from "../ui/Button";
import type { Expense } from "../../types/expense";
import { toFirestoreTimestamp } from "../../utils/dateUtils";

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    data: Omit<Expense, "id" | "status" | "created_at" | "updated_at">
  ) => Promise<void>;
}

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    amount: "",
    type: "one-off" as Expense["type"],
    date: new Date().toISOString().split("T")[0],
    isRecurring: false,
    dayOfMonth: "1",
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data: Omit<Expense, "id" | "status" | "created_at" | "updated_at"> =
        {
          title: formData.title,
          description: formData.description,
          amount: parseFloat(formData.amount),
          type: formData.isRecurring ? "recurring" : "one-off",
          date: toFirestoreTimestamp(formData.date),
          created_by: "user_id", // Replace with actual user ID
        };

      if (formData.isRecurring) {
        data.recurrence = {
          type: "monthly",
          day_of_month: parseInt(formData.dayOfMonth),
        };
      }

      await onSubmit(data);
      onClose();
    } catch (error) {
      console.error("Error adding expense:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Add New Expense</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Title
            </label>
            <input
              type="text"
              required
              className="mt-1 block w-full rounded-input border border-line dark:border-line-dark shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              className="mt-1 block w-full rounded-input border border-line dark:border-line-dark shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark"
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
              Amount (R)
            </label>
            <input
              type="number"
              step="0.01"
              required
              className="mt-1 block w-full rounded-input border border-line dark:border-line-dark shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark"
              value={formData.amount}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, amount: e.target.value }))
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Date
            </label>
            <input
              type="date"
              required
              className="mt-1 block w-full rounded-input border border-line dark:border-line-dark shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark"
              value={formData.date}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, date: e.target.value }))
              }
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isRecurring"
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              checked={formData.isRecurring}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  isRecurring: e.target.checked,
                }))
              }
            />
            <label
              htmlFor="isRecurring"
              className="ml-2 block text-sm text-gray-900 dark:text-gray-300"
            >
              This is a recurring expense
            </label>
          </div>

          {formData.isRecurring && (
            <div>
              <label className="block text-sm font-medium text-text-primary dark:text-text-primary-dark">
                Day of Month
              </label>
              <select
                className="mt-1 block w-full rounded-input border border-line dark:border-line-dark shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark"
                value={formData.dayOfMonth}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    dayOfMonth: e.target.value,
                  }))
                }
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Add Expense</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExpenseModal;
