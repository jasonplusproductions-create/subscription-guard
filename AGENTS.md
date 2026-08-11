# AGENTS.md — Instructions for Cursor / Cline / any coding agent

You are continuing work on **Subscription Guard**, already scaffolded through
Day 1 of an 8-day build. Read this whole file before touching code. Then read
`NEXT_STEPS.md` for the exact backlog, in order.

## What this product is

A consumer app that tracks subscriptions and trials, warns users before
renewal, helps them cancel with a documented evidence trail, and watches for
charges after cancellation. Full product spec, phased roadmap, and schema
rationale live in `docs/PRODUCT_DOSSIER.md` — read it before making any
product decision not covered by this file or `NEXT_STEPS.md`. Phased
features beyond Launch 2 are cataloged in `docs/ULTIMATE_FEATURES_SCOPE.md`.

## Non-negotiable rules (do not "improve" these away)

1. **Cancellation stays human-in-the-loop.** Never write code that submits a
   merchant cancellation form, sends a cancellation email, or takes any
   external action without an explicit user-approval step recorded first.
   This applies even if a task description seems to imply automation — check
   `docs/PRODUCT_DOSSIER.md` § "Non-Negotiable Safety Principle" and ask the
   human before building anything that contacts a merchant automatically.
2. **Declining/blocking a payment is never labeled "canceled."** Keep
   `payment_detected_after_cancel` and `cancellation_confirmed` as visibly
   distinct states in any UI you build.
3. **`subscriptions.status` is the only source of truth for current state.**
   Never derive dashboard state by reconciling `cancellation_attempts` or
   `audit_events` — those are append-only history, not current state. See
   "Source-of-Truth Rules" in the dossier.
4. **Every user-owned table needs RLS.** If you add a table, add RLS
   policies in the same migration. Run the Supabase security advisor
   mentally (or via `supabase db lint` / dashboard) before considering a
   migration done.
5. **Never commit or hardcode the Supabase service-role key.** Only the
   publishable key belongs in this repo (`.env.local`, gitignored). If a
   task needs the service-role key (e.g. a scheduled reminder job), stop and
   flag it for the human to supply as a server-only secret — do not invent a
   workaround.
6. **Don't touch scope explicitly marked deferred.** Virtual cards, bank
   auto-freeze, autonomous browser cancellation, OTP fallback, social login,
   and household mode are out of scope until their explicitly scheduled
   phase. Check `NEXT_STEPS.md` before adding a feature that isn't listed.

## Stack and conventions already in place

- Next.js 14 **App Router**, TypeScript, Tailwind. Don't switch to Pages
  Router or introduce a second styling system.
- Supabase Auth (**Magic Link only** — no password, no OTP code fallback,
  no social login for the beta).
- Supabase client pattern: `lib/supabase/client.ts` (browser) and
  `lib/supabase/server.ts` (Server Components / Route Handlers), following
  the current `@supabase/ssr` cookie-forwarding pattern. Reuse these, don't
  create a third client helper.
- `middleware.ts` already handles session refresh and route protection
  (`/dashboard/*` requires auth, `/login` bounces authenticated users to
  `/dashboard`). Extend the matcher/logic here rather than adding ad hoc
  auth checks in every page.
- Server Actions for mutations where reasonable (see `signOut` in
  `app/dashboard/page.tsx` for the pattern), Route Handlers for the OAuth
  callback style flows.
- Styling: Tailwind utility classes inline, color tokens `ink` / `paper` /
  `accent` from `tailwind.config.ts`. Keep new UI visually consistent with
  `app/page.tsx` and `app/login/page.tsx` rather than inventing a new look.

## Supabase project (already live — do not recreate)

- Project ref: `iaxokwbqerodpbsmnxfh`, name `subscription_guard`, region
  `us-east-1`, org `jasonplusproductions`.
- Schema is already applied: `profiles`, `merchants`, `subscriptions`,
  `cancellation_requests`, `cancellation_attempts`, `evidence`,
  `notifications`, `audit_events`, all with RLS. Full column-level detail is
  in `docs/PRODUCT_DOSSIER.md` § "MVP Data Model" — treat that as the
  authoritative schema reference, and `supabase/migrations/` (once you add
  migration files here) as the executable source of truth going forward.
- If you have Supabase CLI access, link with
  `supabase link --project-ref iaxokwbqerodpbsmnxfh` before running new
  migrations locally, then apply with `supabase db push`. If you don't have
  CLI/DB credentials in this environment, write the migration SQL to
  `supabase/migrations/<timestamp>_<name>.sql` and tell the human to apply
  it — do not guess at connection strings or fabricate credentials.
- One manual dashboard step is still pending (Supabase doesn't expose Auth
  provider config over the client-side API): confirming Site URL and the
  four redirect URLs, and disabling password sign-in. Instructions are in
  `README.md` § 2. If you can complete this via the Supabase Management API
  with credentials the human provides, ask for a Personal Access Token
  rather than assuming one exists.

## Working style for this repo

- Small, testable increments. After each task in `NEXT_STEPS.md`, run
  `npm run build` and `npx tsc --noEmit` — both must pass clean before
  moving to the next task. This repo has been kept at zero type errors and
  zero build warnings since Day 1; don't regress that.
- Update `NEXT_STEPS.md` checkboxes as you complete items so progress is
  visible across sessions.
- If a task in `NEXT_STEPS.md` is ambiguous, prefer the most conservative
  reading consistent with the non-negotiable rules above, and leave a
  `// TODO(human):` comment rather than guessing on anything security- or
  privacy-relevant.
- Don't add new dependencies without a clear reason — this stack is
  intentionally minimal (`@supabase/ssr`, `@supabase/supabase-js`, Next,
  React, Tailwind). If a task genuinely needs something else (e.g. a date
  library, a queue client for Phase 2), that's fine — just don't reach for
  a heavy framework change.
