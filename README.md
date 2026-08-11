# Subscription Guard — Day 1 Scaffold

## Continuing this build with Cursor or Cline

This repo is set up so an agentic coding tool can pick up the remaining
work with full context — no need to re-explain the project each session.

- **`AGENTS.md`** — rules, stack conventions, and safety constraints the
  agent must follow (Cursor reads `.cursorrules`, Cline reads
  `.clinerules` — both just point here so there's one source of truth)
- **`NEXT_STEPS.md`** — the ordered backlog, Day 2 through the Aug 18
  Phase 2 release, as checkboxes
- **`docs/PRODUCT_DOSSIER.md`** — full product spec and schema reference

**To use it:**
1. Open this folder in Cursor, or open it and start a Cline task in VS
   Code.
2. Say something like: *"Read AGENTS.md and NEXT_STEPS.md, then start on
   the first unchecked item."*
3. The agent will work one backlog item at a time, run type-check + build
   after each, check items off, and stop to summarize before continuing —
   per the rules in `.cursorrules` / `.clinerules`.

It will **not** do three things without asking you first, by design: touch
anything requiring the Supabase service-role key, add scope marked
"deferred" in the dossier, or build anything that contacts a merchant
without a human-approval step. Those are hard-coded stops, not
suggestions — if the agent asks you about one of these, that's the system
working correctly.

---


Auth + protected dashboard, wired to the live `subscription_guard` Supabase
project (`iaxokwbqerodpbsmnxfh`). Schema and RLS are already applied.

## 1. Install and run locally

```bash
npm install
npm run setup:env   # creates .env.local from .env.example — add your keys
npm run dev
```

Visit `http://localhost:3000`. Fill in `.env.local` with the Supabase
**publishable key** (safe to expose — RLS protects data, not key secrecy).

### Automated checks

```bash
npm run verify      # typecheck + lint + build (same as CI)
npm run db:push     # apply supabase/migrations (requires Supabase CLI + login)
```

GitHub Actions runs `npm run verify` on every push/PR to `main`.

### Automated reminders (production)

Hourly Vercel Cron calls `/api/cron/send-reminders`. Set these **server-only**
env vars in Vercel: `CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, and optionally
`RESEND_API_KEY` + `REMINDER_FROM_EMAIL`. See `docs/REMINDER_CRON_SPEC.md`.

**Not automated (by design):** merchant cancellation submission — always
requires explicit user approval in the app.

## 2. One manual step: Supabase Auth dashboard settings

The MCP tools available to Claude can create tables and run migrations,
but Auth provider settings and redirect URLs are dashboard-only. Do this
once, in the Supabase dashboard for `subscription_guard`
(Authentication → URL Configuration / Providers):

**URL Configuration**
- Site URL: `http://localhost:3000` for now (swap to your Vercel URL at
  deploy time)
- Redirect URLs (add all of these):
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/**`
  - `https://<your-vercel-app>.vercel.app/auth/callback`
  - `https://<your-vercel-app>.vercel.app/**`

**Providers → Email**
- Enable "Email" provider
- Turn **off** "Enable password sign-in" if you want Magic-Link-only
  (the app itself never renders a password field either way)
- Keep "Confirm email" on

That's it — no OTP fallback, no social login, per the Day 1 plan.

## 3. What's working right now

- `/` — landing page
- `/login` — Magic Link request form, with a client-side 30s cooldown
  and a friendlier message if Supabase's own rate limit fires
- `/auth/callback` — exchanges the emailed code for a session; sends
  expired/invalid links back to `/login?error=link_expired_or_invalid`
  instead of failing silently
- `/dashboard` — protected by `middleware.ts` (redirects signed-out
  users to `/login`); reads `profiles` and `subscriptions` through RLS
  under the signed-in user's session
- A new `auth.users` row automatically creates a matching `profiles`
  row via a Postgres trigger (`handle_new_user`)

## 4. What's next (Day 2 per the dossier)

- Manual subscription create/edit/archive form
- Merchant picker/creation
- Dashboard summary cards (monthly/annual totals, renewals in 7 days)
- Status filters

## 5. Deploying

```bash
git init
git add .
git commit -m "Day 1: auth + protected dashboard"
```

Push to GitHub, then import into Vercel. In Vercel's project settings,
add the same two env vars from `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`), and update the Supabase Site
URL / Redirect URLs to include the resulting `*.vercel.app` domain.

## 6. Security notes already baked in

- RLS is enabled on every user-owned table; `merchants` is shared
  reference data readable by any authenticated user
- `cancellation_attempts` and `audit_events` are insert-only from the
  client (no update/delete policies) — append-only by design
- Service-role key is intentionally **not** in this repo. Only add it
  as a server-only env var when you build something that needs it
  (e.g. a scheduled reminder job)
- Supabase security advisor is clean as of this scaffold
