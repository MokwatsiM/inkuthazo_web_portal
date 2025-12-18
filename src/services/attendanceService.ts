import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  limit,
} from "firebase/firestore";
import { db } from "../config/firebase";
import type {
  AttendanceSession,
  AttendanceSessionInput,
  AttendanceRecord,
  AttendanceRecordInput,
  AttendanceSessionSummary,
  AttendanceSessionFilters,
  QRValidationResult,
} from "../types";

const SESSIONS_COLLECTION = "attendance_sessions";
const RECORDS_COLLECTION = "attendance_records";

/**
 * Generate a unique QR code token
 */
const generateQRToken = (): string => {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  return `inkuthazo-${timestamp}-${randomPart}`;
};

/**
 * Create a new attendance session
 */
export const createAttendanceSession = async (
  input: Omit<AttendanceSessionInput, "qr_code_data">
): Promise<AttendanceSession> => {
  const qr_code_data = generateQRToken();
  
  // Build session data, filtering out undefined values (Firestore doesn't accept undefined)
  const sessionData: Record<string, unknown> = {
    meeting_title: input.meeting_title,
    meeting_date: input.meeting_date,
    qr_code_data,
    created_by: input.created_by,
    created_at: Timestamp.now(),
    expires_at: input.expires_at,
    is_active: input.is_active,
  };
  
  // Only add optional fields if they have values
  if (input.event_id) {
    sessionData.event_id = input.event_id;
  }
  if (input.venue) {
    sessionData.venue = input.venue;
  }
  if (input.max_attendees !== undefined && input.max_attendees !== null) {
    sessionData.max_attendees = input.max_attendees;
  }

  const docRef = await addDoc(collection(db, SESSIONS_COLLECTION), sessionData);
  
  return {
    id: docRef.id,
    ...sessionData,
  } as AttendanceSession;
};

/**
 * Get an attendance session by ID
 */
export const getAttendanceSession = async (
  sessionId: string
): Promise<AttendanceSession | null> => {
  const docRef = doc(db, SESSIONS_COLLECTION, sessionId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    return null;
  }
  
  return {
    id: docSnap.id,
    ...docSnap.data(),
  } as AttendanceSession;
};

/**
 * Get session by QR code data (token)
 */
export const getSessionByQRCode = async (
  qrCodeData: string
): Promise<AttendanceSession | null> => {
  const q = query(
    collection(db, SESSIONS_COLLECTION),
    where("qr_code_data", "==", qrCodeData),
    limit(1)
  );
  
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    return null;
  }
  
  const doc = querySnapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
  } as AttendanceSession;
};

/**
 * Validate a QR code and check if attendance can be recorded
 */
export const validateQRCode = async (
  qrCodeData: string,
  memberId: string
): Promise<QRValidationResult> => {
  try {
    const session = await getSessionByQRCode(qrCodeData);
    
    if (!session) {
      return { valid: false, error: "Invalid QR code. Session not found." };
    }
    
    if (!session.is_active) {
      return { valid: false, error: "This attendance session has been closed." };
    }
    
    const now = Timestamp.now();
    if (session.expires_at.toMillis() < now.toMillis()) {
      return { valid: false, error: "This QR code has expired." };
    }
    
    // Check if member already checked in
    const existingRecord = await getMemberAttendanceForSession(session.id, memberId);
    if (existingRecord) {
      return { valid: false, error: "You have already checked in to this meeting." };
    }
    
    // Note: Capacity check is skipped here because members can only read their own
    // attendance records (not all records for a session). Admin will see the count
    // in their dashboard. If max_attendees is critical, consider using Cloud Functions.
    
    return { valid: true, session };
  } catch (error) {
    console.error("Error validating QR code:", error);
    return { valid: false, error: "An error occurred while validating the QR code." };
  }
};

/**
 * Record member attendance
 * Automatically calculates is_late if member checked in >15 minutes after meeting start
 */
export const recordAttendance = async (
  input: AttendanceRecordInput
): Promise<AttendanceRecord> => {
  // Get the session to check meeting start time
  const session = await getAttendanceSession(input.session_id);

  if (!session) {
    throw new Error("Session not found");
  }

  // Calculate if member is late (>15 minutes after meeting start)
  const meetingStartTime = session.meeting_date.toMillis();
  const checkInTime = input.checked_in_at.toMillis();
  const fifteenMinutesInMs = 15 * 60 * 1000;
  const isLate = checkInTime > (meetingStartTime + fifteenMinutesInMs);

  // Add is_late and status to the input
  const recordData = {
    ...input,
    is_late: isLate,
    status: "present" as const,
  };

  const docRef = await addDoc(collection(db, RECORDS_COLLECTION), recordData);

  return {
    id: docRef.id,
    ...recordData,
  } as AttendanceRecord;
};

/**
 * Get a member's attendance record for a specific session
 */
export const getMemberAttendanceForSession = async (
  sessionId: string,
  memberId: string
): Promise<AttendanceRecord | null> => {
  const q = query(
    collection(db, RECORDS_COLLECTION),
    where("session_id", "==", sessionId),
    where("member_id", "==", memberId),
    limit(1)
  );
  
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    return null;
  }
  
  const doc = querySnapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
  } as AttendanceRecord;
};

