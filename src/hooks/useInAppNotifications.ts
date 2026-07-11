import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import {
  subscribeToNotifications,
  markAsRead as markAsReadService,
  markAllAsRead as markAllAsReadService,
} from '../services/notificationService';
import type { InAppNotification } from '../types/inAppNotification';
import logger from '../utils/logger';

/**
 * Live in-app notifications for the signed-in user. Uses a Firestore
 * onSnapshot listener (not TanStack Query) so the bell updates in real
 * time when a reviewer acts while the member has the app open.
 */
export const useInAppNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);

  useEffect(() => {
    if (!user?.uid) {
      setNotifications([]);
      return;
    }
    return subscribeToNotifications(user.uid, setNotifications);
  }, [user?.uid]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications]
  );

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await markAsReadService(notificationId);
    } catch (error) {
      logger.error('[notifications] failed to mark as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user?.uid) return;
    try {
      await markAllAsReadService(user.uid);
    } catch (error) {
      logger.error('[notifications] failed to mark all as read:', error);
    }
  }, [user?.uid]);

  return { notifications, unreadCount, markAsRead, markAllAsRead };
};
