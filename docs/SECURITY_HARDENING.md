# Security Hardening — the right protection for this stack

## Why not Cloudflare

The instinct (add a layer of protection against malicious attacks) is correct.
The target is wrong for this architecture:

- **Frontend:** a static SPA on **Vercel**, which already provides a global
  CDN, automatic HTTPS/TLS, HTTP/3, and DDoS protection at the edge.
- **Backend:** entirely **Firebase** (Firestore, Auth, Storage, Functions).
  The browser talks to `*.googleapis.com` / `*.firebaseapp.com` **directly** —
  Cloudflare in front of your domain never sees these requests and cannot
  protect them.

So Cloudflare's WAF / rate-limiting / bot protection would guard only static
HTML/JS that Vercel already fronts — while your real attack surface (data,
auth, uploads) sits on Firebase where Cloudflare has no visibility. The
protection that matters for this app is **Firebase-side**, below.

## Current posture (already good)

- Firestore rules: no open `allow ... if true`; permission-catalogue model.
- Storage rules present and owner/permission scoped.
- App Check wired in code (reCAPTCHA v3), auto-refresh on.
- Secrets via `defineSecret` (`BREVO_API_KEY`) — no hardcoded keys.
- Every Cloud Function callable checks `context.auth` and re-checks permission.
- Rules tests exist (27 cases across members/contributions/payouts/audit_logs/
  notifications).

The gaps are mostly **enforcement toggles in the Firebase console** and a few
small verifications — not new code.

---

## Priority 1 — Enforce App Check (the single biggest win)

App Check is initialized in the app but only *attests* requests; it stops
nothing until you **enforce** it per service in the console. Enforcing it means
Firestore/Storage/Functions reject any request that doesn't come from your real
app (blocks scripted abuse, scraping, and direct API hammering — the closest
thing to a "WAF" for a Firebase backend).

Steps (Firebase console → **App Check**):
1. Confirm your web app is registered with the **reCAPTCHA v3** provider and
   the site key matches `VITE_RECAPTCHA_SITE_KEY`.
2. Under **APIs**, watch the **request metrics** for Firestore, Storage, and
   Cloud Functions for ~a week in *unenforced* mode — confirm the bulk of
   traffic is "verified".
3. Then switch each to **Enforced**: Firestore, Storage, Authentication (if
   available), and Cloud Functions.
4. Ensure production and `localhost` domains are on the reCAPTCHA key, and the
   **dev debug token** is registered (App Check → Manage debug tokens) so local
   dev keeps working — the app already prints one in dev.

> Do NOT enforce before confirming verified traffic in metrics, or you can lock
> out real users mid-session.

## Priority 2 — Firebase Authentication protections

Firebase console → **Authentication → Settings**:
1. **Email enumeration protection** — ON (unless you turned it off for the
   "link same email" flow; if so, that's a deliberate trade-off). Prevents
   attackers probing which emails are registered.
2. **Password policy** — enforce a minimum length/complexity for the
   email/password provider.
3. **Authorized domains** — confirm ONLY your real domains are listed
   (`portal.inkuthazo.co.za`, the `*.vercel.app` you use, `localhost`). Remove
   anything stale.
4. **Blocking functions / abuse:** Firebase Auth has built-in rate limits;
   optionally enable **SMS/email quotas** alerts. Consider **reCAPTCHA
   Enterprise for Auth** if you see credential-stuffing.

## Priority 3 — Lock down the reCAPTCHA / App Check key domains

Google Cloud console → **reCAPTCHA**:
- The site key's **allowed domains** should list only your production domain,
  the Vercel preview host if you test auth there, and `localhost`. A key that
  accepts `*` is effectively no protection.

## Priority 4 — Scheduled Firestore backups (protection against loss/ransom)

Security includes recovering from a bad actor or a bad deploy that destroys
data. Enable **Firestore scheduled backups**:
- Firebase/GCP console → Firestore → **Backups** → create a backup schedule
  (daily, e.g. 7–30 day retention). This is cheap and the highest-value
  "what if data is deleted" safeguard. (Referenced in the enhancement plan §5.)

## Priority 5 — Widen rules test coverage, keep it in CI

Rules are your actual firewall; tests are how you keep them correct.
- Current tests cover 5 collections. Add cases for the sensitive ones not yet
  covered: **claims, credits, donations, dependants (in members), storage
  paths** — especially "a member cannot read another member's private
  documents" and "a pending member cannot read payouts/others' contributions".
- `npm run test:rules` already runs in CI; keep it a required check.

## Priority 6 — Security headers on the frontend (defense in depth)

Add HTTP security headers via `vercel.json` so the static app resists common
browser-side attacks (clickjacking, MIME sniffing, referrer leakage). A
Content-Security-Policy is the strongest but must be tuned to Firebase/Brevo
origins — do it carefully and test, or start with the safe subset:

```jsonc
// vercel.json — add alongside the existing "rewrites"
"headers": [
  {
    "source": "/(.*)",
    "headers": [
      { "key": "X-Content-Type-Options", "value": "nosniff" },
      { "key": "X-Frame-Options", "value": "DENY" },
      { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
      { "key": "Permissions-Policy", "value": "camera=(self), geolocation=()" },
      { "key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains" }
    ]
  }
]
```

(Leave CSP for a dedicated pass — a wrong CSP silently breaks Firebase/Google
sign-in.)

## Priority 7 — Operational hygiene

- **Rotate the exposed Mailjet keys** (they're in git history from the old
  code) at Mailjet, even though the code no longer uses them.
- **`serviceAccountKey.json`** — confirm it's gitignored and never committed;
  it grants full admin access.
- **Dependency audits** — CI already runs `npm audit`; keep react-router and
  others patched as fixes land.
- **Least privilege for roles** — periodically review the `roles/*` permission
  maps so no role has more than it needs.

---

## What this buys you vs. Cloudflare

| Concern | Cloudflare (proxy in front of Vercel) | This plan |
|---|---|---|
| DDoS / TLS / CDN on frontend | Duplicates Vercel | Already covered by Vercel |
| Abuse of your database/API | **Cannot see Firebase** | **App Check enforcement** |
| Credential stuffing / account probing | No | **Auth protections** |
| Data loss / destructive action | No | **Scheduled backups** |
| Rules regressions | No | **Rules tests in CI** |
| Browser-side attacks | Partial | **Security headers** |

The right security investment for a Firebase-backed SPA is Firebase-side
enforcement + backups + rules tests — not a CDN in front of static files.
```
