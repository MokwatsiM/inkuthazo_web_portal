// src/services/notificationService.ts
import { collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'contribution' | 'payout' | 'system';
  read: boolean;
  createdAt: Timestamp;
}

export const sendNotification = async (
  userId: string,
  title: string,
  message: string,
  type: Notification['type']
) => {
  try {
    const notificationsRef = collection(db, 'notifications');
    await addDoc(notificationsRef, {
      userId,
      title,
      message,
      type,
      read: false,
      createdAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};

export const markNotificationAsRead = async (notificationId: string) => {
  // Implementation
};

export const getUserNotifications = async (userId: string) => {
  // Implementation
};
