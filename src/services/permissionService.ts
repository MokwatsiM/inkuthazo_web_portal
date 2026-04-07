import {
  Role,
  ResourceType,
  PermissionAction,
  RolePermissions,
  PermissionCheck,
} from "../types/role";
import logger from "../utils/logger";
import { getRoleById, getRoleByName } from "./roleService";

/**
 * Check if a role has permission for a specific resource and action
 */
export const hasPermission = (
  role: Role | null,
  resource: ResourceType,
  action: PermissionAction
): PermissionCheck => {
  if (!role) {
    return {
      allowed: false,
      reason: "No role assigned",
    };
  }

  const resourcePermissions = role.permissions[resource];

  if (!resourcePermissions) {
    return {
      allowed: false,
      reason: `No permissions defined for resource: ${resource}`,
    };
  }

  const hasAccess = resourcePermissions[action] === true;

  return {
    allowed: hasAccess,
    reason: hasAccess ? undefined : `Action '${action}' not allowed for resource '${resource}'`,
  };
};

/**
 * Check if a role has ANY permission for a resource (view, create, edit, or delete)
 */
export const hasAnyPermission = (
  role: Role | null,
  resource: ResourceType
): boolean => {
  if (!role) return false;

  const resourcePermissions = role.permissions[resource];
  if (!resourcePermissions) return false;

  // Check if at least one action is allowed
  return Object.values(resourcePermissions).some((value) => value === true);
};

/**
 * Check if a role has view permission for a resource
 */
export const canView = (role: Role | null, resource: ResourceType): boolean => {
  return hasPermission(role, resource, "view").allowed;
};

/**
 * Check if a role has create permission for a resource
 */
export const canCreate = (role: Role | null, resource: ResourceType): boolean => {
  return hasPermission(role, resource, "create").allowed;
};

/**
 * Check if a role has edit permission for a resource
 */
export const canEdit = (role: Role | null, resource: ResourceType): boolean => {
  return hasPermission(role, resource, "edit").allowed;
};

/**
 * Check if a role has delete permission for a resource
 */
export const canDelete = (role: Role | null, resource: ResourceType): boolean => {
  return hasPermission(role, resource, "delete").allowed;
};

/**
 * Check if a role has approve permission for a resource
 */
export const canApprove = (role: Role | null, resource: ResourceType): boolean => {
  return hasPermission(role, resource, "approve").allowed;
};

/**
 * Check if a role has export permission for a resource
 */
export const canExport = (role: Role | null, resource: ResourceType): boolean => {
  return hasPermission(role, resource, "export").allowed;
};

/**
 * Get all resources a role has view access to
 */
export const getAccessibleResources = (role: Role | null): ResourceType[] => {
  if (!role) return [];

  return Object.entries(role.permissions)
    .filter(([_, permissions]) => permissions.view === true)
    .map(([resource]) => resource as ResourceType);
};

/**
 * Get all actions allowed for a specific resource
 */
export const getAllowedActions = (
  role: Role | null,
  resource: ResourceType
): PermissionAction[] => {
  if (!role) return [];

  const resourcePermissions = role.permissions[resource];
  if (!resourcePermissions) return [];

  const allowedActions: PermissionAction[] = [];

  if (resourcePermissions.view) allowedActions.push("view");
  if (resourcePermissions.create) allowedActions.push("create");
  if (resourcePermissions.edit) allowedActions.push("edit");
  if (resourcePermissions.delete) allowedActions.push("delete");
  if (resourcePermissions.approve) allowedActions.push("approve");
  if (resourcePermissions.export) allowedActions.push("export");

  return allowedActions;
};

/**
 * Check if user has multiple permissions (AND logic)
 */
export const hasAllPermissions = (
  role: Role | null,
  checks: Array<{ resource: ResourceType; action: PermissionAction }>
): boolean => {
  if (!role) return false;

  return checks.every((check) =>
    hasPermission(role, check.resource, check.action).allowed
  );
};

/**
 * Check if user has at least one of multiple permissions (OR logic)
 */
export const hasAnyOfPermissions = (
  role: Role | null,
  checks: Array<{ resource: ResourceType; action: PermissionAction }>
): boolean => {
  if (!role) return false;

  return checks.some((check) =>
    hasPermission(role, check.resource, check.action).allowed
  );
};

