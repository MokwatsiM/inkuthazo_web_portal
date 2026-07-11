import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  updateDoc,
  doc,
  getDocs,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { converter } from '../utils/firestoreConverter';
import type { InAppNotification } from '../types/inAppNotification';
import logger from '../utils/logger';

/**
 * Client access to the `notifications` collection. Documents are created
 * exclusively by Cloud Functions; the client may only read, mark-as-read,
 * and delete the signed-in user's own notifications (enforced by rules).
 */

const NOTIFICATIONS_LIMIT = 30;

const notificationsCollection = () =>
  collection(db, 'notifications').withConverter(converter<InAppNotification>());

/**
 * Realtime subscription to the user's latest notifications (newest first).
 * Returns the unsubscribe function.
 */
export const subscribeToNotifications = (
  userId: string,
  callback: (notifications: InAppNotification[]) => void
): Unsubscribe => {
  const q = query(
    notificationsCollection(),
    where('user_id', '==', userId),
    orderBy('created_at', 'desc'),
    limit(NOTIFICATIONS_LIMIT)
  );

  return onSnapshot(
    q,
    (snapshot) => callback(snapshot.docs.map((docSnapshot) => docSnapshot.data())),
    (error) => logger.error('[notifications] subscription error:', error)
  );
};

export const markAsRead = async (notificationId: string): Promise<void> => {
  await updateDoc(doc(db, 'notifications', notificationId), { read: true });
};

export const markAllAsRead = async (userId: string): Promise<void> => {
  const unread = await getDocs(
    query(
      notificationsCollection(),
      where('user_id', '==', userId),
      where('read', '==', false)
    )
  );
  if (unread.empty) return;

  const batch = writeBatch(db);
  unread.docs.forEach((docSnapshot) => {
    batch.update(doc(db, 'notifications', docSnapshot.id), { read: true });
  });
  await batch.commit();
};
