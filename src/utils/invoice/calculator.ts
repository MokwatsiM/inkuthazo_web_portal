import { Timestamp } from 'firebase/firestore';
import {  eachMonthOfInterval, isSameMonth } from 'date-fns';
import type { Contribution } from '../../types/contribution';
import type { InvoiceDetails } from './types';

const MONTHLY_FEE = 150;

export const calculateUnpaidMonths = (
  contributions: Contribution[],
  startDate: Date,
  endDate: Date = new Date()
): Date[] => {
  // Get all months in the range
  const months = eachMonthOfInterval({ start: startDate, end: endDate });
  
  // Filter approved contributions
  const approvedContributions = contributions.filter(c => 
    c.status === 'approved' && 
    c.type === 'monthly'
  );

  // Find months without payments
  return months.filter(month => {
    const hasPayment = approvedContributions.some(contribution => 
      isSameMonth(contribution.date.toDate(), month)
    );
    return !hasPayment;
  });
};

export const calculateInvoiceAmount = (unpaidMonths: Date[]): number => {
  return unpaidMonths.length * MONTHLY_FEE;
};

export const generateInvoiceDetails = (
  contributions: Contribution[],
  joinDate: Timestamp
): InvoiceDetails => {
  const unpaidMonths = calculateUnpaidMonths(
    contributions,
    joinDate.toDate()
  );

  return {
    unpaidMonths,
    totalAmount: calculateInvoiceAmount(unpaidMonths),
    monthlyFee: MONTHLY_FEE
  };
};