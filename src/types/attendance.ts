import { Timestamp } from "firebase/firestore";

/**
 * Represents an attendance session created by an admin for a meeting
 * The QR code data is used to generate the QR code for members to scan
 */
export interface AttendanceSession {
  id: string;
  event_id?: string;          // Optional link to calendar event
  meeting_title: string;
  meeting_date: Timestamp;
  venue?: string;
  qr_code_data: string;       // Unique token for the QR code
  created_by: string;         // Admin who created the session
  created_at: Timestamp;
  expires_at: Timestamp;
  is_active: boolean;
  max_attendees?: number;     // Optional capacity limit
}

/**
 * Input type for creating a new attendance session (excludes auto-generated fields)
 */
export type AttendanceSessionInput = Omit<AttendanceSession, "id" | "created_at" | "qr_code_data">;

/**
 * Represents an individual attendance record when a member checks in
 */
export interface AttendanceRecord {
  id: string;
  session_id: string;
  member_id: string;
  member_name: string;
  checked_in_at: Timestamp;
  check_in_method: "qr_scan" | "manual";
}

/**
 * Input type for creating an attendance record
 */
export type AttendanceRecordInput = Omit<AttendanceRecord, "id">;

/**
 * Summary statistics for an attendance session
 */
export interface AttendanceSessionSummary extends AttendanceSession {
  attendee_count: number;
}

/**
 * Filters for querying attendance sessions
 */
export interface AttendanceSessionFilters {
  from_date?: Date;
  to_date?: Date;
  is_active?: boolean;
  event_id?: string;
}

/**
 * Result of a QR code validation
 */
export interface QRValidationResult {
  valid: boolean;
  session?: AttendanceSession;
  error?: string;
}
