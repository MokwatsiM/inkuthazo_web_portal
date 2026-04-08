import {
  Permission,
  ResourceType,
  RolePermissions,
  ResourcePermissions,
} from "../types/role";

/**
 * Default full permissions for a resource
 */
export const FULL_PERMISSIONS: ResourcePermissions = {
  view: true,
  create: true,
  edit: true,
  delete: true,
  approve: true,
  export: true,
};

/**
 * View-only permissions for a resource
 */
export const VIEW_ONLY_PERMISSIONS: ResourcePermissions = {
  view: true,
  create: false,
  edit: false,
  delete: false,
  approve: false,
  export: false,
};

/**
 * Read and create permissions (no delete)
 */
export const READ_CREATE_PERMISSIONS: ResourcePermissions = {
  view: true,
  create: true,
  edit: true,
  delete: false,
  approve: false,
  export: true,
};

/**
 * Complete catalog of all permissions in the system
 */
export const PERMISSIONS_CATALOG: Permission[] = [
  // Dashboard
  { id: "home.view", resource: "home", action: "view", category: "Dashboard", description: "View dashboard home page" },

  // Member Management
  { id: "members.view", resource: "members", action: "view", category: "Member Management", description: "View member list" },
  { id: "members.create", resource: "members", action: "create", category: "Member Management", description: "Add new members" },
  { id: "members.edit", resource: "members", action: "edit", category: "Member Management", description: "Edit member details" },
  { id: "members.delete", resource: "members", action: "delete", category: "Member Management", description: "Delete members" },
  { id: "members.export", resource: "members", action: "export", category: "Member Management", description: "Export member data" },

  // Financial - Payouts
  { id: "payouts.view", resource: "payouts", action: "view", category: "Financial", description: "View payout records" },
  { id: "payouts.create", resource: "payouts", action: "create", category: "Financial", description: "Create new payouts" },
  { id: "payouts.edit", resource: "payouts", action: "edit", category: "Financial", description: "Edit payout details" },
  { id: "payouts.delete", resource: "payouts", action: "delete", category: "Financial", description: "Delete payouts" },
  { id: "payouts.approve", resource: "payouts", action: "approve", category: "Financial", description: "Approve payout requests" },
  { id: "payouts.export", resource: "payouts", action: "export", category: "Financial", description: "Export payout data" },

  // Financial - Claims
  { id: "claims.view", resource: "claims", action: "view", category: "Financial", description: "View claim records" },
  { id: "claims.create", resource: "claims", action: "create", category: "Financial", description: "Submit new claims" },
  { id: "claims.edit", resource: "claims", action: "edit", category: "Financial", description: "Edit claim details" },
  { id: "claims.delete", resource: "claims", action: "delete", category: "Financial", description: "Delete claims" },
  { id: "claims.approve", resource: "claims", action: "approve", category: "Financial", description: "Approve/reject claims" },

  // Financial - Expenses
  { id: "expenses.view", resource: "expenses", action: "view", category: "Financial", description: "View expense records" },
  { id: "expenses.create", resource: "expenses", action: "create", category: "Financial", description: "Create new expenses" },
  { id: "expenses.edit", resource: "expenses", action: "edit", category: "Financial", description: "Edit expense details" },
  { id: "expenses.delete", resource: "expenses", action: "delete", category: "Financial", description: "Delete expenses" },
  { id: "expenses.approve", resource: "expenses", action: "approve", category: "Financial", description: "Approve expenses", requiresApproval: true },
  { id: "expenses.export", resource: "expenses", action: "export", category: "Financial", description: "Export expense data" },

  // Financial - Donations
  { id: "donations.view", resource: "donations", action: "view", category: "Financial", description: "View donation records" },
  { id: "donations.create", resource: "donations", action: "create", category: "Financial", description: "Record new donations" },
  { id: "donations.edit", resource: "donations", action: "edit", category: "Financial", description: "Edit donation details" },
  { id: "donations.delete", resource: "donations", action: "delete", category: "Financial", description: "Delete donations" },
  { id: "donations.export", resource: "donations", action: "export", category: "Financial", description: "Export donation data" },

  // Financial - Credits
  { id: "credits.view", resource: "credits", action: "view", category: "Financial", description: "View credit applications" },
  { id: "credits.create", resource: "credits", action: "create", category: "Financial", description: "Apply for credit" },
  { id: "credits.edit", resource: "credits", action: "edit", category: "Financial", description: "Edit credit applications" },
  { id: "credits.delete", resource: "credits", action: "delete", category: "Financial", description: "Delete credit applications" },

  // Financial - Contributions
  { id: "contributions.view", resource: "contributions", action: "view", category: "Financial", description: "View all member contributions" },
  { id: "contributions.create", resource: "contributions", action: "create", category: "Financial", description: "Create contributions for members" },
  { id: "contributions.edit", resource: "contributions", action: "edit", category: "Financial", description: "Edit contribution records" },
  { id: "contributions.delete", resource: "contributions", action: "delete", category: "Financial", description: "Delete contributions" },
  { id: "contributions.export", resource: "contributions", action: "export", category: "Financial", description: "Export contribution data" },

  // Financial - Credit Reviews
  { id: "credit_reviews.view", resource: "credit_reviews", action: "view", category: "Financial", description: "View credit review queue" },
  { id: "credit_reviews.approve", resource: "credit_reviews", action: "approve", category: "Financial", description: "Approve/reject credit applications", requiresApproval: true },

  // Disciplinary
  { id: "disciplinary.view", resource: "disciplinary", action: "view", category: "Member Management", description: "View disciplinary records" },
  { id: "disciplinary.create", resource: "disciplinary", action: "create", category: "Member Management", description: "Create disciplinary records" },
  { id: "disciplinary.edit", resource: "disciplinary", action: "edit", category: "Member Management", description: "Edit disciplinary records" },
  { id: "disciplinary.delete", resource: "disciplinary", action: "delete", category: "Member Management", description: "Delete disciplinary records" },
  { id: "disciplinary.approve", resource: "disciplinary", action: "approve", category: "Member Management", description: "Resolve disciplinary cases" },

  // Calendar & Events
  { id: "calendar.view", resource: "calendar", action: "view", category: "Dashboard", description: "View event calendar" },
  { id: "calendar.create", resource: "calendar", action: "create", category: "Dashboard", description: "Create events" },
  { id: "calendar.edit", resource: "calendar", action: "edit", category: "Dashboard", description: "Edit events" },
  { id: "calendar.delete", resource: "calendar", action: "delete", category: "Dashboard", description: "Delete events" },

  // Host Assignments
  { id: "host_assignments.view", resource: "host_assignments", action: "view", category: "Dashboard", description: "View host assignments" },
  { id: "host_assignments.create", resource: "host_assignments", action: "create", category: "Dashboard", description: "Create host assignments" },
  { id: "host_assignments.edit", resource: "host_assignments", action: "edit", category: "Dashboard", description: "Edit host assignments" },
  { id: "host_assignments.delete", resource: "host_assignments", action: "delete", category: "Dashboard", description: "Delete host assignments" },

  // Reports & Analytics
  { id: "analytics.view", resource: "analytics", action: "view", category: "Reports & Analytics", description: "View basic analytics" },
  { id: "advanced_analytics.view", resource: "advanced_analytics", action: "view", category: "Reports & Analytics", description: "View advanced analytics" },
  { id: "reports.view", resource: "reports", action: "view", category: "Reports & Analytics", description: "View reports" },
  { id: "reports.export", resource: "reports", action: "export", category: "Reports & Analytics", description: "Export reports" },

  // System Management (Admin only)
  { id: "deletion_requests.view", resource: "deletion_requests", action: "view", category: "System Management", description: "View deletion requests" },
  { id: "deletion_requests.approve", resource: "deletion_requests", action: "approve", category: "System Management", description: "Approve/deny deletion requests" },
  { id: "configuration.view", resource: "configuration", action: "view", category: "System Management", description: "View system configuration" },
  { id: "configuration.edit", resource: "configuration", action: "edit", category: "System Management", description: "Edit system configuration" },
  { id: "audit_logs.view", resource: "audit_logs", action: "view", category: "System Management", description: "View audit logs" },
  { id: "audit_logs.export", resource: "audit_logs", action: "export", category: "System Management", description: "Export audit logs" },
  { id: "role_management.view", resource: "role_management", action: "view", category: "System Management", description: "View role management" },
  { id: "role_management.create", resource: "role_management", action: "create", category: "System Management", description: "Create new roles" },
  { id: "role_management.edit", resource: "role_management", action: "edit", category: "System Management", description: "Edit roles" },
  { id: "role_management.delete", resource: "role_management", action: "delete", category: "System Management", description: "Delete roles" },

  // Personal Pages (user's own data)
  { id: "my_contributions.view", resource: "my_contributions", action: "view", category: "Personal", description: "View my contributions" },
  { id: "my_donations.view", resource: "my_donations", action: "view", category: "Personal", description: "View my donations" },
  { id: "my_credit.view", resource: "my_credit", action: "view", category: "Personal", description: "View my credit status" },
  { id: "my_hosting_schedule.view", resource: "my_hosting_schedule", action: "view", category: "Personal", description: "View my hosting schedule" },
];

