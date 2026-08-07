# NEXT_STEPS.md — Ordered Backlog

Work top to bottom. Check items off as completed. See AGENTS.md for rules
and conventions before starting.

Status as of Aug 7, 2026 (Day 1 complete): Supabase schema live with RLS,
Next.js scaffold with Magic Link auth, protected `/dashboard`, and a
read-only subscriptions list all working and building clean.

## Day 2 — Saturday, Aug 8: Manual subscription CRUD

- [ ] Build `/dashboard/subscriptions/new` — form to manually add a
      subscription (merchant name/select, subscription name, billing
      amount, currency, billing interval, trial start/end, next renewal
      date, cancellation URL, support email, notes)
- [ ] Merchant handling: let the user type a merchant name; look up an
      existing `merchants` row by name, or insert a new one if none matches
      (simple `ilike` match is fine for now — fuzzy matching is Phase 2)
- [ ] Validate: required fields, `billing_amount >= 0`, dates are valid,
      `next_renewal_at` is not required for `status = 'archived'`
- [ ] Build `/dashboard/subscriptions/[id]` — detail/edit page
- [ ] Add archive action (sets `status = 'archived'`, doesn't delete)
- [ ] Add delete action (hard delete, with a confirmation step) — RLS
      already restricts this to the owning user
- [ ] Insert an `audit_events` row on create, edit, archive, and delete
      (action values like `subscription_created`, `subscription_edited`,
      `subscription_archived`, `subscription_deleted`)
- [ ] Compute and display annualized cost per subscription (monthly × 12,
      quarterly × 4, weekly × 52, annual as-is)

## Day 3 — Sunday, Aug 9: Cancellation core

- [ ] Build cancellation detail view at
      `/dashboard/subscriptions/[id]/cancel`
- [ ] Generate a cancellation message draft (merchant name, subscription
      name, account email, requested cancellation — template text is fine,
      doesn't need to be AI-generated yet)
- [ ] Explicit approval step: user must click "Approve and prepare" before
      anything is marked as sent — this creates the `cancellation_requests`
      row with `status = 'awaiting_approval'`, then `approved` once
      confirmed, and sets `user_approved_at`
- [ ] Copy-to-clipboard action for the generated message
- [ ] Optional "mark as sent via email" action that creates a
      `cancellation_attempts` row (`method = 'email'`, `result = 'sent'`)
- [ ] Status transition logic: `active` → `cancellation_requested` when a
      request is created; user can later mark `cancellation_submitted`,
      `cancellation_confirmed`, or `cancellation_failed`
- [ ] Test the failure path: user marks a cancellation attempt as failed,
      subscription should surface a retry option, not silently disappear

## Day 4 — Monday, Aug 10: Evidence and audit trail

- [ ] Create a private Supabase Storage bucket for evidence (e.g.
      `evidence`), not public
- [ ] Add Storage RLS-equivalent policies: users can only read/write
      objects under `{auth.uid()}/...` — write this as a migration in
      `supabase/migrations/`, don't configure it only via dashboard
- [ ] Build evidence upload UI on the subscription detail page (confirmation
      screenshots, emails, receipts)
- [ ] Insert `evidence` rows with `storage_path` matching the
      `{user_id}/{subscription_id}/{evidence_id}.ext` convention from the
      dossier
- [ ] Build a chronological cancellation timeline component combining
      `cancellation_requests`, `cancellation_attempts`, and `evidence` for
      one subscription
- [ ] Add a "flag charge after cancellation" action that sets
      `status = 'payment_detected_after_cancel'` and logs an audit event

## Day 5 — Tuesday, Aug 11: Reminders and dashboard value

- [ ] Add reminder scheduling: when a subscription is created/edited with a
      `next_renewal_at`, create `notifications` rows for 7-day, 3-day, and
      24-hour marks (`notification_type` values already defined in the
      schema)
- [ ] Build a Supabase Edge Function (or documented cron job spec if no
      Edge Function deploy access in this environment) that runs hourly,
      finds due notifications, and sends email via the chosen provider —
      if no email provider credentials are available, stub the send and
      log it, and flag for the human to wire up Resend/Postmark
- [ ] Add reminder preferences (per-subscription mute/snooze)
- [ ] Add dashboard summary cards: monthly recurring spend, annual
      recurring spend, renewals in next 7 days, subscriptions needing
      attention
- [ ] Add a "needs attention" filter/badge (trial ending soon, renewal
      approaching, failed cancellation)

## Day 6 — Wednesday, Aug 12: Product polish and safety

- [ ] Mobile-responsive pass on all pages
- [ ] Empty, loading, and error states everywhere data is fetched
- [ ] Confirmation dialogs before archive/delete/cancel actions
- [ ] Account deletion flow (deletes the `auth.users` row and cascades per
      the FK constraints already in place; confirm cascade behavior matches
      expectations before shipping this)
- [ ] Data export (JSON or CSV of the user's subscriptions + cancellation
      history)
- [ ] Add `/privacy` and `/terms` pages (placeholder copy is fine, flag for
      human legal review before public launch)
- [ ] Basic auth request throttling beyond the client-side 30s cooldown
      already in `/login` — check Supabase's built-in rate limits first
      before building custom throttling

## Day 7 — Thursday, Aug 13: Beta rehearsal

- [ ] Manual test pass: realistic subscription, expired trial, canceled
      trial, duplicate cancellation attempt, evidence upload/download,
      reminder timing, malformed date/amount input, logout/reconnect
- [ ] Test RLS directly: confirm user A cannot read/write user B's rows for
      every table (a quick script using two test accounts is fine)
- [ ] Deploy to Vercel production
- [ ] Update Supabase Site URL / Redirect URLs to include the production
      domain (flag for human if Management API credentials aren't
      available)
- [ ] Write onboarding instructions for beta testers

## Day 8 — Friday, Aug 14: Private beta

- [ ] Ship to 5–10 invited users (human-managed, not an agent task)
- [ ] Confirm error monitoring is capturing issues (Sentry or equivalent —
      flag for human if no monitoring account is connected)

---

## Phase 2 — Aug 15–18: Bank/card monitoring (do not start until Day 8 is done)

See `docs/PRODUCT_DOSSIER.md` § "Phase 2 Timeline: Aug 15–18" and
§ "Phase 2 Financial Schema" for full detail before starting any of this.
High-level sequence:

- [ ] Aug 15: financial-provider connection (Plaid or equivalent),
      `financial_connections` / `financial_accounts` tables + RLS
- [ ] Aug 16: transaction ingestion, `transactions` table + RLS, webhook
      handling, incremental sync
- [ ] Aug 17: recurring-charge detection, `recurring_patterns` /
      `subscription_matches` tables + RLS, review queue UI — never
      auto-confirm a match, the user must accept it
- [ ] Aug 18: financial dashboard section, price-change alerts,
      post-cancellation transaction flags, disconnect-and-delete workflow,
      cross-account RLS testing, release to beta users

Do not begin virtual-card work (see dossier § "Virtual Card Track") without
explicit human sign-off — it requires a card-issuing provider relationship
that isn't part of this codebase's scope yet.
