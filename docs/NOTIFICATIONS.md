# Lifecycle Notifications — Email (Brevo) + In-App Inbox

Members get a persistent in-app notification (bell in the header) and an
email when: a contribution/claim/donation of theirs is reviewed, their
credit request is reviewed / needs info / is settled, their account is
approved, and ahead of their hosting month (25th of the prior month).

## Architecture

- All lifecycle status changes happen client-side, so **Firestore
  `onUpdate` triggers** in [functions/src/notifications/triggers.ts](../functions/src/notifications/triggers.ts)
  detect transitions (`mapStatusTransition`) and call the single
  orchestrator `notify()` ([notify.ts](../functions/src/notifications/notify.ts)):
  1. writes `notifications/{deterministicKey}` via `create()` — trigger
     retries hit ALREADY_EXISTS and dedupe automatically;
  2. sends the email best-effort via Brevo REST (plain `fetch`, no SDK) —
     a failed send never fails the trigger;
  3. (future) FCM push fan-out slots in here.
- Notification content is rendered by the pure, unit-tested catalogue
  ([catalogue.ts](../functions/src/notifications/catalogue.ts)).
- Docs expire after 90 days via a Firestore **TTL policy** on `expires_at`.
- Clients may only read / mark-read / delete their own notifications;
  creates are denied in rules (Cloud Functions bypass rules).
- The bell ([NotificationBell.tsx](../src/components/notifications/NotificationBell.tsx))
  streams the latest 30 via `onSnapshot`.
- Members can opt out of emails: toggle on their own profile page
  (`email_notifications` on the member doc; unset means opted in).
- `sendMemberInvitation` uses the same Brevo helper (Mailjet removed).

## Brevo setup (one-time, console)

1. Create a Brevo account (free: 300 emails/day).
2. Senders & IPs → add + verify sender `inkuthazoburialclub@gmail.com`.
3. Settings → SMTP & API → create a **v3 API key**.
4. `firebase functions:secrets:set BREVO_API_KEY`
5. `functions/.env`: `APP_URL=https://<deployed-portal-host>` (used for
   email CTA links; not a secret).
6. Enable the TTL policy:
   ```bash
   gcloud firestore fields ttls update expires_at \
     --collection-group=notifications --enable-ttl
   ```

## Deploy

```bash
firebase deploy --only firestore   # rules + the (user_id, created_at) index
firebase deploy --only functions
```

## Verification checklist

For each event, perform the real UI action and confirm: (a) a
`notifications` doc with the expected deterministic id, (b) the bell
updates live, (c) the email arrives, (d) no email when the member set
`email_notifications: false`, (e) replaying the trigger creates no
duplicate.

- Approve + reject a contribution (Contributions page)
- Approve + reject a claim
- Credit: approve, reject, request info, settle via final payment
- Donation: single review + bulk approve
- Approve a pending member (welcome email)
- `hostingReminder`: run via `firebase functions:shell` → `hostingReminder()`

## Arrears notices (admin-triggered)

Members page → **Arrears Notices** button (requires the `members.view`
permission — the same one that grants access to the page, so DC members can send notices). The modal computes members in arrears client-side (same
`collectArrearsData` logic as the arrears report), shows each member with
months owed and total, lets the admin select recipients, and calls the
`sendArrearsNotices` callable. The function re-checks the caller's
permission against `roles/{token.role}`, resolves each recipient's email
**server-side** from the member document (it cannot be used as an open
relay), sends a statement email (table of unpaid months + total), and
writes an in-app `arrears_notice` notification (deduped per member per
day). Statements are account notices and are sent regardless of the
member's `email_notifications` preference. Per-member failures are
reported back in the modal; max 100 notices per call.

## Limits & notes

- Brevo free tier: 300/day. Bulk donation approvals send one email per
  donation; fine at club scale. Every send is logged.
- Gmail-sender emails show "via brevo.com" — cosmetic; goes away if the
  club adds a custom domain later (then consider Resend).
- Phase 2 (FCM web push) is specced in the enhancement plan: service
  worker + VAPID key, tokens in `members/{uid}/fcm_tokens`, fan-out added
  inside `notify()`.
