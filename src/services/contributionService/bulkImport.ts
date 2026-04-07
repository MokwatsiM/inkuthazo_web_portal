import { 
  collection, 
  writeBatch, 
  doc, 
  getDocs, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import * as XLSX from 'xlsx';
import { format, parse, isValid } from 'date-fns';
import { ContributionStatus, ContributionType } from '../../types/contribution';
import { Member } from '../../types';
import logger from '../../utils/logger';

export interface ProcessingResult {
  valid: AggregatedContribution[];
  errors: { row: number; message: string }[];
  summary: {
    totalRows: number;
    aggregatedTotal: number;
    totalAmount: number;
  };
}

export interface AggregatedContribution {
  memberId: string;
  memberName: string;
  amount: number;
  monthYear: string; // YYYY-MM
  type: ContributionType;
  originalReferences: string[];
}

/**
 * Parses CSV/Excel file and returns raw rows
 */
export const parseImportFile = async (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        resolve(json);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Matches identifiers to members and aggregates data by month
 */
export const processImportData = async (
  rawRows: any[],
  columnMapping: Record<string, string>
): Promise<ProcessingResult> => {
  const result: ProcessingResult = {
    valid: [],
    errors: [],
    summary: { totalRows: rawRows.length, aggregatedTotal: 0, totalAmount: 0 }
  };

  const membersRef = collection(db, 'members');
  const membersSnapshot = await getDocs(membersRef);
  const members = membersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member));

  const findMember = (identifier: string) => {
    const normalizedId = identifier.toLowerCase().trim();
    return members.find(m => 
      m.email?.toLowerCase() === normalizedId || 
      m.full_name.toLowerCase().trim() === normalizedId
    );
  };

  const aggregationMap = new Map<string, AggregatedContribution>();

  rawRows.forEach((row, index) => {
    const rowNum = index + 1;
    const identifier = String(row[columnMapping.memberIdentifier] || '');
    const amount = Number(row[columnMapping.amount]);
    const dateStr = String(row[columnMapping.date] || '');
    const type = (row[columnMapping.type] || 'monthly') as ContributionType;
    const reference = row[columnMapping.reference] ? String(row[columnMapping.reference]) : '';

    if (!identifier) {
      result.errors.push({ row: rowNum, message: 'Missing member identifier' });
      return;
    }

    const member = findMember(identifier);
    if (!member) {
      result.errors.push({ row: rowNum, message: `Member not found: ${identifier}` });
      return;
    }

    if (isNaN(amount) || amount <= 0) {
      result.errors.push({ row: rowNum, message: `Invalid amount: ${amount}` });
      return;
    }

    const formats = ['yyyy-MM-dd', 'dd/MM/yyyy', 'MM/dd/yyyy', 'yyyy/MM/dd', 'dd-MM-yyyy'];
    let parsedDate: Date | null = null;
    
    for (const fmt of formats) {
      const d = parse(dateStr, fmt, new Date());
      if (isValid(d)) {
        parsedDate = d;
        break;
      }
    }

    if (!parsedDate && !isNaN(Date.parse(dateStr))) {
      parsedDate = new Date(dateStr);
    }

    if (!parsedDate || !isValid(parsedDate)) {
      result.errors.push({ row: rowNum, message: `Invalid date format: ${dateStr}` });
      return;
    }

    const monthYear = format(parsedDate, 'yyyy-MM');
    const aggKey = `${member.id}_${monthYear}_${type}`;

    const existing = aggregationMap.get(aggKey);
    if (existing) {
      existing.amount += amount;
      if (reference) existing.originalReferences.push(reference);
    } else {
      aggregationMap.set(aggKey, {
        memberId: member.id,
        memberName: member.full_name,
        amount,
        monthYear,
        type,
        originalReferences: reference ? [reference] : []
      });
    }
  });

  result.valid = Array.from(aggregationMap.values());
  result.summary.aggregatedTotal = result.valid.length;
  result.summary.totalAmount = result.valid.reduce((sum, item) => sum + item.amount, 0);

  return result;
};

/**
 * Executes the bulk import into Firestore
 */
export const executeBulkImport = async (
  data: AggregatedContribution[],
  adminId: string,
  adminName: string
): Promise<void> => {
  const batch = writeBatch(db);
  const contributionsRef = collection(db, 'contributions');

  data.forEach(item => {
    const [year, month] = item.monthYear.split('-').map(Number);
    const contributionDate = new Date(year, month - 1, 1);
    
    const newDocRef = doc(contributionsRef);
    batch.set(newDocRef, {
      member_id: item.memberId,
      amount: item.amount,
      date: Timestamp.fromDate(contributionDate),
      type: item.type,
      status: 'approved' as ContributionStatus,
      review_notes: `Bulk Migration Import. ${item.originalReferences.length > 0 ? 'References: ' + item.originalReferences.join(', ') : ''}`,
      reviewed_by: adminId,
      reviewed_at: Timestamp.now(),
      created_at: Timestamp.now(),
      updated_at: Timestamp.now()
    });
  });

  await batch.commit();

  try {
    const { logAuditTrail } = await import('../auditService');
    await logAuditTrail(
      adminId,
      'BULK_CONTRIBUTION_IMPORT',
      {
        total_records_processed: data.length,
        total_amount: data.reduce((sum, i) => sum + i.amount, 0),
        import_type: 'migration'
      },
      adminName
    );
  } catch (err) {
    logger.error('Failed to log bulk import audit trail:', err);
  }
};
