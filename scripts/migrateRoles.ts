/**
 * Migration Script: Create Role Documents in Firestore
 *
 * This script creates role documents for the existing system roles
 * (admin, member, dc_member, chairperson) with their default permissions.
 *
 * Run this script ONCE after deploying the new role management system.
 *
 * Usage:
 * 1. Make sure you have Firebase Admin SDK set up
 * 2. Run: ts-node scripts/migrateRoles.ts
 *
 * Or integrate into the app as a one-time setup function.
 */

import { collection, doc, setDoc, getDocs, query, where, Timestamp } from "firebase/firestore";
import { db } from "../src/config/firebase";
import {
  ADMIN_PERMISSIONS,
  MEMBER_PERMISSIONS,
  DC_MEMBER_PERMISSIONS,
  CHAIRPERSON_PERMISSIONS,
} from "../src/constants/permissions";
import { Role, SystemRole } from "../src/types/role";

interface SystemRoleConfig {
  name: string;
  description: string;
  permissions: any;
}

const SYSTEM_ROLES: SystemRoleConfig[] = [
  {
    name: SystemRole.ADMIN,
    description: "Administrator with full system access. Can manage all features, users, and system configurations.",
    permissions: ADMIN_PERMISSIONS,
  },
  {
    name: SystemRole.MEMBER,
    description: "Regular member with access to personal features and viewing capabilities.",
    permissions: MEMBER_PERMISSIONS,
  },
  {
    name: SystemRole.DC_MEMBER,
    description: "Disciplinary Committee member with additional disciplinary management permissions.",
    permissions: DC_MEMBER_PERMISSIONS,
  },
  {
    name: SystemRole.CHAIRPERSON,
    description: "Chairperson with credit review and approval capabilities.",
    permissions: CHAIRPERSON_PERMISSIONS,
  },
];

/**
 * Create role documents in Firestore
 */
export const createSystemRoles = async () => {
  console.log("🚀 Starting role migration...\n");

  try {
    const rolesCollection = collection(db, "roles");
    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const roleConfig of SYSTEM_ROLES) {
      console.log(`📋 Processing role: ${roleConfig.name}`);

      // Check if role already exists
      const existingRoleQuery = query(
        rolesCollection,
        where("name", "==", roleConfig.name)
      );
      const existingRoleSnapshot = await getDocs(existingRoleQuery);

      if (!existingRoleSnapshot.empty) {
        // Role exists - update it
        const existingRole = existingRoleSnapshot.docs[0];
        const existingData = existingRole.data();

        // Only update if it's a system role (don't overwrite custom roles with same name)
        if (existingData.isSystemRole) {
          await setDoc(
            existingRole.ref,
            {
              description: roleConfig.description,
              permissions: roleConfig.permissions,
              updatedAt: Timestamp.now(),
            },
            { merge: true }
          );
          console.log(`   ✅ Updated existing system role: ${roleConfig.name}`);
          updated++;
        } else {
          console.log(`   ⚠️  Skipped: Role exists as custom role (not system role)`);
          skipped++;
        }
      } else {
        // Create new role
        const roleData: Omit<Role, "id"> = {
          name: roleConfig.name,
          description: roleConfig.description,
          isSystemRole: true,
          permissions: roleConfig.permissions,
          createdAt: Timestamp.now(),
          createdBy: "system_migration",
        };

        const newRoleRef = doc(rolesCollection);
        await setDoc(newRoleRef, roleData);
        console.log(`   ✅ Created new system role: ${roleConfig.name} (ID: ${newRoleRef.id})`);
        created++;
      }
    }

    console.log("\n✨ Migration completed successfully!");
    console.log(`📊 Summary:`);
    console.log(`   - Created: ${created} role(s)`);
    console.log(`   - Updated: ${updated} role(s)`);
    console.log(`   - Skipped: ${skipped} role(s)`);

    return {
      success: true,
      created,
      updated,
      skipped,
    };
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    throw error;
  }
};

/**
 * Verify role migration
 */
