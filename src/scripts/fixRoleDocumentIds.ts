/**
 * One-time migration script to fix role document IDs
 * This script copies existing roles to new documents with their name as the ID
 * Run this once after deploying the new permission-based Firestore rules
 */

import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc
} from "firebase/firestore";
import { db } from "../config/firebase";
import logger from "../utils/logger";

export const fixRoleDocumentIds = async () => {
  logger.debug("Starting role document ID migration...");

  try {
    const rolesCollection = collection(db, "roles");
    const rolesSnapshot = await getDocs(rolesCollection);

    logger.debug(`Found ${rolesSnapshot.docs.length} roles to migrate`);

    let migrated = 0;
    let skipped = 0;

    for (const roleDoc of rolesSnapshot.docs) {
      const roleData = roleDoc.data();
      const roleName = roleData.name;

      // Skip if document ID already matches role name
      if (roleDoc.id === roleName) {
        logger.debug(`✓ Role "${roleName}" already has correct ID, skipping`);
        skipped++;
        continue;
      }

      logger.debug(`Migrating role "${roleName}" from ID "${roleDoc.id}" to "${roleName}"`);

      // Create new document with role name as ID
      const newRoleRef = doc(db, "roles", roleName);
      await setDoc(newRoleRef, {
        ...roleData,
        // Add migration metadata
        migratedFrom: roleDoc.id,
        migratedAt: new Date(),
      });

      // Delete old document
      await deleteDoc(roleDoc.ref);

      logger.debug(`✓ Successfully migrated role "${roleName}"`);
      migrated++;
    }

    logger.debug("\n=== Migration Complete ===");
    logger.debug(`Migrated: ${migrated}`);
    logger.debug(`Skipped: ${skipped}`);
    logger.debug(`Total: ${rolesSnapshot.docs.length}`);

    return {
      success: true,
      migrated,
      skipped,
      total: rolesSnapshot.docs.length,
    };
  } catch (error) {
    logger.error("Error during migration:", error);
    throw error;
  }
};
