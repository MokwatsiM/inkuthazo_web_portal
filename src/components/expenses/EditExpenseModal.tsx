import React, { useState, useEffect } from "react";
import Button from "../ui/Button";
import type { Expense } from "../../types/expense";
import { toFirestoreTimestamp } from "../../utils/dateUtils";

interface EditExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, data: Partial<Expense>) => Promise<void>;
  expense: Expense;
}

const EditExpenseModal: React.FC<EditExpenseModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  expense,
}) => {
  const [formData, setFormData] = useState({
    title: expense.title,
    description: expense.description,
    amount: expense.amount.toString(),
    type: expense.type,
    date: expense.date.toDate().toISOString().split("T")[0],
    isRecurring: expense.type === "recurring",
    dayOfMonth: expense.recurrence?.day_of_month.toString() || "1",
  });

  useEffect(() => {
    setFormData({
      title: expense.title,
      description: expense.description,
      amount: expense.amount.toString(),
      type: expense.type,
      date: expense.date.toDate().toISOString().split("T")[0],
      isRecurring: expense.type === "recurring",
      dayOfMonth: expense.recurrence?.day_of_month.toString() || "1",
    });
  }, [expense]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data: Partial<Expense> = {
        title: formData.title,
        description: formData.description,
        amount: parseFloat(formData.amount),
        type: formData.isRecurring ? "recurring" : "one-off",
         date: toFirestoreTimestamp(formData.date),
      };

      if (formData.isRecurring) {
        data.recurrence = {
          type: "monthly",
          day_of_month: parseInt(formData.dayOfMonth),
        };
      }

      await onSubmit(expense.id, data);
      onClose();
    } catch (error) {
      console.error("Error updating expense:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Edit Expense</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Title
            </label>
            <input
              type="text"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200"
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
              Amount (R)
            </label>
            <input
              type="number"
              step="0.01"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200"
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200"
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Day of Month
              </label>
              <select
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200"
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
            <Button type="submit">Update Expense</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditExpenseModal;
