import { Timestamp } from "firebase/firestore";

export type ExpenseType = "one-off" | "recurring";
export type ExpenseStatus = "pending" | "paid" | "cancelled";
export type ExpenseRecurrence = "monthly";
export type ExpenseCategory = "bank-charges" | "administration" | "social" | "others";

export interface Expense {
  id: string;
  title: string;
  description: string;
  amount: number;
  type: ExpenseType;
  category: ExpenseCategory;
  status: ExpenseStatus;
  date: Timestamp;
  created_by: string;
  created_at: Timestamp;
  updated_at: Timestamp;
  recurrence?: {
    type: ExpenseRecurrence;
    day_of_month: number;
    last_generated?: Timestamp;
  };
  payment_date?: Timestamp;
  payment_reference?: string;
}
