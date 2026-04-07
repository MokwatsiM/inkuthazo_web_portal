// src/services/auditService.ts
import {
  collection,
  addDoc,
  Timestamp,
  query,
  orderBy,
  limit,
  getDocs,
  where,
  QueryConstraint,
  startAfter,
  writeBatch,
  doc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { logger } from '../utils/logger';

export interface AuditLog {
  id: string;
  action: string;
  userId: string;
  userName?: string;
  details: Record<string, any>;
  timestamp: Timestamp;
}

export interface AuditFilter {
  userId?: string;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  limitCount?: number;
  lastDoc?: any;
}

export const logAuditTrail = async (
  userId: string,
  action: string,
  details: Record<string, any>,
  userName?: string
) => {
  try {
    const auditRef = collection(db, 'audit_logs');
    await addDoc(auditRef, {
      userId,
      userName: userName || 'Unknown',
      action,
      details,
      timestamp: Timestamp.now()
    });
  } catch (error) {
    logger.error('Error logging audit trail:', error);
    throw error;
  }
};

export const getAuditLogs = async (filters: AuditFilter = {}) => {
  try {
    const auditRef = collection(db, 'audit_logs');
    const constraints: QueryConstraint[] = [orderBy('timestamp', 'desc')];

    if (filters.userId) {
      constraints.push(where('userId', '==', filters.userId));
    }
    if (filters.action) {
      constraints.push(where('action', '==', filters.action));
    }
    if (filters.startDate) {
      constraints.push(where('timestamp', '>=', Timestamp.fromDate(filters.startDate)));
    }
    if (filters.endDate) {
      constraints.push(where('timestamp', '<=', Timestamp.fromDate(filters.endDate)));
    }
    
    if (filters.limitCount) {
      constraints.push(limit(filters.limitCount));
    } else {
      constraints.push(limit(50));
    }

    if (filters.lastDoc) {
      constraints.push(startAfter(filters.lastDoc));
    }

    const q = query(auditRef, ...constraints);
    const snapshot = await getDocs(q);
    
    return {
      logs: snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AuditLog[],
      lastDoc: snapshot.docs[snapshot.docs.length - 1]
    };
  } catch (error) {
    logger.error('Error fetching audit logs:', error);
    throw error;
  }
};

export const getAuditStats = async (days: number = 7) => {
  try {
    const auditRef = collection(db, 'audit_logs');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const q = query(
      auditRef,
      where('timestamp', '>=', Timestamp.fromDate(startDate)),
      orderBy('timestamp', 'desc')
    );

    const snapshot = await getDocs(q);
    const logs = snapshot.docs.map(doc => doc.data() as AuditLog);

    const actionCounts: Record<string, number> = {};
    const dailyActivity: Record<string, number> = {};

    logs.forEach(log => {
      // Count by action
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;

      // Count by day
      const dateKey = log.timestamp.toDate().toLocaleDateString();
      dailyActivity[dateKey] = (dailyActivity[dateKey] || 0) + 1;
    });

    return {
      actionCounts,
      dailyActivity,
      totalCount: logs.length
    };
  } catch (error) {
    logger.error('Error fetching audit stats:', error);
    throw error;
  }
};

// Get count of logs older than specified months
export const getOldLogsCount = async (months: number = 3) => {
  try {
    const auditRef = collection(db, 'audit_logs');
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - months);

    const q = query(
      auditRef,
      where('timestamp', '<', Timestamp.fromDate(cutoffDate))
    );

    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    logger.error('Error counting old logs:', error);
    throw error;
  }
};

// Bulk delete logs older than specified months
export const bulkDeleteOldLogs = async (months: number = 3) => {
  try {
    const auditRef = collection(db, 'audit_logs');
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - months);

    const q = query(
      auditRef,
      where('timestamp', '<', Timestamp.fromDate(cutoffDate)),
      limit(500) // Process in batches of 500
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return 0;
    }

    const batch = writeBatch(db);
    snapshot.docs.forEach((document) => {
      batch.delete(doc(db, 'audit_logs', document.id));
    });

    await batch.commit();

    return snapshot.size;
  } catch (error) {
    logger.error('Error deleting old logs:', error);
    throw error;
  }
};
