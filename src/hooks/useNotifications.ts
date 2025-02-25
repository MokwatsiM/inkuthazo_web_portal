import { useCallback } from 'react';
import { useNotification } from '../context/NotificationContext';
import { createNotification } from '../utils/notification';
import type { NotificationType } from '../types/notification';

export const useNotifications = () => {
  const { addNotification } = useNotification();

  const showNotification = useCallback((
    message: string,
    type: NotificationType = 'info',
    title?: string,
    duration?: number
  ) => {
    const notification = createNotification(message, type, title, duration);
    addNotification(notification);
  }, [addNotification]);

  const showSuccess = useCallback((message: string, title?: string) => {
    showNotification(message, 'success', title);
  }, [showNotification]);

  const showError = useCallback((message: string, title?: string) => {
    showNotification(message, 'error', title);
  }, [showNotification]);

  const showWarning = useCallback((message: string, title?: string) => {
    showNotification(message, 'warning', title);
  }, [showNotification]);

  const showInfo = useCallback((message: string, title?: string) => {
    showNotification(message, 'info', title);
  }, [showNotification]);

  return {
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};