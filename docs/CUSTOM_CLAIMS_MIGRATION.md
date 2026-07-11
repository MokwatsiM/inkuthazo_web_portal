# Custom Claims Migration — Rollout Guide

**What changed:** Firestore and Storage security rules now read the user's
`role` and `status` from **ID token custom claims** (`request.auth.token.role`
/ `.status`) instead of fetching the member document on every check. This
removes 2–3 billed document reads *per rule evaluation* and makes every
Firestore/Storage operation faster.

**How claims stay in sync:** the `syncMemberClaims` Cloud Function
(`functions/src/index.ts`) fires whenever a member document is created or
updated and mirrors `role` and `status` into Auth custom claims.

**Client impact:** none functionally — the app still reads the role from the
member document for UI decisions. The encrypted localStorage permission cache
was removed (`usePermissions.ts`); permissions still update in realtime via
Firestore listeners, and the recurring "Malformed UTF-8" decryption errors
are gone along with the `crypto-js` dependency.

## Deploy order (IMPORTANT — do not reorder)

Deploying rules before claims exist would lock every existing user out of
permission-gated data until their claims are set and their token refreshes.

1. **Deploy functions** so future member changes sync claims:
   ```bash
   firebase deploy --only functions
   ```
2. **Backfill claims for all existing users:**
   ```bash
   node scripts/backfillClaims.cjs
   ```
   (needs `serviceAccountKey.json` in the project root)
3. **Verify a few users** got claims:
   Firebase console → Authentication → pick a user → check custom claims,
   or `admin.auth().getUser(uid)` in a node REPL.
4. **Deploy the new rules:**
   ```bash
   firebase deploy --only firestore:rules,storage
   ```
5. **Ask active users to sign out/in** (or wait ≤1 hour for automatic token
   refresh). Until their token refreshes, users authenticated *before* the
   backfill carry no claims and will get permission-denied on gated pages —
   re-login fixes it immediately.

## Ongoing behavior

- Role changes via Role Management now propagate to claims automatically;
  the affected user gets the new access after their next token refresh
  (≤1 hour) or re-login. Previously rules saw role changes instantly —
  this is the one behavioral trade-off of the migration.
- New signups: the member document create triggers `syncMemberClaims`, so
  claims exist before the user's first token refresh. The signup itself and
  reading `members/{own-uid}` do not require claims.

## Testing

`npm run test:rules` covers the claims model — auth contexts in
`tests/rules/firestore.rules.test.ts` carry `role`/`status` claims exactly
as the function sets them.