/**
 * Default permissions for system roles
 * These will be used to create the initial role documents in Firestore
 */

// Admin - Full access to everything
export const ADMIN_PERMISSIONS: RolePermissions = {
  home: FULL_PERMISSIONS,
  members: FULL_PERMISSIONS,
  payouts: FULL_PERMISSIONS,
  claims: FULL_PERMISSIONS,
  expenses: FULL_PERMISSIONS,
  donations: FULL_PERMISSIONS,
  credits: FULL_PERMISSIONS,
  credit_reviews: FULL_PERMISSIONS,
  contributions: FULL_PERMISSIONS,
  disciplinary: FULL_PERMISSIONS,
  calendar: FULL_PERMISSIONS,
  host_assignments: FULL_PERMISSIONS,
  analytics: FULL_PERMISSIONS,
  advanced_analytics: FULL_PERMISSIONS,
  reports: FULL_PERMISSIONS,
  deletion_requests: FULL_PERMISSIONS,
  configuration: FULL_PERMISSIONS,
  audit_logs: FULL_PERMISSIONS,
  role_management: FULL_PERMISSIONS,
  my_contributions: FULL_PERMISSIONS,
  my_donations: FULL_PERMISSIONS,
  my_credit: FULL_PERMISSIONS,
  my_hosting_schedule: FULL_PERMISSIONS,
};

