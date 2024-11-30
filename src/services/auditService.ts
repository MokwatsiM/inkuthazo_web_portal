// src/services/auditService.ts
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface AuditLog {
  id: string;
  action: string;
  userId: string;
  details: Record<string, any>;
  timestamp: Timestamp;
}

export const logAuditTrail = async (
  userId: string,
  action: string,
  details: Record<string, any>
) => {
  try {
    const auditRef = collection(db, 'audit_logs');
    await addDoc(auditRef, {
      userId,
      action,
      details,
      timestamp: Timestamp.now()
    });
  } catch (error) {
    console.error('Error logging audit trail:', error);
    throw error;
  }
};
