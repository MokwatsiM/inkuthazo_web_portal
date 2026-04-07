import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "../config/firebase";
import {
  Role,
  CreateRoleDTO,
  UpdateRoleDTO,
  RoleWithStats,
  SystemRole,
} from "../types/role";
import logger from "../utils/logger";

const ROLES_COLLECTION = "roles";
const MEMBERS_COLLECTION = "members";

/**
 * Create a new role in Firestore
 * IMPORTANT: Uses role name as document ID for Firestore security rules
 */
export const createRole = async (
  roleData: CreateRoleDTO,
  createdBy: string
): Promise<string> => {
  try {
    // Check if role with same name exists
    const existingRole = await getRoleByName(roleData.name);
    if (existingRole) {
      throw new Error(`Role with name "${roleData.name}" already exists`);
    }

    const roleDoc = {
      ...roleData,
      isSystemRole: false,
      createdAt: serverTimestamp(),
      createdBy,
    };

    // Use role name as document ID for Firestore security rules
    const roleRef = doc(db, ROLES_COLLECTION, roleData.name);
    await setDoc(roleRef, roleDoc);
    return roleData.name;
  } catch (error) {
    logger.error("Error creating role:", error);
    throw error;
  }
};

/**
 * Update an existing role
 */
export const updateRole = async (
  roleId: string,
  updateData: UpdateRoleDTO
): Promise<void> => {
  try {
    const roleRef = doc(db, ROLES_COLLECTION, roleId);
    const roleSnap = await getDoc(roleRef);

    if (!roleSnap.exists()) {
      throw new Error(`Role with ID "${roleId}" not found`);
    }

    const role = roleSnap.data() as Role;

    // Prevent updating system role name/isSystemRole flag
    if (role.isSystemRole && updateData.name && updateData.name !== role.name) {
      throw new Error("Cannot rename system roles");
    }

    await updateDoc(roleRef, {
      ...updateData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    logger.error("Error updating role:", error);
    throw error;
  }
};

/**
 * Delete a role (with safety checks)
 */
export const deleteRole = async (roleId: string): Promise<void> => {
  try {
    const roleRef = doc(db, ROLES_COLLECTION, roleId);
    const roleSnap = await getDoc(roleRef);

    if (!roleSnap.exists()) {
      throw new Error(`Role with ID "${roleId}" not found`);
    }

    const role = roleSnap.data() as Role;

    // Prevent deleting system roles
    if (role.isSystemRole) {
      throw new Error("Cannot delete system roles");
    }

    // Check if any members are assigned this role
    const membersWithRole = await getMembersWithRole(roleId);
    if (membersWithRole.length > 0) {
      throw new Error(
        `Cannot delete role. ${membersWithRole.length} member(s) are assigned this role. Please reassign them first.`
      );
    }

    await deleteDoc(roleRef);
  } catch (error) {
    logger.error("Error deleting role:", error);
    throw error;
  }
};

/**
 * Get a role by ID
 */
export const getRoleById = async (roleId: string): Promise<Role | null> => {
  try {
    const roleRef = doc(db, ROLES_COLLECTION, roleId);
    const roleSnap = await getDoc(roleRef);

    if (!roleSnap.exists()) {
      return null;
    }

    return {
      id: roleSnap.id,
      ...roleSnap.data(),
    } as Role;
  } catch (error) {
    logger.error("Error getting role:", error);
    throw error;
  }
};

/**
 * Get a role by name
 */
export const getRoleByName = async (name: string): Promise<Role | null> => {
  try {
    const q = query(
      collection(db, ROLES_COLLECTION),
      where("name", "==", name)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const roleDoc = querySnapshot.docs[0];
    return {
      id: roleDoc.id,
      ...roleDoc.data(),
    } as Role;
  } catch (error) {
    logger.error("Error getting role by name:", error);
    throw error;
  }
};

/**
 * Get all roles
 */
export const getAllRoles = async (): Promise<Role[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, ROLES_COLLECTION));
    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as Role)
    );
  } catch (error) {
    logger.error("Error getting all roles:", error);
    throw error;
  }
};

/**
 * Get all roles with member counts
 */
