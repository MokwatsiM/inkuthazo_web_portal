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
import type { InvoiceDetails } from "./types";

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
    const totalDue = wasPaymentLate ? monthlyFee + latePenalty : monthlyFee;

    // Check if the contribution amount plus any excess covers the total due
    const totalAvailable = contribution.amount + excessPayment;
    const isFullyPaid = totalAvailable >= totalDue;
    const remainingExcess = isFullyPaid ? totalAvailable - totalDue : 0;

    return {
      fee: {
        month: date,
        amount: isFullyPaid ? 0 : totalDue - totalAvailable,
        isLate: wasPaymentLate,
        isPaid: isFullyPaid,
        latePenaltyPaid:
          isFullyPaid || totalAvailable >= monthlyFee + latePenalty,
      },
      remainingExcess,
    };
  }

  // For current month
  if (isCurrentMonth) {
    const isPastDueDate = getDate(today) > PAYMENT_DUE_DAY;
    const totalDue = monthlyFee + (isPastDueDate ? latePenalty : 0);

    // Apply any excess payment
    const isFullyPaid = excessPayment >= totalDue;
    const remainingExcess = isFullyPaid ? excessPayment - totalDue : 0;

    return {
      fee: {
        month: date,
        amount: isFullyPaid ? 0 : totalDue - excessPayment,
        isLate: isPastDueDate,
        isPaid: isFullyPaid,
        latePenaltyPaid:
          isFullyPaid || excessPayment >= monthlyFee + latePenalty,
      },
      remainingExcess,
    };
  }

  // For past months
  const totalDue = monthlyFee + latePenalty;
  const isFullyPaid = excessPayment >= totalDue;
  const remainingExcess = isFullyPaid ? excessPayment - totalDue : 0;

  return {
    fee: {
      month: date,
      amount: isFullyPaid ? 0 : totalDue - excessPayment,
      isLate: true,
      isPaid: isFullyPaid,
      latePenaltyPaid: isFullyPaid || excessPayment >= monthlyFee + latePenalty,
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

    // Get the monthly fee for this specific month to check for excess
    const monthlyFeeForThisMonth = await getConfigurationValue(
      "monthly_fee",
      month
    );

    // If there's a contribution for this month, check for excess payment
    if (
      monthContribution &&
      monthContribution.amount > monthlyFeeForThisMonth
    ) {
      const excess = monthContribution.amount - monthlyFeeForThisMonth;
      excessPayment = excess + remainingExcess;
    } else {
      excessPayment = remainingExcess;
    }

    // Only add months with outstanding amounts
    if (fee.amount > 0) {
      monthlyFees.push(fee);
    }
  }

  return monthlyFees;
};

export const calculateInvoiceAmount = (unpaidMonths: MonthlyFee[]): number => {
  return unpaidMonths.reduce((total, { amount }) => total + amount, 0);
};

export const generateInvoiceDetails = async (
  contributions: Contribution[],
  joinDate: Timestamp
): Promise<InvoiceDetails> => {
  // Get current configuration values
  const monthlyFee = await getConfigurationValue("monthly_fee");
  const latePenalty = await getConfigurationValue("late_penalty");

  const unpaidMonthsFees = await calculateUnpaidMonths(
    contributions,
    joinDate.toDate()
  );

  return {
    unpaidMonths: unpaidMonthsFees,
    totalAmount: calculateInvoiceAmount(unpaidMonthsFees),
    monthlyFee,
    latePenalty,
  };
};

export { calculateUnpaidMonths };