// Member - Basic access to personal and viewing features
export const MEMBER_PERMISSIONS: RolePermissions = {
  home: VIEW_ONLY_PERMISSIONS,
  my_contributions: FULL_PERMISSIONS,
  my_donations: FULL_PERMISSIONS,
  my_credit: { view: true, create: true, edit: false, delete: false },
  calendar: VIEW_ONLY_PERMISSIONS,
  my_hosting_schedule: VIEW_ONLY_PERMISSIONS,
  disciplinary: VIEW_ONLY_PERMISSIONS,
};

// DC Member - Member + disciplinary management
export const DC_MEMBER_PERMISSIONS: RolePermissions = {
  ...MEMBER_PERMISSIONS,
  disciplinary: {
    view: true,
    create: true,
    edit: true,
    delete: false,
    approve: true, // Can resolve cases
  },
};

// Chairperson - Member + credit review capabilities
export const CHAIRPERSON_PERMISSIONS: RolePermissions = {
  ...MEMBER_PERMISSIONS,
  credit_reviews: {
    view: true,
    create: false,
    edit: false,
    delete: false,
    approve: true, // Can approve/reject credits
  },
  credits: {
    view: true,
    create: false,
    edit: false,
    delete: false,
  },
};

/**
 * Helper function to get permission categories
 */
export const getPermissionCategories = (): string[] => {
  return Array.from(new Set(PERMISSIONS_CATALOG.map((p) => p.category)));
};

/**
 * Helper function to get permissions by category
 */
export const getPermissionsByCategory = (category: string): Permission[] => {
  return PERMISSIONS_CATALOG.filter((p) => p.category === category);
};

/**
 * Helper function to get permissions by resource
 */
export const getPermissionsByResource = (resource: ResourceType): Permission[] => {
  return PERMISSIONS_CATALOG.filter((p) => p.resource === resource);
};

/**
 * Helper to check if a resource requires approval actions
 */
export const requiresApproval = (resource: ResourceType): boolean => {
  return PERMISSIONS_CATALOG.some(
    (p) => p.resource === resource && p.requiresApproval === true
  );
};
