import { Timestamp } from "firebase/firestore";
import {
  // startOfMonth,
  // endOfMonth,
  eachMonthOfInterval,
  isSameMonth,
} from "date-fns";
import { getConfigurationValue } from "../services/configurationService";
import type { Contribution } from "../types";

export const calculateUnpaidMonths = async (
  contributions: Contribution[],
  startDate: Date,
  endDate: Date = new Date()
): Promise<Date[]> => {
  // Get all months in the range
  const months = eachMonthOfInterval({ start: startDate, end: endDate });

  // Filter approved contributions
  const approvedContributions = contributions.filter(
    (c) => c.status === "approved" && c.type === "monthly"
  );

  // Find months without payments
  return months.filter((month) => {
    const hasPayment = approvedContributions.some((contribution) =>
      isSameMonth(contribution.date.toDate(), month)
    );
    return !hasPayment;
  });
};

export const calculateInvoiceAmount = async (
  unpaidMonths: Date[]
): Promise<number> => {
  let totalAmount = 0;

  for (const month of unpaidMonths) {
    const monthlyFee = await getConfigurationValue("monthly_fee", month);
    totalAmount += monthlyFee;
  }

  return totalAmount;
};

export interface InvoiceDetails {
  unpaidMonths: Date[];
  totalAmount: number;
  monthlyFee: number;
}

export const generateInvoiceDetails = async (
  contributions: Contribution[],
  joinDate: Timestamp
): Promise<InvoiceDetails> => {
  // Get current monthly fee for display purposes
  const currentMonthlyFee = await getConfigurationValue("monthly_fee");

  const unpaidMonths = await calculateUnpaidMonths(
    contributions,
    joinDate.toDate()
  );

  return {
    unpaidMonths,
    totalAmount: await calculateInvoiceAmount(unpaidMonths),
    monthlyFee: currentMonthlyFee,
  };
};
