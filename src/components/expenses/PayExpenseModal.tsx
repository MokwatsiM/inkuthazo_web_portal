import React, { useState } from "react";
import Button from "../ui/Button";
import type { Expense } from "../../types/expense";
import logger from "../../utils/logger";

interface PayExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, paymentReference: string) => Promise<void>;
  expense: Expense;
}

const PayExpenseModal: React.FC<PayExpenseModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  expense,
}) => {
  const [paymentReference, setPaymentReference] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSubmit(expense.id, paymentReference);
      onClose();
    } catch (error) {
      logger.error("Error marking expense as paid:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Mark Expense as Paid</h2>

        <div className="mb-6">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Expense Details
          </div>
          <div className="mt-2">
            <div className="font-medium">{expense.title}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {expense.description}
            </div>
            <div className="mt-1 font-medium">
              R {expense.amount.toFixed(2)}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Payment Reference
            </label>
            <input
              type="text"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200"
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              placeholder="Enter payment reference or transaction ID"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Mark as Paid</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PayExpenseModal;
