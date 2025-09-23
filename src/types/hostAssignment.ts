import { Timestamp } from "firebase/firestore";

export interface HostAssignment {
  id: string;
  member_id: string;
  member_name: string;
  assigned_month: Timestamp; // Second Sunday of the month
  year: number;
  month: number; // 1-12
  status: "pending" | "confirmed" | "completed" | "missed";
  created_at: Timestamp;
  created_by: string; // admin ID
  updated_at?: Timestamp;
  updated_by?: string;
  notes?: string;
}

export interface HostSchedule {
  id: string;
  year: number;
  assignments: HostAssignment[];
  generated_at: Timestamp;
  generated_by: string; // admin ID
  last_modified: Timestamp;
  is_finalized: boolean;
}

export interface HostAssignmentFilters {
  year?: number;
  status?: string[];
  member_id?: string;
}

export interface GenerateHostScheduleParams {
  year: number;
  excludeAdmins?: boolean;
  excludeMemberIds?: string[];
}