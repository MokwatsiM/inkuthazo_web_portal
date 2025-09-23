export type QuestionType =
  | 'text'
  | 'number'
  | 'multiple_choice'
  | 'single_select'
  | 'yes_no'
  | 'rating'
  | 'textarea';

export interface QuestionOption {
  id: string;
  label: string;
  value: string;
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  required: boolean;
  options?: QuestionOption[]; // For multiple_choice, single_select
  maxRating?: number; // For rating type
  placeholder?: string; // For text/textarea inputs
}

export interface Questionnaire {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
}

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  date: string; // ISO date string
  startTime: string; // HH:MM format
  endTime?: string; // HH:MM format
  duration?: number; // minutes
  location?: string;
  questionnaire: Questionnaire;
  qrCode?: string; // Base64 encoded QR code
  qrToken?: string; // Unique token for QR validation
  isActive: boolean;
  createdBy: string; // Admin user ID
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

export interface AttendanceResponse {
  questionId: string;
  answer: string | string[] | number;
}

export interface Attendance {
  id: string;
  meetingId: string;
  memberId: string;
  memberName: string;
  responses: AttendanceResponse[];
  submittedAt: string; // ISO timestamp
  ipAddress?: string;
  userAgent?: string;
}

export interface AttendanceRecord {
  memberId: string;
  memberName: string;
  meetingId: string;
  meetingDate: string;
  responses: Record<string, any>;
  submissionTimestamp: string;
}

// Form validation types
export interface FormError {
  questionId: string;
  message: string;
}

export interface AttendanceFormData {
  responses: Record<string, any>;
}

// API response types
export interface MeetingListResponse {
  meetings: Meeting[];
  total: number;
}

export interface AttendanceListResponse {
  attendances: Attendance[];
  total: number;
}

export interface QRValidationResponse {
  valid: boolean;
  meeting?: Meeting;
  alreadyAttended?: boolean;
  error?: string;
}