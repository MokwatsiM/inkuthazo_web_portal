import { useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import { listenForegroundMessages, syncPushToken } from '../../services/pushService';

/**
 * Headless: keeps an opted-in member's push token current and shows pushes
 * that arrive while the app is open as an in-app toast (R6 AC6.4) — the
 * service worker only handles them when the app is closed or in the background.
 */
const PushManager = () => {
  const { userDetails } = useAuth();
  const { showInfo } = useNotifications();
  const uid = userDetails?.id;
  const optedIn = userDetails?.push_notifications === true;

  useEffect(() => {
    if (uid && optedIn) void syncPushToken(uid);
  }, [uid, optedIn]);

  useEffect(() => {
    if (!uid || !optedIn) return;
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;
    listenForegroundMessages(({ title, body }) => showInfo(body, title)).then((off) => {
      if (cancelled) off();
      else unsubscribe = off;
    });
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [uid, optedIn, showInfo]);

  return null;
};

export default PushManager;
