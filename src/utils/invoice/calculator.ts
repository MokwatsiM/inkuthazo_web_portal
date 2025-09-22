import { Timestamp } from "firebase/firestore";
import {
  // endOfMonth,
  eachMonthOfInterval,
  isSameMonth,
  // isAfter,
  getDate,
} from "date-fns";
import { getConfigurationValue } from "../../services/configurationService";
import type { Contribution } from "../../types";
import type { InvoiceDetails, MonthlyFee } from "./types";

const PAYMENT_DUE_DAY = 7;


const isPaymentLate = (paymentDate: Date): boolean => {
  return getDate(paymentDate) > PAYMENT_DUE_DAY;
};

const calculateMonthlyAmount = async (
  date: Date,
  contribution?: Contribution,
  excessPayment: number = 0
): Promise<{ fee: MonthlyFee; remainingExcess: number }> => {
  // Get configuration values for this specific month
  const monthlyFee = await getConfigurationValue("monthly_fee", date);
  const latePenalty = await getConfigurationValue("late_penalty", date);

  const today = new Date();
  const isCurrentMonth = isSameMonth(date, today);
  // const isPastMonth = isAfter(today, endOfMonth(date));

  // If there's a contribution, check if it was paid late
  if (contribution) {
    const paymentDate = contribution.date.toDate();
    const wasPaymentLate = isPaymentLate(paymentDate);

    // For paid months, we need to determine what is still owed
    const totalAvailable = contribution.amount + excessPayment;
    const monthlyFeePaid = Math.min(totalAvailable, monthlyFee);
    const isMonthlyFeePaid = monthlyFeePaid >= monthlyFee;

    let latePenaltyOwed = 0;
    let remainingAfterMonthlyFee = Math.max(0, totalAvailable - monthlyFee);

    if (wasPaymentLate) {
      // Late penalty applies
      latePenaltyOwed = Math.max(0, latePenalty - remainingAfterMonthlyFee);
    }

    const totalOwed = (isMonthlyFeePaid ? 0 : monthlyFee - monthlyFeePaid) + latePenaltyOwed;
    const remainingExcess = Math.max(0, totalAvailable - monthlyFee - (wasPaymentLate ? latePenalty : 0));

    return {
      fee: {
        month: date,
        amount: totalOwed,
        isLate: wasPaymentLate,
        isPaid: isMonthlyFeePaid,
        latePenaltyPaid: wasPaymentLate ? latePenaltyOwed === 0 : true,
        monthlyFeeAmount: monthlyFee,
        latePenaltyAmount: latePenalty,
      },
      remainingExcess,
    };
  }

  // For current month
  if (isCurrentMonth) {
    const isPastDueDate = getDate(today) > PAYMENT_DUE_DAY;

    // Calculate what's due
    const monthlyFeeOwed = Math.max(0, monthlyFee - excessPayment);
    const remainingAfterMonthlyFee = Math.max(0, excessPayment - monthlyFee);

    let latePenaltyOwed = 0;
    if (isPastDueDate) {
      latePenaltyOwed = Math.max(0, latePenalty - remainingAfterMonthlyFee);
    }

    const totalOwed = monthlyFeeOwed + latePenaltyOwed;
    const remainingExcess = Math.max(0, excessPayment - monthlyFee - (isPastDueDate ? latePenalty : 0));

    return {
      fee: {
        month: date,
        amount: totalOwed,
        isLate: isPastDueDate,
        isPaid: monthlyFeeOwed === 0 && latePenaltyOwed === 0,
        latePenaltyPaid: isPastDueDate ? latePenaltyOwed === 0 : true,
        monthlyFeeAmount: monthlyFee,
        latePenaltyAmount: latePenalty,
      },
      remainingExcess,
    };
  }

  // For past months without payment - both monthly fee and late penalty are due
  const monthlyFeeOwed = Math.max(0, monthlyFee - excessPayment);
  const remainingAfterMonthlyFee = Math.max(0, excessPayment - monthlyFee);
  const latePenaltyOwed = Math.max(0, latePenalty - remainingAfterMonthlyFee);

  const totalOwed = monthlyFeeOwed + latePenaltyOwed;
  const remainingExcess = Math.max(0, excessPayment - monthlyFee - latePenalty);

  return {
    fee: {
      month: date,
      amount: totalOwed,
      isLate: true,
      isPaid: monthlyFeeOwed === 0 && latePenaltyOwed === 0,
      latePenaltyPaid: latePenaltyOwed === 0,
      monthlyFeeAmount: monthlyFee,
      latePenaltyAmount: latePenalty,
    },
    remainingExcess,
  };
};

const calculateUnpaidMonths = async (
  contributions: Contribution[],
  startDate: Date
): Promise<MonthlyFee[]> => {
  const today = new Date();
  const endDate = today; // Include current month

  // Get all months in the range
  const months = eachMonthOfInterval({ start: startDate, end: endDate });

  // Filter and sort approved contributions by date
  const approvedContributions = contributions
    .filter((c) => c.status === "approved" && c.type === "monthly")
    .sort((a, b) => a.date.toDate().getTime() - b.date.toDate().getTime());

  // Calculate excess payments and apply them to outstanding balances
  let excessPayment = 0;
  const monthlyFees: MonthlyFee[] = [];

  for (const month of months) {
    const monthContribution = approvedContributions.find((contribution) =>
      isSameMonth(contribution.date.toDate(), month)
    );

    // Calculate fees for this month, applying any excess from previous payments
    const { fee, remainingExcess } = await calculateMonthlyAmount(
      month,
      monthContribution,
      excessPayment
    );

    // Update excess payment for next iteration
    excessPayment = remainingExcess;

    // Only add months with outstanding amounts
    if (fee.amount > 0) {
      monthlyFees.push(fee);
    }
  }

  return monthlyFees;
};

/**
 * Calculates the total amount due for an invoice.
 *
 * IMPORTANT: The 'amount' field in each MonthlyFee already includes:
 * - Outstanding monthly fee amount
 * - Outstanding late penalty amount (if applicable)
 *
 * This function correctly sums all outstanding amounts including both
 * monthly contributions and late penalties for all unpaid months.
 *
 * @param unpaidMonths Array of MonthlyFee objects with outstanding balances
 * @returns Total amount due including all fees and penalties
 */
export const calculateInvoiceAmount = (unpaidMonths: MonthlyFee[]): number => {
  return unpaidMonths.reduce((total, { amount }) => total + amount, 0);
};

export const generateInvoiceDetails = async (
  contributions: Contribution[],
  joinDate: Timestamp
): Promise<InvoiceDetails> => {
  // Get current configuration values for display purposes
  // Note: Individual month calculations use historical values from getConfigurationValue(type, date)
  const monthlyFee = await getConfigurationValue("monthly_fee");
  const latePenalty = await getConfigurationValue("late_penalty");

  const unpaidMonthsFees = await calculateUnpaidMonths(
    contributions,
    joinDate.toDate(),
  );

  return {
    unpaidMonths: unpaidMonthsFees,
    totalAmount: calculateInvoiceAmount(unpaidMonthsFees),
    monthlyFee,
    latePenalty,
  };
};

export { calculateUnpaidMonths };
