import { readFileSync } from 'fs';
import { beforeAll, beforeEach, afterAll, describe, it } from 'vitest';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';

/**
 * Firestore security rules tests. Run with `npm run test:rules`, which
 * wraps vitest in `firebase emulators:exec --only firestore`.
 */

const PROJECT_ID = 'demo-inkuthazo-rules';

const APPROVED_UID = 'approved-member';
const PENDING_UID = 'pending-member';
const ADMIN_UID = 'admin-user';

let testEnv: RulesTestEnvironment;

const seedData = async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();

    // Roles catalogue (mirrors the permission-based model)
    await db.doc('roles/member').set({
      name: 'member',
      permissions: {
        my_contributions: { view: true },
      },
    });
    await db.doc('roles/admin').set({
      name: 'admin',
      permissions: {
        members: { view: true, create: true, edit: true, delete: true },
        contributions: { view: true, create: true, edit: true, delete: true },
        payouts: { view: true, create: true, edit: true, delete: true },
        audit_logs: { view: true, delete: true },
      },
    });

    // Members
    await db.doc(`members/${APPROVED_UID}`).set({
      full_name: 'Approved Member',
      email: 'approved@example.com',
      phone: '0700000001',
      role: 'member',
      status: 'approved',
    });
    await db.doc(`members/${PENDING_UID}`).set({
      full_name: 'Pending Member',
      email: 'pending@example.com',
      phone: '0700000002',
      role: 'member',
      status: 'pending',
    });
    await db.doc(`members/${ADMIN_UID}`).set({
      full_name: 'Admin User',
      email: 'admin@example.com',
      phone: '0700000003',
      role: 'admin',
      status: 'active',
    });

    // Sample financial data
    await db.doc('payouts/p1').set({ amount: 500, member_id: 'someone' });
    await db.doc('contributions/own-pending').set({
      member_id: PENDING_UID,
      amount: 100,
      date: new Date(),
      type: 'monthly',
      status: 'pending',
    });
    await db.doc('contributions/other').set({
      member_id: 'someone-else',
      amount: 100,
      date: new Date(),
      type: 'monthly',
      status: 'approved',
    });
    await db.doc('audit_logs/log1').set({
      userId: 'someone',
      userName: 'Someone',
      action: 'TEST',
      details: {},
      actor_id: 'someone',
      timestamp: new Date(),
    });
  });
};

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
    },
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await seedData();
});

afterAll(async () => {
  await testEnv.cleanup();
});

// Auth contexts carry the custom claims (role, status) that the
// syncMemberClaims Cloud Function mirrors from the member document —
// the rules authorize from these token claims, not from member doc reads
const approvedDb = () =>
  testEnv
    .authenticatedContext(APPROVED_UID, {
      email: 'approved@example.com',
      role: 'member',
      status: 'approved',
    })
    .firestore();
const pendingDb = () =>
  testEnv
    .authenticatedContext(PENDING_UID, {
      email: 'pending@example.com',
      role: 'member',
      status: 'pending',
    })
    .firestore();
const adminDb = () =>
  testEnv
    .authenticatedContext(ADMIN_UID, {
      email: 'admin@example.com',
      role: 'admin',
      status: 'active',
    })
    .firestore();
const anonDb = () => testEnv.unauthenticatedContext().firestore();

describe('members collection', () => {
  it('denies unauthenticated reads', async () => {
    await assertFails(anonDb().doc(`members/${APPROVED_UID}`).get());
  });

  it('lets a member read their own document', async () => {
    await assertSucceeds(approvedDb().doc(`members/${APPROVED_UID}`).get());
  });

  it('allows signup only when the email matches the auth token', async () => {
    const newUid = 'new-user';
    const signup = (email: string) =>
      testEnv
        .authenticatedContext(newUid, { email: 'new@example.com' })
        .firestore()
        .doc(`members/${newUid}`)
        .set({
          full_name: 'New User',
          email,
          phone: '0700000009',
          role: 'member',
          status: 'pending',
        });

    await assertFails(signup('someoneelse@example.com'));
    await assertSucceeds(signup('new@example.com'));
  });

  it('blocks signup with elevated role or status', async () => {
    const newUid = 'sneaky-user';
    const db = testEnv
      .authenticatedContext(newUid, { email: 'sneaky@example.com' })
      .firestore();
    await assertFails(
      db.doc(`members/${newUid}`).set({
        full_name: 'Sneaky',
        email: 'sneaky@example.com',
        phone: '0700000010',
        role: 'admin',
        status: 'pending',
      })
    );
    await assertFails(
      db.doc(`members/${newUid}`).set({
        full_name: 'Sneaky',
        email: 'sneaky@example.com',
        phone: '0700000010',
        role: 'member',
        status: 'approved',
      })
    );
  });

  it('lets members update their own profile but never role or status', async () => {
    await assertSucceeds(
      approvedDb().doc(`members/${APPROVED_UID}`).update({ phone: '0711111111' })
    );
    await assertFails(
      approvedDb().doc(`members/${APPROVED_UID}`).update({ role: 'admin' })
    );
    await assertFails(
      approvedDb().doc(`members/${APPROVED_UID}`).update({ status: 'active' })
    );
  });
});

