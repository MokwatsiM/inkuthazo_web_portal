import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  query,
  where,
  getDoc,
  getDocs,
} from "firebase/firestore";
import { db } from "../config/firebase";
import type { Expense, ExpenseStatus } from "../types/expense";

export const addExpense = async (
  data: Omit<Expense, "id" | "created_at" | "updated_at"> & { status?: ExpenseStatus },
  userId: string
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, "expenses"), {
      ...data,
      status: data.status || "pending",
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    });

    // Log audit trail
    try {
      const { logAuditTrail } = await import("./auditService");
      await logAuditTrail(
        userId,
        "EXPENSE_CREATE",
        {
          expense_id: docRef.id,
          title: data.title,
          amount: data.amount,
          type: data.type
        }
      );
    } catch (auditError) {
      console.error("Failed to log expense creation audit trail:", auditError);
    }

    return docRef.id;
  } catch (error) {
    console.error("Error adding expense:", error);
    throw error;
  }
};

export const updateExpense = async (
  id: string,
  data: Partial<Expense>
): Promise<void> => {
  try {
    const expenseRef = doc(db, "expenses", id);
    
    // Fetch current state for audit log
    let previousExpense: any = null;
    try {
      const docSnap = await getDoc(expenseRef);
      if (docSnap.exists()) {
        previousExpense = docSnap.data();
      }
    } catch (err) {
      console.error("Failed to fetch previous expense state:", err);
    }

    await updateDoc(expenseRef, {
      ...data,
      updated_at: Timestamp.now(),
    });

    // Log audit trail
    try {
      const { logAuditTrail } = await import("./auditService");
      
      // Extract changes
      const changes: Record<string, { old: any; new: any }> = {};
      if (previousExpense) {
        Object.keys(data).forEach((key) => {
          if (JSON.stringify(previousExpense[key]) !== JSON.stringify((data as any)[key])) {
            changes[key] = {
              old: previousExpense[key],
              new: (data as any)[key]
            };
          }
        });
      }

      await logAuditTrail(
        "admin",
        "EXPENSE_UPDATE",
        {
          expense_id: id,
          changes
        }
      );
    } catch (auditError) {
      console.error("Failed to log expense update audit trail:", auditError);
    }
  } catch (error) {
    console.error("Error updating expense:", error);
    throw error;
  }
};

export const deleteExpense = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "expenses", id));

    // Log audit trail
    try {
      const { logAuditTrail } = await import("./auditService");
      await logAuditTrail(
        "admin",
        "EXPENSE_DELETE",
        {
          expense_id: id
        }
      );
    } catch (auditError) {
      console.error("Failed to log expense deletion audit trail:", auditError);
    }
  } catch (error) {
    console.error("Error deleting expense:", error);
    throw error;
  }
};

export const markExpenseAsPaid = async (
  id: string,
  paymentReference: string
): Promise<void> => {
  try {
    const expenseRef = doc(db, "expenses", id);
    await updateDoc(expenseRef, {
      status: "paid",
      payment_date: Timestamp.now(),
      payment_reference: paymentReference,
      updated_at: Timestamp.now(),
    });

    // Log audit trail
    try {
      const { logAuditTrail } = await import("./auditService");
      await logAuditTrail(
        "admin",
        "EXPENSE_PAID",
        {
          expense_id: id,
          payment_reference: paymentReference
        }
      );
    } catch (auditError) {
      console.error("Failed to log expense payment audit trail:", auditError);
    }
  } catch (error) {
    console.error("Error marking expense as paid:", error);
    throw error;
  }
};

export const generateRecurringExpenses = async (): Promise<void> => {
  try {
    const expensesRef = collection(db, "expenses");
    const q = query(
      expensesRef,
      where("type", "==", "recurring"),
      where("status", "!=", "cancelled")
    );

    const snapshot = await getDocs(q);
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    for (const docSnapshot of snapshot.docs) {
      // Convert the document snapshot to data first
      const expenseData = docSnapshot.data();
      const expense = { id: docSnapshot.id, ...expenseData } as Expense;

      if (expense.recurrence) {
        const lastGenerated =
          expense.recurrence.last_generated?.toDate() ||
          expense.created_at.toDate();
        const lastGeneratedMonth = lastGenerated.getMonth();
        const lastGeneratedYear = lastGenerated.getFullYear();

        // Check if we need to generate a new expense for this month
        if (
          currentYear > lastGeneratedYear ||
          (currentYear === lastGeneratedYear &&
            currentMonth > lastGeneratedMonth)
        ) {
          // Create new expense for this month
          const newExpenseDate = new Date(
            currentYear,
            currentMonth,
            expense.recurrence.day_of_month
          );

          await addDoc(collection(db, "expenses"), {
            title: expense.title,
            description: expense.description,
            amount: expense.amount,
            type: "recurring",
            status: "pending",
            date: Timestamp.fromDate(newExpenseDate),
            created_by: expense.created_by,
            created_at: Timestamp.now(),
            updated_at: Timestamp.now(),
            recurrence: {
              ...expense.recurrence,
              last_generated: Timestamp.now(),
            },
          });

          // Update last generated date on the original recurring expense
          await updateDoc(doc(expensesRef, expense.id), {
            "recurrence.last_generated": Timestamp.now(),
            updated_at: Timestamp.now(),
          });
        }
      }
    }
  } catch (error) {
    console.error("Error generating recurring expenses:", error);
    throw error;
  }
};
