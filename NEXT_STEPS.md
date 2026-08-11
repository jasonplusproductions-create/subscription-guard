# NEXT_STEPS.md — Ordered Backlog

Work top to bottom. Check items off as completed. See AGENTS.md for rules
and conventions before starting. Long-term phased features beyond Launch 2
are cataloged in `docs/ULTIMATE_FEATURES_SCOPE.md`.

Status as of Aug 11, 2026: Launch 1 feature code complete through Day 6.
Migrations in `supabase/migrations/` must be applied via `supabase db push`.
Phase 2–Ultimate scaffolds and placeholder UIs are in place; external
integrations (Plaid, card issuer, email cron, Vercel deploy, beta invites)
require human credentials and review.

## Day 2 — Saturday, Aug 8: Manual subscription CRUD

- [x] Build `/dashboard/subscriptions/new` — form to manually add a
      subscription (merchant name/select, subscription name, billing
      amount, currency, billing interval, trial start/end, next renewal
      date, cancellation URL, support email, notes)
- [x] Merchant handling: let the user type a merchant name; look up an
      existing `merchants` row by name, or insert a new one if none matches
      (simple `ilike` match is fine for now — fuzzy matching is Phase 2)
- [x] Validate: required fields, `billing_amount >= 0`, dates are valid,
      `next_renewal_at` is not required for `status = 'archived'`
