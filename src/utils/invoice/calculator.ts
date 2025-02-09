import { Timestamp } from "firebase/firestore";
import {
  // startOfMonth,
  // endOfMonth,
  eachMonthOfInterval,
  isSameMonth,
  // isAfter,
  getDate,
} from "date-fns";
import type { Contribution } from "../../types/contribution";
import type { InvoiceDetails } from "./types";

const MONTHLY_FEE = 150;
const LATE_PAYMENT_PENALTY = 50;
const PAYMENT_DUE_DAY = 7;

interface MonthlyFee {
  month: Date;
  amount: number;
  isLate: boolean;
  isPaid: boolean;
  latePenaltyPaid: boolean;
}

const isPaymentLate = (paymentDate: Date): boolean => {
  return getDate(paymentDate) > PAYMENT_DUE_DAY;
};

const calculateMonthlyAmount = (
  date: Date,
  contribution?: Contribution
): MonthlyFee => {
  const today = new Date();
  const isCurrentMonth = isSameMonth(date, today);
  // const isPastMonth = isAfter(today, endOfMonth(date));

  // If there's a contribution, check if it was paid late
  if (contribution) {
    const paymentDate = contribution.date.toDate();
    const wasPaymentLate = isPaymentLate(paymentDate);

    return {
      month: date,
      amount: wasPaymentLate ? LATE_PAYMENT_PENALTY : 0, // Only charge late fee if paid after due date
      isLate: wasPaymentLate,
      isPaid: contribution.amount > 0,
      latePenaltyPaid: contribution.amount > MONTHLY_FEE,
    };
  }

  // For current month
  if (isCurrentMonth) {
    const isPastDueDate = getDate(today) > PAYMENT_DUE_DAY;
    return {
      month: date,
      amount: MONTHLY_FEE + (isPastDueDate ? LATE_PAYMENT_PENALTY : 0),
      isLate: isPastDueDate,
      isPaid: false,
      latePenaltyPaid: false,
    };
  }

  // For past months
  return {
    month: date,
    amount: MONTHLY_FEE + LATE_PAYMENT_PENALTY, // Past months always include late fee
    isLate: true,
    isPaid: false,
    latePenaltyPaid: false,
  };
};

export const calculateUnpaidMonths = (
  contributions: Contribution[],
  startDate: Date
): MonthlyFee[] => {
  const today = new Date();
  const endDate = today; // Include current month

  // Get all months in the range
  const months = eachMonthOfInterval({ start: startDate, end: endDate });

  // Filter approved contributions
  const approvedContributions = contributions.filter(
    (c) => c.status === "approved" && c.type === "monthly"
  );

  // Calculate fees for all months
  return months
    .map((month) => {
      const monthContribution = approvedContributions.find((contribution) =>
        isSameMonth(contribution.date.toDate(), month)
      );

      const monthlyFee = calculateMonthlyAmount(month, monthContribution);

      // If the month is paid but was paid late and late fee wasn't included
      if (
        monthlyFee.isPaid &&
        monthlyFee.isLate &&
        !monthlyFee.latePenaltyPaid
      ) {
        return {
          ...monthlyFee,
          amount: LATE_PAYMENT_PENALTY, // Only charge the late fee
        };
      }

      // If the month is fully paid (including any applicable late fees), return with zero amount
      if (
        monthlyFee.isPaid &&
        (!monthlyFee.isLate || monthlyFee.latePenaltyPaid)
      ) {
        return {
          ...monthlyFee,
          amount: 0, // No amount due
        };
      }

      return monthlyFee;
    })
    .filter((fee) => fee.amount > 0); // Only include months with amounts due
};

export const calculateInvoiceAmount = (unpaidMonths: MonthlyFee[]): number => {
  return unpaidMonths.reduce((total, { amount }) => total + amount, 0);
};

export const generateInvoiceDetails = (
  contributions: Contribution[],
  joinDate: Timestamp
): InvoiceDetails => {
  const unpaidMonthsFees = calculateUnpaidMonths(
    contributions,
    joinDate.toDate()
  );

  return {
    unpaidMonths: unpaidMonthsFees,
    totalAmount: calculateInvoiceAmount(unpaidMonthsFees),
    monthlyFee: MONTHLY_FEE,
    latePenalty: LATE_PAYMENT_PENALTY,
  };
};
