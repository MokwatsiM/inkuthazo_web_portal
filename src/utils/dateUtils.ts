import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

export const formatDate = (date: Timestamp | Date | string | undefined): string => {
  if (!date) return '';
  
  try {
    if (date instanceof Timestamp) {
      return format(date.toDate(), 'dd MMM yyyy');
    }
    if (date instanceof Date) {
      return format(date, 'dd MMM yyyy');
    }
    if (typeof date === 'string') {
      return format(new Date(date), 'dd MMM yyyy');
    }
    return '';
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

export const toFirestoreTimestamp = (date: Date | string | Timestamp | undefined): Timestamp => {
  if (!date) return Timestamp.now();
  
  try {
    if (date instanceof Timestamp) {
      return date;
    }
    if (typeof date === 'string') {
      return Timestamp.fromDate(new Date(date));
    }
    if (date instanceof Date) {
      return Timestamp.fromDate(date);
    }
    return Timestamp.now();
  } catch (error) {
    console.error('Error converting to timestamp:', error);
    return Timestamp.now();
  }
};

export const isValidDate = (date: unknown): boolean => {
  if (!date) return false;
  try {
    if (date instanceof Timestamp) return true;
    if (date instanceof Date) return !isNaN(date.getTime());
    if (typeof date === 'string') {
      const d = new Date(date);
      return !isNaN(d.getTime());
    }
    return false;
  } catch {
    return false;
  }
};