/**
 * Get all attendees for a session
 */
export const getSessionAttendees = async (
  sessionId: string
): Promise<AttendanceRecord[]> => {
  const q = query(
    collection(db, RECORDS_COLLECTION),
    where("session_id", "==", sessionId),
    orderBy("checked_in_at", "asc")
  );
  
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as AttendanceRecord[];
};

/**
 * Get member's attendance history
 */
export const getMemberAttendanceHistory = async (
  memberId: string
): Promise<AttendanceRecord[]> => {
  const q = query(
    collection(db, RECORDS_COLLECTION),
    where("member_id", "==", memberId),
    orderBy("checked_in_at", "desc")
  );
  
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as AttendanceRecord[];
};

/**
 * Get all attendance sessions with filters
 */
export const getAttendanceSessions = async (
  filters?: AttendanceSessionFilters
): Promise<AttendanceSession[]> => {
  let q = query(
    collection(db, SESSIONS_COLLECTION),
    orderBy("meeting_date", "desc")
  );
  
  // Note: Firestore doesn't allow multiple inequality filters on different fields
  // So we filter by is_active in the query and do date filtering client-side
  if (filters?.is_active !== undefined) {
    q = query(
      collection(db, SESSIONS_COLLECTION),
      where("is_active", "==", filters.is_active),
      orderBy("meeting_date", "desc")
    );
  }
  
  const querySnapshot = await getDocs(q);
  
  let sessions = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as AttendanceSession[];
  
  // Client-side date filtering
  if (filters?.from_date) {
    const fromTimestamp = Timestamp.fromDate(filters.from_date);
    sessions = sessions.filter(s => s.meeting_date.toMillis() >= fromTimestamp.toMillis());
  }
  
  if (filters?.to_date) {
    const toTimestamp = Timestamp.fromDate(filters.to_date);
    sessions = sessions.filter(s => s.meeting_date.toMillis() <= toTimestamp.toMillis());
  }
  
  if (filters?.event_id) {
    sessions = sessions.filter(s => s.event_id === filters.event_id);
  }
  
  return sessions;
};

/**
 * Get attendance sessions with attendee counts
 */
export const getAttendanceSessionsWithCounts = async (
  filters?: AttendanceSessionFilters
): Promise<AttendanceSessionSummary[]> => {
  const sessions = await getAttendanceSessions(filters);
  
  const summaries: AttendanceSessionSummary[] = await Promise.all(
    sessions.map(async (session) => {
      const attendees = await getSessionAttendees(session.id);
      return {
        ...session,
        attendee_count: attendees.length,
      };
    })
  );
  
  return summaries;
};

/**
 * Close an attendance session
 */
export const closeAttendanceSession = async (
  sessionId: string
): Promise<void> => {
  const docRef = doc(db, SESSIONS_COLLECTION, sessionId);
  await updateDoc(docRef, {
    is_active: false,
  });
};

/**
 * Get active sessions (not expired and still active)
 */
export const getActiveSessions = async (): Promise<AttendanceSession[]> => {
  const now = Timestamp.now();
  
  const q = query(
    collection(db, SESSIONS_COLLECTION),
    where("is_active", "==", true),
    orderBy("meeting_date", "desc")
  );
  
  const querySnapshot = await getDocs(q);
  
  const sessions = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as AttendanceSession[];
  
  // Filter out expired sessions client-side
  return sessions.filter(s => s.expires_at.toMillis() > now.toMillis());
};

/**
 * Mark absent members for a session
 * Gets all active members and creates absence records for those who didn't check in
 */
export const markAbsentMembers = async (
  sessionId: string
): Promise<AttendanceRecord[]> => {
  // Get all members
  const membersSnapshot = await getDocs(collection(db, "members"));
  const allMembers = membersSnapshot.docs
    .map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    .filter((m: any) => m.status === "active" || m.status === "approved");

  // Get existing attendance records for this session
  const attendees = await getSessionAttendees(sessionId);
  const attendedMemberIds = new Set(attendees.map(a => a.member_id));

  // Find members who didn't attend
  const absentMembers = allMembers.filter((m: any) => !attendedMemberIds.has(m.id));

  // Get session to use its meeting date
  const session = await getAttendanceSession(sessionId);
  if (!session) {
    throw new Error("Session not found");
  }

  // Create absence records
  const absenceRecords: AttendanceRecord[] = [];

  for (const member of absentMembers) {
    const recordData = {
      session_id: sessionId,
      member_id: member.id,
      member_name: (member as any).full_name || "Unknown",
      checked_in_at: session.meeting_date, // Use meeting date as timestamp
      check_in_method: "absent" as const,
      is_late: false,
      status: "absent" as const,
    };

    const docRef = await addDoc(collection(db, RECORDS_COLLECTION), recordData);
    absenceRecords.push({
      id: docRef.id,
      ...recordData,
    } as AttendanceRecord);
  }

  return absenceRecords;
};

/**
 * Update absence reason for a member
 */
export const updateAbsenceReason = async (
  recordId: string,
  reason: "apology" | "no_apology"
): Promise<void> => {
  const docRef = doc(db, RECORDS_COLLECTION, recordId);
  await updateDoc(docRef, {
    absence_reason: reason,
  });
};
