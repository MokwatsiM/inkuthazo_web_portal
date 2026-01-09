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
  startAfter
} from 'firebase/firestore';
import { db } from '../config/firebase';

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
    console.error('Error logging audit trail:', error);
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
    console.error('Error fetching audit logs:', error);
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
    console.error('Error fetching audit stats:', error);
    throw error;
  }
};
