import { Timestamp } from "firebase/firestore";
import type { Contribution } from "./contribution";
import type { Payout } from "./payout";
export type { ReportType, ReportPeriod, ReportData } from "./report";

export type UserRole = "admin" | "member" | "dc_member";
export type MemberStatus = "pending" | "approved" | "active" | "inactive";

export interface Dependant {
  id: string;
  full_name: string;
  date_of_birth: Timestamp;
  relationship: "spouse" | "child" | "parent" | "sibling" | "other";
  relationship_description?: string;
  id_number: string;
  id_document_url?: string;
}

export interface Member {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  join_date: Timestamp;
  status: MemberStatus;
  role: UserRole;
  avatar_url?: string;
  dependants?: Dependant[];
}

export interface MemberDetail extends Member {
  contributions: Contribution[];
  payouts: Payout[];
  disciplinaryRecords?: DisciplinaryRecord[];
}

export interface DisciplinaryRecord {
  id: string;
  member_id: string;
  infringement_type: string;
  description: string;
  date: Timestamp;
  penalty_amount?: number;
  status: "pending" | "resolved";
  created_by: string;
  created_at: Timestamp;
  resolved_at?: Timestamp;
  resolved_by?: string;
  resolution_notes?: string;
}

export type { Contribution } from "./contribution";
export type { Payout } from "./payout";
export type { HostAssignment, HostSchedule, HostAssignmentFilters, GenerateHostScheduleParams } from "./hostAssignment";
