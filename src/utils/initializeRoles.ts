/**
 * Initialize Roles Utility
 *
 * This can be called from the app (e.g., from an admin button)
 * to set up the role system for the first time.
 */

import { collection, doc, getDocs, query, setDoc, Timestamp, where } from "firebase/firestore";
import { db } from "../config/firebase";
import {
  ADMIN_PERMISSIONS,
  CHAIRPERSON_PERMISSIONS,
  DC_MEMBER_PERMISSIONS,
  MEMBER_PERMISSIONS,
} from "../constants/permissions";
import { Role, SystemRole } from "../types/role";
import logger from "./logger";

interface RoleInitResult {
  success: boolean;
  created: number;
  updated: number;
  errors: string[];
  message: string;
}

/**
 * Initialize system roles in Firestore
 * Safe to run multiple times - will update existing roles or create new ones
 */
export const initializeSystemRoles = async (userId: string = "system"): Promise<RoleInitResult> => {
  const result: RoleInitResult = {
    success: false,
    created: 0,
    updated: 0,
    errors: [],
    message: "",
  };

  const systemRoles = [
    {
      name: SystemRole.ADMIN,
      description: "Administrator with full system access",
      permissions: ADMIN_PERMISSIONS,
    },
    {
      name: SystemRole.MEMBER,
      description: "Regular member with personal feature access",
      permissions: MEMBER_PERMISSIONS,
    },
    {
      name: SystemRole.DC_MEMBER,
      description: "Disciplinary Committee member",
      permissions: DC_MEMBER_PERMISSIONS,
    },
    {
      name: SystemRole.CHAIRPERSON,
      description: "Chairperson with credit review permissions",
      permissions: CHAIRPERSON_PERMISSIONS,
    },
  ];

  try {
    const rolesCollection = collection(db, "roles");

    for (const roleConfig of systemRoles) {
      try {
        // Check if role exists
        const roleQuery = query(rolesCollection, where("name", "==", roleConfig.name));
        const existingRoles = await getDocs(roleQuery);

        if (!existingRoles.empty) {
          // Update existing role
          const existingRole = existingRoles.docs[0];
          await setDoc(
            existingRole.ref,
            {
              description: roleConfig.description,
              permissions: roleConfig.permissions,
              updatedAt: Timestamp.now(),
              updatedBy: userId,
            },
            { merge: true }
          );
          result.updated++;
        } else {
          // Create new role
          // IMPORTANT: Use role name as document ID for Firestore security rules
          const roleData: Omit<Role, "id"> = {
            name: roleConfig.name,
            description: roleConfig.description,
            isSystemRole: true,
            permissions: roleConfig.permissions,
            createdAt: Timestamp.now(),
            createdBy: userId,
          };

          await setDoc(doc(rolesCollection, roleConfig.name), roleData);
          result.created++;
        }
      } catch (error: any) {
        result.errors.push(`Error processing ${roleConfig.name}: ${error.message}`);
      }
    }

    if (result.errors.length === 0) {
      result.success = true;
      result.message = `Successfully initialized roles. Created: ${result.created}, Updated: ${result.updated}`;
    } else {
      logger.debug(result.errors.toString());
      result.message = `Partially completed with ${result.errors.length} error(s)`;
    }
  } catch (error: any) {
    result.errors.push(`Fatal error: ${error.message}`);
    result.message = "Failed to initialize roles";
  }

  return result;
};

/**
 * Check if roles are already initialized
 */
export const areRolesInitialized = async (): Promise<boolean> => {
  try {
    const rolesCollection = collection(db, "roles");
    const rolesSnapshot = await getDocs(rolesCollection);

    // Check if all 4 system roles exist
    const roleNames = new Set(rolesSnapshot.docs.map((doc) => doc.data().name));

    return (
      roleNames.has(SystemRole.ADMIN) &&
      roleNames.has(SystemRole.MEMBER) &&
      roleNames.has(SystemRole.DC_MEMBER) &&
      roleNames.has(SystemRole.CHAIRPERSON)
    );
  } catch (error) {
    logger.error("Error checking role initialization:", error);
    return false;
  }
};
