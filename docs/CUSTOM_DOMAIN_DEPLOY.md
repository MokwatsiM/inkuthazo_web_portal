# Deploying with a Hostinger domain on Vercel

This app is a **static SPA** — React/Vite compiles to plain HTML/CSS/JS, and
the entire backend (database, auth, storage, functions) is **Firebase**, on
Google's infrastructure. So "hosting" only means serving the built files, and
Vercel's free tier does that well (global CDN, automatic HTTPS, deploy on
git push). Your Hostinger VPS isn't needed for this; the value you're
unlocking here is your **own domain** on top of Vercel.

> Buy/keep the VPS for something that actually needs a server (a database, a
> custom API). Serving static files is not that.

---

## One-time repo setup (already done)

- **`vercel.json`** adds an SPA rewrite so deep links (e.g.
  `/auth/verify-email`, `/members/:id`) and page refreshes resolve to
  `index.html` instead of 404ing. Commit it.

---

## Step 1 — Connect the repo to Vercel (if not already)

1. Push your code to GitHub (you already deploy from CI, so this is done).
2. vercel.com → **Add New → Project** → import the repo.
3. Framework preset: **Vite**. Build command `npm run build`, output dir
   `dist` (Vercel auto-detects these).
4. **Environment variables** — add every `VITE_*` key from your `.env`
   (Vercel dashboard → Project → Settings → Environment Variables), for the
   **Production** (and Preview) environments:
   - `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`,
     `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`,
     `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`,
     `VITE_FIREBASE_MEASUREMENT_ID`
   - `VITE_RECAPTCHA_SITE_KEY` (App Check), `VITE_ENVIRONMENT=production`
   - **Do NOT** set `VITE_USE_EMULATORS` (leave unset — production must never
     point at emulators).
5. Deploy. Confirm the app works on the `*.vercel.app` URL first.

---

## Step 2 — Add your Hostinger domain to Vercel

1. Vercel → Project → **Settings → Domains → Add** → enter your domain
   (e.g. `inkuthazo.co.za` and `www.inkuthazo.co.za`).
2. Vercel shows the DNS records it needs. You have two ways to satisfy them —
   pick **one**:

   **Option 1 — Point DNS records at Vercel (keep DNS at Hostinger):**
   In Hostinger → **Domains → your domain → DNS / Nameservers → Manage DNS
   records**, add what Vercel shows, typically:
   - Apex/root `@`: an **A record → `76.76.21.21`** (Vercel's IP; use the
     exact value Vercel displays).
   - `www`: a **CNAME → `cname.vercel-dns.com`**.
   Delete any conflicting existing `A`/`CNAME` for `@`/`www` (e.g. Hostinger
   parking records).

   **Option 2 — Use Vercel nameservers (Vercel manages all DNS):**
   In Hostinger → Domains → **Nameservers → Change** → enter the two
   `nsX.vercel-dns.com` servers Vercel lists. Simpler long-term, but Vercel
   then controls all DNS for the domain (email MX records etc. must be
   re-added in Vercel).

   For just this app, **Option 1** is usually least disruptive.
3. Back in Vercel, wait for the domain to show **Valid Configuration**
   (DNS can take minutes to a few hours). HTTPS (Let's Encrypt) is issued
   automatically — no cert work.

---

## Step 3 — Tell Firebase about the new domain (REQUIRED)

Google sign-in and any auth popup will break on the new domain until it's
authorized:

1. Firebase console → **Authentication → Settings → Authorized domains →
   Add domain** → add your apex and `www` (e.g. `inkuthazo.co.za`,
   `www.inkuthazo.co.za`). Keep `localhost` for dev.
2. If **App Check** is enforced: Google Cloud Console → reCAPTCHA → ensure the
   site key's allowed domains include the new domain (+ `www`), or App Check
   will reject Firestore/Storage/Functions calls from production.
3. Redeploy is not needed for these — they're console settings — but
   hard-refresh after DNS + HTTPS are live.

---

## Step 4 — Update anything that references the old URL

- **Functions `APP_URL`** (email links): `functions/.env` has
  `APP_URL=...`. Set it to your new domain (`https://inkuthazo.co.za`) so the
  branded verification / notice emails link to the right place, then
  `firebase deploy --only functions`.
- Any hardcoded `*.vercel.app` references in docs/config → the new domain.

---

## From here on

- **Deploys stay automatic:** push to your default branch → Vercel builds and
  ships. Same as before, now on your domain with HTTPS.
- **Preview URLs:** every PR still gets a `*.vercel.app` preview; those
  previews also need to be in Firebase Authorized domains if you test auth on
  them (or add the wildcard the Vercel preview uses).

## Why not the VPS for this?

A VPS would mean **you** own: OS patching, nginx config, Let's Encrypt cert
renewal, firewall, uptime, and the deploy pipeline — to serve static files a
CDN already serves faster and for free. It doesn't reduce Firebase cost or
make the app "self-hosted" (the backend is still Firebase). If you later want
true VPS hosting anyway (control, learning, avoiding Vercel), the path is
nginx + a Let's Encrypt cert + an rsync-over-SSH deploy — ask and I'll write
that guide, but it's strictly more maintenance for this workload.
