# Subscription Guard — Product Dossier

This is the authoritative product and architecture reference for this repo.
`AGENTS.md` and `NEXT_STEPS.md` summarize and operationalize this; if they
ever conflict, treat the "Non-Negotiable Safety Principle" section below as
overriding, and flag the conflict to a human rather than guessing.

## Project Summary

Subscription Guard is a consumer subscription-protection app. It helps users
discover recurring charges, track free trials and renewals, prepare and
document cancellations, and monitor for charges after cancellation.

The long-term product vision combines:

- Existing bank and credit-card monitoring
- Trial and renewal tracking
- Human-approved cancellation assistance
- Evidence and audit history
- Post-cancellation charge monitoring
- Merchant-specific virtual cards and payment controls

### Product Promise

> Find every recurring charge, warn users before renewal, and help them
> prove when they canceled.

A future branded action may be: **"Separate me from this subscription."**

---

## Current Launch Strategy

### Launch 1 — Friday, August 14, 2026

Private beta MVP. Target 5–10 initial users, not a public launch.

**Include:** Supabase Magic Link authentication, manual subscription entry,
merchant records, subscription dashboard, monthly/annual cost calculations,
renewal reminders, human-in-the-loop cancellation assistance, cancellation
requests and attempts, evidence uploads, audit history, post-cancellation
charge flagging, account deletion and basic data export.

**Do NOT include in Launch 1:** OTP fallback, bank connections, virtual-card
issuing, automatic card freezing, autonomous browser cancellation, automatic
refunds or disputes, usage tracking, household accounts, native mobile apps.

### Launch 2 — Tuesday, August 18, 2026

Add bank and credit-card monitoring as a controlled beta feature: financial
account connection, historical transaction import, incremental sync,
transaction webhooks, recurring-charge detection, likely-subscription review
queue, subscription matching/merging, price-change alerts, post-cancellation
charge detection, CSV import fallback, disconnect-and-delete workflow.

**Do not promise production virtual cards by August 18.** Virtual-card
issuing requires a regulated provider, issuer/program setup, KYC/AML review,
sandbox testing, and authorization webhooks.

---

## Non-Negotiable Safety Principle

**Cancellation must remain human-in-the-loop.**

The app must not automatically submit merchant cancellation forms without
explicit user authorization. The user must review and approve the
cancellation action before the app sends an email, submits a form, or
contacts a merchant.

The first release should generate cancellation instructions and messages,
then allow the user to copy or send them. Fully autonomous browser
cancellation is deferred.

**Blocking or declining a payment is never treated as equivalent to merchant
cancellation.** The product must distinguish: cancellation requested,
cancellation message prepared, cancellation submitted, cancellation
confirmed, payment blocked, payment detected after cancellation, merchant
still active.

---

## Architecture

**Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, Vercel,
Supabase Auth, Supabase Postgres, Supabase Storage, Supabase Edge Functions,
GitHub, a financial-data provider (Plaid) for Phase 2, a transactional email
provider before public launch.

Use a **modular monolith**, not microservices, for the MVP.

```
Next.js Web App
|
+-- Supabase Auth
+-- Supabase Postgres
+-- Supabase Storage
+-- Supabase Edge Functions
+-- Scheduled Jobs
|
+-- Financial Data Provider
+-- Email Provider
+-- Future Card Issuer
```

---

## Supabase Project

- Project name: `subscription_guard`
- Project ref: `iaxokwbqerodpbsmnxfh`
- Organization: `jasonplusproductions`
- Region: `us-east-1`
- Cost: $10/month
- Status: `ACTIVE_HEALTHY` as of Aug 7, 2026. Schema applied, RLS enabled,
  security advisor clean.

---

## Authentication Plan

Magic Link only for the first beta.

**Settings:** Magic Link enabled, email confirmation required, new user
registration enabled, OTP fallback deferred, password login deferred,
social login deferred, MFA deferred until after beta, Supabase email service
for testing, custom SMTP before public launch.

**Redirect URLs:**
```
http://localhost:3000/auth/callback
http://localhost:3000/**
https://<production-domain>/auth/callback
https://<production-domain>/**
```

---

## MVP Data Model

### profiles
```
id uuid primary key references auth.users(id)
email text
display_name text
timezone text default 'America/New_York'
created_at timestamptz
updated_at timestamptz
```

### merchants (shared reference data, not user-owned)
```
id uuid primary key
name text not null
website_url text
cancellation_url text
support_email text
created_at timestamptz
```
`normalized_name` intentionally excluded from Launch 1 — add during
Phase 2 bank-monitoring work.

### subscriptions (source of truth for current state)
```
id uuid primary key
user_id uuid references auth.users(id)
merchant_id uuid references merchants(id)
name text not null
status text
billing_amount numeric
currency text default 'USD'
billing_interval text
trial_start_at timestamptz
trial_end_at timestamptz
next_renewal_at timestamptz
cancellation_deadline_at timestamptz
source text default 'manual'
notes text
created_at timestamptz
updated_at timestamptz
```

Statuses: `trial`, `active`, `renewal_approaching`,
`cancellation_requested`, `cancellation_submitted`,
`cancellation_confirmed`, `cancellation_failed`,
`payment_detected_after_cancel`, `archived`.

### cancellation_requests (one workflow per user decision)
```
id uuid primary key
subscription_id uuid references subscriptions(id)
user_id uuid references auth.users(id)
status text
method text
user_approved_at timestamptz
requested_at timestamptz
completed_at timestamptz
failure_reason text
created_at timestamptz
updated_at timestamptz
```
Statuses: `draft`, `awaiting_approval`, `approved`, `in_progress`,
`completed`, `failed`, `needs_manual_action`.