export const verifyRoleMigration = async () => {
  console.log("\n🔍 Verifying role migration...\n");

  try {
    const rolesCollection = collection(db, "roles");
    const rolesSnapshot = await getDocs(rolesCollection);

    console.log(`Total roles in database: ${rolesSnapshot.size}\n`);

    const systemRoles: any[] = [];
    const customRoles: any[] = [];

    rolesSnapshot.forEach((doc) => {
      const roleData = doc.data();
      const role = {
        id: doc.id,
        name: roleData.name,
        isSystemRole: roleData.isSystemRole,
        permissionCount: Object.keys(roleData.permissions || {}).length,
      };

      if (roleData.isSystemRole) {
        systemRoles.push(role);
      } else {
        customRoles.push(role);
      }
    });

    console.log("📌 System Roles:");
    systemRoles.forEach((role) => {
      console.log(`   - ${role.name} (${role.permissionCount} resources configured)`);
    });

    if (customRoles.length > 0) {
      console.log("\n📌 Custom Roles:");
      customRoles.forEach((role) => {
        console.log(`   - ${role.name} (${role.permissionCount} resources configured)`);
      });
    }

    // Check if all system roles exist
    const missingRoles = SYSTEM_ROLES.filter(
      (sysRole) => !systemRoles.find((r) => r.name === sysRole.name)
    );

    if (missingRoles.length > 0) {
      console.log("\n⚠️  Missing system roles:");
      missingRoles.forEach((role) => {
        console.log(`   - ${role.name}`);
      });
      return { success: false, missing: missingRoles.map((r) => r.name) };
    }

    console.log("\n✅ All system roles are present!");
    return { success: true, systemRoles: systemRoles.length, customRoles: customRoles.length };
  } catch (error) {
    console.error("\n❌ Verification failed:", error);
    throw error;
  }
};

/**
 * Update existing members with roleId field
 * This adds a roleId reference to members who only have the role name
 */
export const updateMembersWithRoleIds = async () => {
  console.log("\n🔄 Updating members with role IDs...\n");

  try {
    const membersCollection = collection(db, "members");
    const membersSnapshot = await getDocs(membersCollection);

    const rolesCollection = collection(db, "roles");
    const rolesSnapshot = await getDocs(rolesCollection);

    // Create a map of role names to role IDs
    const roleNameToId = new Map<string, string>();
    rolesSnapshot.forEach((doc) => {
      const roleData = doc.data();
      roleNameToId.set(roleData.name, doc.id);
    });

    let updated = 0;
    let skipped = 0;

    for (const memberDoc of membersSnapshot.docs) {
      const memberData = memberDoc.data();

      // Skip if member already has roleId
      if (memberData.roleId) {
        skipped++;
        continue;
      }

      const roleName = memberData.role;
      const roleId = roleNameToId.get(roleName);

      if (roleId) {
        await setDoc(
          memberDoc.ref,
          {
            roleId: roleId,
          },
          { merge: true }
        );
        console.log(`   ✅ Updated member ${memberData.full_name || memberDoc.id} with roleId`);
        updated++;
      } else {
        console.log(`   ⚠️  Warning: No role found for ${roleName} (member: ${memberData.full_name})`);
      }
    }

    console.log("\n✨ Member update completed!");
    console.log(`📊 Summary:`);
    console.log(`   - Updated: ${updated} member(s)`);
    console.log(`   - Skipped: ${skipped} member(s) (already have roleId)`);

    return {
      success: true,
      updated,
      skipped,
    };
  } catch (error) {
    console.error("\n❌ Member update failed:", error);
    throw error;
  }
};

/**
 * Run full migration
 */
export const runFullMigration = async () => {
  console.log("╔═══════════════════════════════════════════════╗");
  console.log("║   INKUTHAZO ROLE MANAGEMENT MIGRATION        ║");
  console.log("╚═══════════════════════════════════════════════╝\n");

  try {
    // Step 1: Create/Update roles
    await createSystemRoles();

    // Step 2: Verify migration
    await verifyRoleMigration();

    // Step 3: Update members with roleId
    await updateMembersWithRoleIds();

    console.log("\n╔═══════════════════════════════════════════════╗");
    console.log("║   ✅ MIGRATION COMPLETED SUCCESSFULLY        ║");
    console.log("╚═══════════════════════════════════════════════╝\n");

    return { success: true };
  } catch (error) {
    console.log("\n╔═══════════════════════════════════════════════╗");
    console.log("║   ❌ MIGRATION FAILED                        ║");
    console.log("╚═══════════════════════════════════════════════╝\n");
    throw error;
  }
};

// Export for use in app
export default {
  createSystemRoles,
  verifyRoleMigration,
  updateMembersWithRoleIds,
  runFullMigration,
};

// If running directly with ts-node
if (require.main === module) {
  runFullMigration()
    .then(() => {
      console.log("Migration script completed. You can now close this process.");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration script failed:", error);
      process.exit(1);
    });
}