/**
 * Get role by name or ID and check permission
 */
export const checkPermissionByRoleIdentifier = async (
  roleIdentifier: string,
  resource: ResourceType,
  action: PermissionAction
): Promise<PermissionCheck> => {
  try {
    // Try to get role by ID first
    let role = await getRoleById(roleIdentifier);

    // If not found, try by name
    if (!role) {
      role = await getRoleByName(roleIdentifier);
    }

    return hasPermission(role, resource, action);
  } catch (error) {
    logger.error("Error checking permission:", error);
    return {
      allowed: false,
      reason: "Error fetching role",
    };
  }
};

/**
 * Merge permissions from multiple roles (useful if you implement multi-role support later)
 */
export const mergeRolePermissions = (roles: Role[]): RolePermissions => {
  const merged: RolePermissions = {};

  roles.forEach((role) => {
    Object.entries(role.permissions).forEach(([resource, permissions]) => {
      if (!merged[resource as ResourceType]) {
        merged[resource as ResourceType] = {};
      }

      // For each action, use OR logic (if any role allows it, it's allowed)
      Object.entries(permissions).forEach(([action, allowed]) => {
        const currentValue = merged[resource as ResourceType]![action as PermissionAction];
        merged[resource as ResourceType]![action as PermissionAction] =
          currentValue || allowed;
      });
    });
  });

  return merged;
};

/**
 * Compare two permission sets and return the differences
 */
export const comparePermissions = (
  oldPermissions: RolePermissions,
  newPermissions: RolePermissions
): {
  added: string[];
  removed: string[];
  unchanged: string[];
} => {
  const added: string[] = [];
  const removed: string[] = [];
  const unchanged: string[] = [];

  // Check all resources in new permissions
  Object.entries(newPermissions).forEach(([resource, newPerms]) => {
    const oldPerms = oldPermissions[resource as ResourceType];

    Object.entries(newPerms).forEach(([action, newValue]) => {
      const oldValue = oldPerms?.[action as PermissionAction];
      const permKey = `${resource}.${action}`;

      if (oldValue === newValue) {
        if (newValue) unchanged.push(permKey);
      } else if (newValue && !oldValue) {
        added.push(permKey);
      } else if (!newValue && oldValue) {
        removed.push(permKey);
      }
    });
  });

  // Check for removed resources
  Object.entries(oldPermissions).forEach(([resource, oldPerms]) => {
    if (!newPermissions[resource as ResourceType]) {
      Object.entries(oldPerms).forEach(([action, value]) => {
        if (value) {
          removed.push(`${resource}.${action}`);
        }
      });
    }
  });

  return { added, removed, unchanged };
};

/**
 * Validate permission structure
 */
export const validatePermissions = (permissions: RolePermissions): boolean => {
  // Ensure all permission values are booleans
  for (const resource in permissions) {
    const resourcePerms = permissions[resource as ResourceType];
    if (!resourcePerms) continue;

    for (const action in resourcePerms) {
      const value = resourcePerms[action as PermissionAction];
      if (typeof value !== "boolean") {
        throw new Error(
          `Invalid permission value for ${resource}.${action}: expected boolean, got ${typeof value}`
        );
      }
    }
  }

  return true;
};

/**
 * Get permission summary for a role (count of allowed permissions)
 */
export const getPermissionSummary = (
  role: Role
): {
  totalResources: number;
  accessibleResources: number;
  totalPermissions: number;
  allowedPermissions: number;
} => {
  let totalPermissions = 0;
  let allowedPermissions = 0;
  const accessibleResources = new Set<string>();

  Object.entries(role.permissions).forEach(([resource, permissions]) => {
    let hasAccess = false;

    Object.entries(permissions).forEach(([_, allowed]) => {
      totalPermissions++;
      if (allowed) {
        allowedPermissions++;
        hasAccess = true;
      }
    });

    if (hasAccess) {
      accessibleResources.add(resource);
    }
  });

  return {
    totalResources: Object.keys(role.permissions).length,
    accessibleResources: accessibleResources.size,
    totalPermissions,
    allowedPermissions,
  };
};
