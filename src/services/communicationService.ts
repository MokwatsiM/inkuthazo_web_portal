// src/services/communicationService.ts
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  subject: string;
  content: string;
  read: boolean;
  createdAt: Date;
}

export const sendMessage = async (
  senderId: string,
  recipientId: string,
  subject: string,
  content: string
) => {
  try {
    const messagesRef = collection(db, 'messages');
    await addDoc(messagesRef, {
      senderId,
      recipientId,
      subject,
      content,
      read: false,
      createdAt: new Date()
    });
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};
