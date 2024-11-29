import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

export const formatFirestoreDate = (date: Timestamp | Date | string | undefined): string => {
  if (!date) return 'Invalid date';
  
  if (date instanceof Timestamp) {
    return format(date.toDate(), 'dd MMM yyyy');
  }
  if (date instanceof Date) {
    return format(date, 'dd MMM yyyy');
  }
  if (typeof date === 'string') {
    return format(new Date(date), 'dd MMM yyyy');
  }
  return 'Invalid date';
};

export const toFirestoreTimestamp = (date: Date | string | undefined): Timestamp => {
  if (!date) return Timestamp.now();
  
  if (typeof date === 'string') {
    return Timestamp.fromDate(new Date(date));
  }
  if (date instanceof Date) {
    return Timestamp.fromDate(date);
  }
  return Timestamp.now();
};

export const isValidDate = (date: any): boolean => {
  if (!date) return false;
  if (date instanceof Timestamp) return true;
  if (date instanceof Date) return !isNaN(date.getTime());
  if (typeof date === 'string') {
    const d = new Date(date);
    return !isNaN(d.getTime());
  }
  return false;
};