import { Timestamp } from 'firebase/firestore';
import {  endOfMonth, eachMonthOfInterval, isSameMonth, getDate, isAfter } from 'date-fns';
import type { Contribution } from '../../types/contribution';
import type { InvoiceDetails } from './types';

const MONTHLY_FEE = 150;
const LATE_PAYMENT_PENALTY = 50;
const PAYMENT_DUE_DAY = 7;

interface MonthlyFee {
  month: Date;
  amount: number;
  isLate: boolean;
}

const calculateMonthlyAmount = (date: Date): MonthlyFee => {
  const today = new Date();
  const isCurrentMonth = isSameMonth(date, today);
  const isPastDueDate = isCurrentMonth && getDate(today) > PAYMENT_DUE_DAY;
  const isPastMonth = isAfter(today, endOfMonth(date));
  
  return {
    month: date,
    amount: MONTHLY_FEE + ((isPastDueDate || isPastMonth) ? LATE_PAYMENT_PENALTY : 0),
    isLate: isPastDueDate || isPastMonth
  };
};

export const calculateUnpaidMonths = (
  contributions: Contribution[],
  startDate: Date,
  endDate: Date = new Date()
): MonthlyFee[] => {
  // Get all months in the range
  const months = eachMonthOfInterval({ start: startDate, end: endDate });
  
  // Filter approved contributions
  const approvedContributions = contributions.filter(c => 
    c.status === 'approved' && 
    c.type === 'monthly'
  );

  // Find months without payments and calculate fees
  return months
    .filter(month => {
      const hasPayment = approvedContributions.some(contribution => 
        isSameMonth(contribution.date.toDate(), month)
      );
      return !hasPayment;
    })
    .map(month => calculateMonthlyAmount(month));
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
    latePenalty: LATE_PAYMENT_PENALTY
  };
};