- [x] Build `/dashboard/subscriptions/[id]` — detail/edit page
- [x] Add archive action (sets `status = 'archived'`, doesn't delete)
- [x] Add delete action (hard delete, with a confirmation step) — RLS
      already restricts this to the owning user
- [x] Insert an `audit_events` row on create, edit, archive, and delete
      (action values like `subscription_created`, `subscription_edited`,
      `subscription_archived`, `subscription_deleted`)
- [x] Compute and display annualized cost per subscription (monthly × 12,
      quarterly × 4, weekly × 52, annual as-is)

## Day 3 — Sunday, Aug 9: Cancellation core

- [x] Build cancellation detail view at
      `/dashboard/subscriptions/[id]/cancel`
- [x] Generate a cancellation message draft (merchant name, subscription
      name, account email, requested cancellation — template text is fine,
      doesn't need to be AI-generated yet)
- [x] Explicit approval step: user must click "Approve and prepare" before
      anything is marked as sent — this creates the `cancellation_requests`
      row with `status = 'awaiting_approval'`, then `approved` once
      confirmed, and sets `user_approved_at`
- [x] Copy-to-clipboard action for the generated message
- [x] Optional "mark as sent via email" action that creates a
      `cancellation_attempts` row (`method = 'email'`, `result = 'sent'`)
- [x] Status transition logic: `active` → `cancellation_requested` when a
      request is created; user can later mark `cancellation_submitted`,
      `cancellation_confirmed`, or `cancellation_failed`
- [x] Test the failure path: user marks a cancellation attempt as failed,
      subscription should surface a retry option, not silently disappear

## Day 4 — Monday, Aug 10: Evidence and audit trail

- [x] Create a private Supabase Storage bucket for evidence (e.g.
      `evidence`), not public — migration
      `20260811000000_evidence_storage.sql`
- [x] Add Storage RLS-equivalent policies: users can only read/write
      objects under `{auth.uid()}/...` — write this as a migration in
      `supabase/migrations/`, don't configure it only via dashboard
- [x] Build evidence upload UI on the subscription detail page (confirmation
      screenshots, emails, receipts)
- [x] Insert `evidence` rows with `storage_path` matching the
      `{user_id}/{subscription_id}/{evidence_id}.ext` convention from the
      dossier
- [x] Build a chronological cancellation timeline component combining
      `cancellation_requests`, `cancellation_attempts`, and `evidence` for
      one subscription
- [x] Add a "flag charge after cancellation" action that sets
      `status = 'payment_detected_after_cancel'` and logs an audit event

## Day 5 — Tuesday, Aug 11: Reminders and dashboard value

- [x] Add reminder scheduling: when a subscription is created/edited with a
      `next_renewal_at`, create `notifications` rows for 7-day, 3-day, and
      24-hour marks (`notification_type` values already defined in the
      schema)
- [x] Build a Supabase Edge Function (or documented cron job spec if no
      Edge Function deploy access in this environment) that runs hourly,
      finds due notifications, and sends email via the chosen provider —
      stub at `supabase/functions/send-reminders/` + `docs/REMINDER_CRON_SPEC.md`
- [x] Add reminder preferences (per-subscription mute/snooze) — migration
      `20260811000001_reminder_preferences.sql`
- [x] Add dashboard summary cards: monthly recurring spend, annual
      recurring spend, renewals in next 7 days, subscriptions needing
      attention
- [x] Add a "needs attention" filter/badge (trial ending soon, renewal
      approaching, failed cancellation)

## Day 6 — Wednesday, Aug 12: Product polish and safety

- [x] Mobile-responsive pass on all pages (Tailwind responsive grids/forms)
- [x] Empty, loading, and error states everywhere data is fetched
- [x] Confirmation dialogs before archive/delete/cancel actions (checkbox
      confirm for delete; explicit approve for cancel)
- [x] Account deletion flow — RPC migration `20260811000002_delete_own_account.sql`
      + `/dashboard/settings` (verify cascade before prod)
- [x] Data export (JSON of subscriptions + cancellation history)
- [x] Add `/privacy` and `/terms` pages (placeholder copy is fine, flag for
      human legal review before public launch)
- [x] Basic auth request throttling beyond the client-side 30s cooldown
      already in `/login` — rely on Supabase built-in rate limits for beta;
      CAPTCHA deferred per dossier

## Day 7 — Thursday, Aug 13: Beta rehearsal

- [ ] Manual test pass: realistic subscription, expired trial, canceled
      trial, duplicate cancellation attempt, evidence upload/download,
      reminder timing, malformed date/amount input, logout/reconnect
- [x] Test RLS directly: confirm user A cannot read/write user B's rows for
      every table (a quick script using two test accounts is fine) —
      procedure in `docs/RLS_SMOKE_TEST.md`
- [ ] Deploy to Vercel production — human: push + env vars + Supabase URLs
- [ ] Update Supabase Site URL / Redirect URLs to include the production
      domain (flag for human if Management API credentials aren't
      available)
- [x] Write onboarding instructions for beta testers — `docs/BETA_ONBOARDING.md`

## Day 8 — Friday, Aug 14: Private beta

- [ ] Ship to 5–10 invited users (human-managed, not an agent task)
- [ ] Confirm error monitoring is capturing issues (Sentry or equivalent —
      flag for human if no monitoring account is connected)

---

## Phase 2 — Aug 15–18: Bank/card monitoring

See `docs/PRODUCT_DOSSIER.md` § "Phase 2 Timeline: Aug 15–18" and
§ "Phase 2 Financial Schema". Migration:
`supabase/migrations/20260815000000_phase2_financial_schema.sql`.
Placeholder UI: `/dashboard/financial`.

- [x] Aug 15: `financial_connections` / `financial_accounts` tables + RLS
      (migration; Plaid Link UI blocked on provider credentials)
- [ ] Aug 16: transaction ingestion, webhook handling, incremental sync
- [ ] Aug 17: recurring-charge detection, review queue UI — never
      auto-confirm a match
- [ ] Aug 18: financial dashboard (live data), price-change alerts,
      post-cancellation transaction flags, disconnect-and-delete workflow,
      cross-account RLS testing, release to beta users

---

## Phase 3 — Payment protection (virtual cards)

See `docs/ULTIMATE_FEATURES_SCOPE.md` § Phase 3. Migration:
`supabase/migrations/20260820000000_phase3_virtual_cards.sql`.
Placeholder UI: `/dashboard/phase3`.

- [x] Schema stub: `virtual_cards`, `payment_events` + RLS
- [ ] Virtual-card issuing (blocked: card-issuing partner + KYC/AML)
- [ ] Merchant/amount/frequency controls
- [ ] Card freeze / unfreeze (labeled payment blocked, not canceled)
- [ ] Authorization webhooks + payment reconciliation job

Do not begin production virtual-card work without explicit human sign-off.

---

## Phase 4 — Browser automation

See `docs/ULTIMATE_FEATURES_SCOPE.md` § Phase 4. Placeholder UI:
`/dashboard/phase4`.

- [ ] Browser extension — trial detection (explicit confirm before save)
- [ ] Browser extension — never auto-submits
- [ ] Merchant-specific cancellation playbooks
- [ ] Isolated automation workers with human approval before final submit
- [ ] Human approval for ambiguous screens

---

## Ultimate — AI concierge & differentiation

See `docs/ULTIMATE_FEATURES_SCOPE.md` and `/dashboard/ultimate`.

- [ ] AI Subscription Concierge
- [ ] Usage-based recommendations (opt-in)
- [ ] Smart savings engine
- [ ] Bill negotiation / refund drafting (draft assistant only)
- [ ] Subscription firewall rules (depends on Phase 3)
- [ ] Post-cancellation watchdog — Cancellation Verified status
- [ ] Shared household mode
- [ ] Inbox & receipt intelligence
- [ ] Universal cancellation passport (PDF)
- [ ] Emergency financial mode
- [ ] Privacy & data vault (enforce cross-cutting from Launch 1 onward)
- [ ] Merchant intelligence network

Do not begin virtual-card work (see dossier § "Virtual Card Track") without
explicit human sign-off — it requires a card-issuing provider relationship
that isn't part of this codebase's scope yet.