### cancellation_attempts (append-only execution history)
```
id uuid primary key
cancellation_request_id uuid references cancellation_requests(id)
method text
message_body text
target_url text
result text
response_notes text
attempted_at timestamptz
```
Results: `prepared`, `sent`, `confirmed`, `rejected`, `no_response`,
`failed`. No update/delete policies — append-only by design.

### evidence
```
id uuid primary key
user_id uuid references auth.users(id)
subscription_id uuid references subscriptions(id)
evidence_type text
storage_path text
description text
created_at timestamptz
```
Path convention: `{user_id}/{subscription_id}/{evidence_id}.ext`.

### notifications
```
id uuid primary key
user_id uuid references auth.users(id)
subscription_id uuid references subscriptions(id)
notification_type text
scheduled_for timestamptz
sent_at timestamptz
status text
created_at timestamptz
```
Types: `renewal_7_days`, `renewal_3_days`, `renewal_24_hours`,
`renewal_detected`, `payment_after_cancellation`.

### audit_events (immutable system history)
```
id uuid primary key
user_id uuid references auth.users(id)
action text
entity_type text
entity_id uuid
metadata jsonb default '{}'
created_at timestamptz
```
No update/delete policies — immutable by design.

---

## Source-of-Truth Rules

- **subscriptions** = current user-facing state
- **cancellation_requests** = user-authorized workflow
- **cancellation_attempts** = append-only execution history
- **evidence** = proof and supporting records
- **audit_events** = immutable system-wide history

The dashboard reads `subscriptions.status` directly. It never infers current
state by reconciling cancellation requests and attempts.

---

## RLS and Security

Enable Row Level Security on every user-owned table. Core policy pattern:
`auth.uid() = user_id` (or, for child tables like `cancellation_attempts`,
via an `exists (...)` check against the parent's `user_id`).

- Never expose the service-role key to the browser or commit it to the repo
- Store provider tokens only server-side and encrypted
- Never store raw card numbers, CVVs, or bank passwords
- Use short-lived signed URLs for evidence files
- Verify webhook signatures; make webhook handlers idempotent
- Add authentication request throttling; add CAPTCHA before public launch
- Support user data export and account deletion
- Run the Supabase security advisor after every schema change
- Test that two users cannot see one another's data

---

## Phase 2 Financial Schema

### financial_connections
```
id, user_id, provider, provider_item_id, encrypted_access_token,
institution_name, status, last_synced_at, created_at, updated_at
```

### financial_accounts
```
id, user_id, connection_id, provider_account_id, account_name,
account_type, account_mask, currency, is_active, created_at
```

### transactions
```
id, user_id, financial_account_id, provider_transaction_id (unique),
merchant_name_raw, merchant_name_normalized, amount, currency,
transaction_date, pending, category, raw_data_hash, created_at, updated_at
```

### recurring_patterns
```
id, user_id, merchant_name, frequency, average_amount, last_charge_at,
predicted_next_charge_at, confidence_score, status, created_at, updated_at
```

### subscription_matches
```
id, recurring_pattern_id, subscription_id, confidence_score, match_status,
confirmed_at
```

**Recurring detection score (explainable, first version):**
- +30 same merchant
- +25 repeated interval
- +20 similar amount
- +15 three or more occurrences
- +10 recognized subscription category

Never silently create a confirmed subscription from a bank transaction — the
user must accept the match.

---

## Virtual Card Track

Begin provider evaluation in parallel with Phase 2, but do not promise
production delivery on any fixed date without explicit human sign-off.

Tasks: identify a suitable issuer/program provider, confirm U.S. consumer
eligibility, review KYC/AML responsibilities, obtain sandbox credentials,
test virtual-card creation and authorization webhooks, define freeze/
terminate/decline semantics, determine merchant-specific card feasibility.

Virtual-card integration is a separate financial-infrastructure release, not
merely another application feature.

---

## Definition of Done: Launch 1

1. Sign in with a Magic Link
2. Add a subscription manually
3. See monthly and annual cost
4. Receive a renewal reminder
5. Generate a cancellation request
6. Approve the cancellation message
7. Record an attempt
8. Upload confirmation evidence
9. View a complete timeline
10. Flag a post-cancellation charge
11. Delete the subscription or account
12. Access no other user's data

## Definition of Done: Aug 18 Release

1. Connect a supported financial account
2. Import historical transactions
3. Receive incremental transaction updates
4. See likely recurring charges
5. Confirm or reject matches
6. Merge a match with an existing subscription
7. See price-change alerts
8. See post-cancellation charge flags
9. Disconnect the account
10. Delete imported financial data

---

## Explicitly Deferred

OTP fallback, full autonomous cancellation agent, browser automation,
automatic refunds, automatic disputes, virtual-card issuing, automatic
payment blocking, household mode, usage-based cancellation, native mobile
apps, merchant intelligence network.

---

## Success Metrics

**Launch 1:** Magic Link success rate, time to add first subscription,
percentage of users who add at least one subscription, cancellation
workflow completion rate, evidence-upload completion rate, reminder open
rate, number of confirmed cancellations, support requests per user, RLS/
security test pass rate.

**Aug 18:** financial connection completion rate, transactions imported per
account, recurring-detection precision, false-positive rate, match-
confirmation rate, sync failure rate, price changes detected, post-
cancellation charges detected.
