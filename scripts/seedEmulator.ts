/**
 * Seed the local Firestore EMULATOR with the system role documents the app
 * needs (roles/admin, roles/member, roles/dc_member, roles/chairperson).
 *
 * A fresh emulator starts empty, so usePermissions logs "Role document not
 * found" and members see no menu. This writes the roles via the Admin SDK
 * (which bypasses security rules — impossible to bootstrap through the app
 * on an empty DB, since creating roles itself requires the role_management
 * permission that lives in roles/admin).
 *
 * Permissions are imported from src/ so they always match the running app.
 *
 * Usage (emulators must be running):
 *   npm run seed:emulator
 *
 * Safety: refuses to run unless FIRESTORE_EMULATOR_HOST is set, so it can
 * never write to the production database.
 */
import admin from "../functions/node_modules/firebase-admin/lib/index.js";
import { SystemRole } from "../src/types/role";
import {
  ADMIN_PERMISSIONS,
  MEMBER_PERMISSIONS,
  DC_MEMBER_PERMISSIONS,
  CHAIRPERSON_PERMISSIONS,
} from "../src/constants/permissions";

const EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";
// Point the Admin SDK at the emulator and guard against hitting cloud.
process.env.FIRESTORE_EMULATOR_HOST = EMULATOR_HOST;

// Emulator data is partitioned by project id, so this MUST match the project
// the app connects to (VITE_FIREBASE_PROJECT_ID / .firebaserc default), or the
// seeded roles land in a different namespace the app never reads.
const PROJECT_ID =
  process.env.SEED_PROJECT_ID ||
  process.env.GCLOUD_PROJECT ||
  "inkuthazo-a0ac7";

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

const seed = async () => {
  admin.initializeApp({ projectId: PROJECT_ID });
  const db = admin.firestore();
  const now = admin.firestore.Timestamp.now();

  for (const role of systemRoles) {
    // Doc id === role name (matches the app + security rules).
    await db.doc(`roles/${role.name}`).set({
      name: role.name,
      description: role.description,
      isSystemRole: true,
      permissions: role.permissions,
      createdAt: now,
      createdBy: "seed-script",
    });
    console.log(`  ✓ roles/${role.name}`);
  }

  console.log(
    `Seeded ${systemRoles.length} roles into the emulator (${EMULATOR_HOST}).`
  );
  console.log(
    "Make yourself admin: in the Emulator UI (http://127.0.0.1:4000) open " +
      "your members/{uid} doc and set role to 'admin'."
  );
};

seed().then(() => process.exit(0));