describe('contributions collection', () => {
  it('lets approved members read contributions (transparency)', async () => {
    await assertSucceeds(approvedDb().doc('contributions/other').get());
  });

  it('blocks pending members from reading others’ contributions', async () => {
    await assertFails(pendingDb().doc('contributions/other').get());
  });

  it('lets pending members read their own contribution', async () => {
    await assertSucceeds(pendingDb().doc('contributions/own-pending').get());
  });

  it('lets an approved member submit a valid pending contribution', async () => {
    await assertSucceeds(
      approvedDb().collection('contributions').add({
        member_id: APPROVED_UID,
        amount: 250,
        date: new Date(),
        type: 'monthly',
        status: 'pending',
      })
    );
  });

  it('rejects self-approval, bad amounts, and review fields', async () => {
    const base = {
      member_id: APPROVED_UID,
      amount: 250,
      date: new Date(),
      type: 'monthly',
      status: 'pending',
    };
    const db = approvedDb();
    await assertFails(
      db.collection('contributions').add({ ...base, status: 'approved' })
    );
    await assertFails(db.collection('contributions').add({ ...base, amount: -5 }));
    await assertFails(db.collection('contributions').add({ ...base, amount: 0 }));
    await assertFails(
      db.collection('contributions').add({ ...base, type: 'bogus-type' })
    );
    await assertFails(
      db.collection('contributions').add({ ...base, reviewed_by: APPROVED_UID })
    );
    await assertFails(
      db.collection('contributions').add({ ...base, member_id: 'someone-else' })
    );
  });

  it('lets a permission holder create a contribution for any member', async () => {
    await assertSucceeds(
      adminDb().collection('contributions').add({
        member_id: 'someone-else',
        amount: 250,
        date: new Date(),
        type: 'monthly',
        status: 'approved',
      })
    );
  });

  it('blocks members from updating or deleting contributions', async () => {
    await assertFails(
      approvedDb().doc('contributions/other').update({ amount: 1 })
    );
    await assertFails(approvedDb().doc('contributions/other').delete());
  });
});

describe('payouts collection', () => {
  it('lets approved members read payouts, but not pending members', async () => {
    await assertSucceeds(approvedDb().doc('payouts/p1').get());
    await assertFails(pendingDb().doc('payouts/p1').get());
    await assertFails(anonDb().doc('payouts/p1').get());
  });

  it('only permission holders can write payouts', async () => {
    await assertFails(
      approvedDb().collection('payouts').add({ amount: 10, member_id: APPROVED_UID })
    );
    await assertSucceeds(
      adminDb().collection('payouts').add({ amount: 10, member_id: 'someone' })
    );
  });
});

describe('audit_logs collection', () => {
  const validLog = (actorId: string) => ({
    userId: 'subject-user',
    userName: 'Subject',
    action: 'TEST_ACTION',
    details: { note: 'test' },
    actor_id: actorId,
    timestamp: new Date(),
  });

  it('accepts a well-formed log naming the caller as actor', async () => {
    await assertSucceeds(
      approvedDb().collection('audit_logs').add(validLog(APPROVED_UID))
    );
  });

  it('rejects logs with a spoofed or missing actor_id', async () => {
    await assertFails(
      approvedDb().collection('audit_logs').add(validLog('someone-else'))
    );
    const { actor_id: _dropped, ...withoutActor } = validLog(APPROVED_UID);
    await assertFails(approvedDb().collection('audit_logs').add(withoutActor));
  });

  it('keeps logs immutable and readable only with permission', async () => {
    await assertFails(
      adminDb().doc('audit_logs/log1').update({ action: 'TAMPERED' })
    );
    await assertSucceeds(adminDb().doc('audit_logs/log1').get());
    await assertFails(approvedDb().doc('audit_logs/log1').get());
  });
});
