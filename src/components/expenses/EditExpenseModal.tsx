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
    category: expense.category || "others",
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
      category: expense.category || "others",
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
        category: formData.category as Expense["category"],
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
      <div className="bg-surface dark:bg-surface-dark rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-text-primary dark:text-text-primary-dark">Edit Expense</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary dark:text-text-primary-dark">
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
            <label className="block text-sm font-medium text-text-primary dark:text-text-primary-dark">
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
            <label className="block text-sm font-medium text-text-primary dark:text-text-primary-dark">
              Category
            </label>
            <select
              required
              className="mt-1 block w-full rounded-input border border-line dark:border-line-dark shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark"
              value={formData.category}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  category: e.target.value as Expense["category"],
                }))
              }
            >
              <option value="bank-charges">Bank Charges</option>
              <option value="administration">Administration</option>
              <option value="social">Social</option>
              <option value="others">Others</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary dark:text-text-primary-dark">
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
            <label className="block text-sm font-medium text-text-primary dark:text-text-primary-dark">
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
              className="ml-2 block text-sm text-text-primary dark:text-text-primary-dark"
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
            <Button type="submit">Update Expense</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditExpenseModal;
