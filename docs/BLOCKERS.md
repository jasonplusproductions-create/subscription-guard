# What's blocking progress

Living checklist of gates between the current codebase and each release.
Update as items clear.

---

## Right now — Launch 1 local & beta (you)

These block **using the app yourself** and **shipping to beta testers**:

| Blocker | Who | What to do |
|---------|-----|------------|
| **Merged code on your machine** | You | Clone fresh or `git fetch` + `checkout main` from GitHub (see README). Old folder had no `origin` / no `main`. |
| **`.env.local` publishable key** | You | Supabase → API → anon key into `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |
| **Supabase Auth redirect URLs** | You | Dashboard → Auth → Site URL + `http://localhost:3000/auth/callback` and `/**` |
| **Migrations not applied** | You | `npm run db:push` (Supabase CLI logged in) — evidence bucket, reminder columns, delete-account RPC |
| **Manual test pass (Day 7)** | You | Walk through add sub → cancel → evidence per `docs/BETA_ONBOARDING.md` |
| **Vercel deploy + prod URLs** | You | Import repo; set env vars; add `*.vercel.app` to Supabase redirects |
| **Cron env for reminders** | You | Vercel: `CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`; optional Resend for real email |
| **Legal review** | You | `/privacy` and `/terms` are placeholders |
| **Beta invites (Day 8)** | You | 5–10 users; not an agent task |
| **Error monitoring** | You | Sentry or equivalent — optional but recommended before beta |

**Nothing in this list requires new app features** — configuration and ops.

---

## Launch 2 — Bank/card monitoring (Aug 15–18 scope)

| Blocker | Who | What to do |
|---------|-----|------------|
| **Plaid (or equivalent) credentials** | You | `PLAID_CLIENT_ID`, `PLAID_SECRET`, sandbox → production |
| **Transaction sync + webhooks** | Engineering | Code not built yet (`NEXT_STEPS.md` Aug 16–18) |
| **Launch 1 stable in production** | You + users | Real usage before financial linking |

Schema migration exists; `/dashboard/financial` is a placeholder until Plaid is wired.

---

## Phase 3 — Virtual cards (Cloaked Pay–style, per-subscription)

| Blocker | Who | What to do |
|---------|-----|------------|
| **Card-issuing partner** | You | Run `docs/PHASE3_ISSUER_EVALUATION.md`; sign program agreement |
| **KYC/AML + production approval** | You + issuer | Weeks to months; parallel with Launch 2 evaluation only |
| **Human sign-off** | You | Required by `AGENTS.md` before production issuing code |
| **Launch 2 shipped** | Product | Dependency in scope doc — detection before protection |

Schema stub exists; `/dashboard/phase3` is a placeholder. **No amount of app code unblocks this without an issuer.**

---

## Phase 4 & Ultimate

| Blocker | Why |
|---------|-----|
| Phase 4 browser automation | Needs Phase 3 stable + real cancellation-attempt data |
| AI concierge, household, inbox | Needs Launch 1–2 usage data; privacy/consent design |
| Merchant intelligence network | Needs scale of real cancellation attempts |

---

## Summary

**Code is ahead of deployment.** Launch 1 is merged; the critical path is:

1. Local env + migrations + Auth URLs  
2. Vercel + production Supabase URLs + cron secrets  
3. Manual QA → beta users  
4. Then Plaid for Launch 2  
5. Then issuer partnership for Phase 3 (Cloaked-style cards)

The single biggest **product** blocker for virtual cards is **not engineering** — it is **choosing and approving a card issuer program**.
