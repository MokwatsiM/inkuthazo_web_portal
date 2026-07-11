/**
 * One-time backfill: copy role/status from every member document into
 * Firebase Auth custom claims. Run BEFORE deploying the token-claims
 * security rules, otherwise existing users will be denied access until
 * the syncMemberClaims function next fires for them.
 *
 * Usage: node scripts/backfillClaims.cjs
 * Requires serviceAccountKey.json in the project root (gitignored).
 *
 * firebase-admin is resolved from functions/node_modules — the admin SDK is
 * deliberately not a frontend dependency. Run `npm ci` in functions/ first
 * if that folder has no node_modules.
 */
const admin = require('../functions/node_modules/firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const backfill = async () => {
  const members = await admin.firestore().collection('members').get();
  console.log(`Backfilling claims for ${members.size} members...`);

  let ok = 0;
  let failed = 0;

  for (const doc of members.docs) {
    const { role, status } = doc.data();
    try {
      await admin.auth().setCustomUserClaims(doc.id, {
        role: role ?? null,
        status: status ?? null,
      });
      ok++;
      console.log(`  ✓ ${doc.id} role=${role} status=${status}`);
    } catch (error) {
      failed++;
      console.error(`  ✗ ${doc.id}: ${error.message}`);
    }
  }

  console.log(`Done. ${ok} updated, ${failed} failed.`);
  console.log('Users pick up new claims on next token refresh (≤1h) or re-login.');
};

backfill().then(() => process.exit(0));
