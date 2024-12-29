import type { Notification, NotificationType } from '../types/notification';
import { DEFAULT_NOTIFICATION_DURATION } from '../constants/notification';

export const createNotification = (
  message: string,
  type: NotificationType = 'info',
  title?: string,
  duration?: number
): Omit<Notification, 'id'> => ({
  message,
  type,
  title,
  duration: duration || DEFAULT_NOTIFICATION_DURATION
});

export const generateNotificationId = (): string => 
  Math.random().toString(36).substring(2, 9);