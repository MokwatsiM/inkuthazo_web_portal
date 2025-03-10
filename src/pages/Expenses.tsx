import React, { useState, useEffect } from "react";
import { PlusCircle, Edit2, Trash2, CheckCircle } from "lucide-react";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "../config/firebase";
import { useAuth } from "../hooks/useAuth";
import Button from "../components/ui/Button";
import Table from "../components/ui/Table";
import SearchInput from "../components/ui/SearchInput";
import { formatDate } from "../utils/dateUtils";
import {
  addExpense,
  updateExpense,
  deleteExpense,
  markExpenseAsPaid,
} from "../services/expenseService";
import AddExpenseModal from "../components/expenses/AddExpenseModal";
import EditExpenseModal from "../components/expenses/EditExpenseModal";
import PayExpenseModal from "../components/expenses/PayExpenseModal";
import type { Expense } from "../types/expense";

const Expenses: React.FC = () => {
  const { userDetails } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const expensesRef = collection(db, "expenses");
      const q = query(expensesRef, orderBy("date", "desc"));
      const snapshot = await getDocs(q);

      const expensesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Expense[];

      setExpenses(expensesData);
    } catch (error) {
      console.error("Error fetching expenses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (
    data: Omit<Expense, "id" | "status" | "created_at" | "updated_at">
  ) => {
    if (!userDetails?.id) return;
    try {
      await addExpense({
        ...data,
        created_by: userDetails.id,
      });
      await fetchExpenses();
      setIsAddModalOpen(false);
    } catch (error) {
      console.error("Error adding expense:", error);
    }
  };

  const handleUpdateExpense = async (id: string, data: Partial<Expense>) => {
    try {
      await updateExpense(id, data);
      await fetchExpenses();
      setIsEditModalOpen(false);
      setSelectedExpense(null);
    } catch (error) {
      console.error("Error updating expense:", error);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this expense?"))
      return;

    try {
      await deleteExpense(id);
      await fetchExpenses();
    } catch (error) {
      console.error("Error deleting expense:", error);
    }
  };

  const handleMarkAsPaid = async (id: string, paymentReference: string) => {
    try {
      await markExpenseAsPaid(id, paymentReference);
      await fetchExpenses();
      setIsPayModalOpen(false);
      setSelectedExpense(null);
    } catch (error) {
      console.error("Error marking expense as paid:", error);
    }
  };

  const filteredExpenses = expenses.filter(
    (expense) =>
      expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate totals
  const totals = {
    pending: filteredExpenses
      .filter((e) => e.status === "pending")
      .reduce((sum, e) => sum + e.amount, 0),
    paid: filteredExpenses
      .filter((e) => e.status === "paid")
      .reduce((sum, e) => sum + e.amount, 0),
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Expenses</h2>
        <Button icon={PlusCircle} onClick={() => setIsAddModalOpen(true)}>
          Add Expense
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Total Pending
          </h3>
          <p className="mt-2 text-3xl font-semibold text-red-600 dark:text-red-400">
            R {totals.pending.toFixed(2)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Total Paid
          </h3>
          <p className="mt-2 text-3xl font-semibold text-green-600 dark:text-green-400">
            R {totals.paid.toFixed(2)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Total Expenses
          </h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
            R {(totals.pending + totals.paid).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <SearchInput
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Table
          headers={["Date", "Title", "Type", "Amount", "Status", "Actions"]}
        >
          {loading ? (
            <tr>
              <td colSpan={6} className="px-6 py-4 text-center">
                Loading...
              </td>
            </tr>
          ) : filteredExpenses.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                No expenses found
              </td>
            </tr>
          ) : (
            filteredExpenses.map((expense) => (
              <tr key={expense.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {formatDate(expense.date)}
                </td>
                <td className="px-6 py-4">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {expense.title}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {expense.description}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap capitalize">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      expense.type === "recurring"
                        ? "bg-purple-100 text-purple-800 dark:bg-purple-200 dark:text-purple-900"
                        : "bg-blue-100 text-blue-800 dark:bg-blue-200 dark:text-blue-900"
                    }`}
                  >
                    {expense.type}
                    {expense.recurrence && (
                      <span className="ml-1 text-xs">
                        (Day {expense.recurrence.day_of_month})
                      </span>
                    )}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  R {expense.amount.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      expense.status === "paid"
                        ? "bg-green-100 text-green-800 dark:bg-green-200 dark:text-green-900"
                        : expense.status === "cancelled"
                        ? "bg-red-100 text-red-800 dark:bg-red-200 dark:text-red-900"
                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-200 dark:text-yellow-900"
                    }`}
                  >
                    {expense.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    {expense.status === "pending" && (
                      <button
                        onClick={() => {
                          setSelectedExpense(expense);
                          setIsPayModalOpen(true);
                        }}
                        className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                      >
                        <CheckCircle className="h-5 w-5" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedExpense(expense);
                        setIsEditModalOpen(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                      <Edit2 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteExpense(expense.id)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </Table>
      </div>

      {/* Modals */}
      <AddExpenseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddExpense}
      />

      {selectedExpense && (
        <>
          <EditExpenseModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedExpense(null);
            }}
            onSubmit={handleUpdateExpense}
            expense={selectedExpense}
          />

          <PayExpenseModal
            isOpen={isPayModalOpen}
            onClose={() => {
              setIsPayModalOpen(false);
              setSelectedExpense(null);
            }}
            onSubmit={handleMarkAsPaid}
            expense={selectedExpense}
          />
        </>
      )}
    </div>
  );
};

export default Expenses;