export const getAllRolesWithStats = async (): Promise<RoleWithStats[]> => {
  try {
    const roles = await getAllRoles();
    const membersSnapshot = await getDocs(collection(db, MEMBERS_COLLECTION));

    // Count members per role
    const roleCounts = new Map<string, number>();
    membersSnapshot.docs.forEach((doc) => {
      const member = doc.data();
      const roleId = member.role;
      roleCounts.set(roleId, (roleCounts.get(roleId) || 0) + 1);
    });

    return roles.map((role) => ({
      ...role,
      memberCount: roleCounts.get(role.id) || roleCounts.get(role.name) || 0,
    }));
  } catch (error) {
    logger.error("Error getting roles with stats:", error);
    throw error;
  }
};

/**
 * Get custom roles only (exclude system roles)
 */
export const getCustomRoles = async (): Promise<Role[]> => {
  try {
    const q = query(
      collection(db, ROLES_COLLECTION),
      where("isSystemRole", "==", false)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as Role)
    );
  } catch (error) {
    logger.error("Error getting custom roles:", error);
    throw error;
  }
};

/**
 * Get system roles only
 */
export const getSystemRoles = async (): Promise<Role[]> => {
  try {
    const q = query(
      collection(db, ROLES_COLLECTION),
      where("isSystemRole", "==", true)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as Role)
    );
  } catch (error) {
    logger.error("Error getting system roles:", error);
    throw error;
  }
};

/**
 * Get members who have a specific role
 */
export const getMembersWithRole = async (roleId: string): Promise<any[]> => {
  try {
    // Try both roleId and role name for compatibility
    const role = await getRoleById(roleId);
    const roleName = role?.name || roleId;

    const q = query(
      collection(db, MEMBERS_COLLECTION),
      where("role", "in", [roleId, roleName])
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    logger.error("Error getting members with role:", error);
    throw error;
  }
};

/**
 * Assign a role to a member
 */
export const assignRoleToMember = async (
  memberId: string,
  roleId: string,
  assignedBy: string
): Promise<void> => {
  try {
    const memberRef = doc(db, MEMBERS_COLLECTION, memberId);
    const memberSnap = await getDoc(memberRef);

    if (!memberSnap.exists()) {
      throw new Error(`Member with ID "${memberId}" not found`);
    }

    const role = await getRoleById(roleId);
    if (!role) {
      throw new Error(`Role with ID "${roleId}" not found`);
    }

    // Update member's role
    await updateDoc(memberRef, {
      role: role.name, // Store role name for backward compatibility
      roleId: roleId,  // Store role ID for new system
      roleUpdatedAt: serverTimestamp(),
      roleUpdatedBy: assignedBy,
    });

    // TODO: Add to role assignment history collection for audit trail
  } catch (error) {
    logger.error("Error assigning role to member:", error);
    throw error;
  }
};

/**
 * Bulk assign role to multiple members
 */
export const bulkAssignRole = async (
  memberIds: string[],
  roleId: string,
  assignedBy: string
): Promise<void> => {
  try {
    const role = await getRoleById(roleId);
    if (!role) {
      throw new Error(`Role with ID "${roleId}" not found`);
    }

    const batch = writeBatch(db);

    memberIds.forEach((memberId) => {
      const memberRef = doc(db, MEMBERS_COLLECTION, memberId);
      batch.update(memberRef, {
        role: role.name,
        roleId: roleId,
        roleUpdatedAt: serverTimestamp(),
        roleUpdatedBy: assignedBy,
      });
    });

    await batch.commit();
  } catch (error) {
    logger.error("Error bulk assigning role:", error);
    throw error;
  }
};

/**
 * Check if a role name is a system role
 */
export const isSystemRoleName = (roleName: string): boolean => {
  return Object.values(SystemRole).includes(roleName as SystemRole);
};

/**
 * Validate role name (no special characters, not empty, not duplicate)
 */
export const validateRoleName = async (name: string, excludeId?: string): Promise<boolean> => {
  if (!name || name.trim().length === 0) {
    throw new Error("Role name cannot be empty");
  }

  if (name.length < 3) {
    throw new Error("Role name must be at least 3 characters");
  }

  if (name.length > 50) {
    throw new Error("Role name must be less than 50 characters");
  }

  // Check for special characters (allow letters, numbers, spaces, hyphens, underscores)
  const validNamePattern = /^[a-zA-Z0-9\s_-]+$/;
  if (!validNamePattern.test(name)) {
    throw new Error("Role name can only contain letters, numbers, spaces, hyphens, and underscores");
  }

  // Check for duplicate name
  const existingRole = await getRoleByName(name);
  if (existingRole && existingRole.id !== excludeId) {
    throw new Error(`Role with name "${name}" already exists`);
  }

  return true;
};
