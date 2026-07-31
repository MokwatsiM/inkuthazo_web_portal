import { Timestamp } from "firebase/firestore";

/**
 * Action types that can be performed on resources
 */
export type PermissionAction = "view" | "create" | "edit" | "delete" | "approve" | "export";

/**
 * Resource permissions object
 * Defines what actions are allowed for a specific resource
 */
export interface ResourcePermissions {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  approve?: boolean; // Optional: for resources that need approval (credits, expenses)
  export?: boolean;  // Optional: for resources that can be exported
}

/**
 * All resources/menu items in the system
 */
export type ResourceType =
  | "home"
  | "members"
  | "payouts"
  | "claims"
  | "expenses"
  | "donations"
  | "assets"
  | "credits"
  | "credit_reviews"
  | "contributions"
  | "disciplinary"
  | "calendar"
  | "host_assignments"
  | "analytics"
  | "advanced_analytics"
  | "reports"
  | "deletion_requests"
  | "configuration"
  | "audit_logs"
  | "role_management"
  | "my_contributions"
  | "my_donations"
  | "my_credit"
  | "my_hosting_schedule";

/**
 * Permission catalog entry
 * Defines a single permission in the system
 */
export interface Permission {
  id: string; // e.g., "expenses.create"
  resource: ResourceType;
  action: PermissionAction;
  category: PermissionCategory;
  description: string;
  requiresApproval?: boolean;
}

/**
 * Categories for organizing permissions
 */
export type PermissionCategory =
  | "Dashboard"
  | "Financial"
  | "Member Management"
  | "Reports & Analytics"
  | "System Management"
  | "Personal";

/**
 * Role permissions map
 * Maps each resource to its allowed actions
 */
export type RolePermissions = {
  [K in ResourceType]?: Partial<ResourcePermissions>;
};

/**
 * Role document structure in Firestore
 */
export interface Role {
  id: string;
  name: string;
  description: string;
  isSystemRole: boolean; // true for admin, member, dc_member, chairperson
  permissions: RolePermissions;
  createdAt: Timestamp;
  createdBy: string;
  updatedAt?: Timestamp;
  updatedBy?: string;
}

/**
 * Role creation/update DTO
 */
export interface CreateRoleDTO {
  name: string;
  description: string;
  permissions: RolePermissions;
}

export interface UpdateRoleDTO extends Partial<CreateRoleDTO> {
  updatedBy: string;
}

/**
 * Role with member count (for UI display)
 */
export interface RoleWithStats extends Role {
  memberCount: number;
}

/**
 * Permission check result
 */
export interface PermissionCheck {
  allowed: boolean;
  reason?: string; // Optional reason if denied
}

/**
 * Menu item configuration
 */
export interface MenuItem {
  name: string;
  icon: any; // React component
  path: string;
  color: string;
  resource: ResourceType;
  requiredAction: PermissionAction;
}

/**
 * System roles enum (protected roles)
 */
export enum SystemRole {
  ADMIN = "admin",
  MEMBER = "member",
  DC_MEMBER = "dc_member",
  CHAIRPERSON = "chairperson",
}

/**
 * Role assignment history (for audit trail)
 */
export interface RoleAssignment {
  id: string;
  memberId: string;
  oldRole: string;
  newRole: string;
  changedBy: string;
  changedAt: Timestamp;
  reason?: string;
}
