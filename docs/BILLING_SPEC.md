# Billing Spec — Stripe, one plan, $12/month

Owner-approved scope. Do not add a second price, tier, trial, coupon, or
discount. Test mode only until the owner confirms live mode.

## The plan

- Product name: `Subscription Guard`
- Price: **$12.00 USD, recurring, monthly** (`mode=subscription`)
- One price only. Create it once in Stripe and reference it by env var; never
  hardcode a price ID in the repo.

## Environment variables (server-only, never committed)

| Var | Purpose |
| --- | --- |
| `STRIPE_SECRET_KEY` | `sk_test_...` — all server-side Stripe calls |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` — webhook signature verification |
| `STRIPE_PRICE_ID` | `price_...` for the $12/month price |
| `NEXT_PUBLIC_SITE_URL` | Absolute origin for success/cancel/portal return URLs |

If any is missing, the billing routes must return a clear "billing is not
configured" error and must **not** fake a subscription, a payment, or a
success state. No mock checkouts.

## Data model — migration `supabase/migrations/<ts>_billing.sql`

New user-owned table `billing_accounts`:

```
id uuid primary key default gen_random_uuid()
user_id uuid not null unique references auth.users(id) on delete cascade
stripe_customer_id text unique
stripe_subscription_id text
billing_status text not null default 'none'
   -- none | trialing | active | past_due | canceled | incomplete
current_period_end timestamptz
cancel_at_period_end boolean not null default false
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

RLS in the **same migration**: enable RLS; a user may `select` only their own
row. No `insert`/`update`/`delete` policy for `authenticated` — rows are
written only by server code holding the service-role key (the webhook) and by
the checkout route using the user's own session for the initial insert. If you
add an insert policy, it must be `auth.uid() = user_id` and must not allow
setting `billing_status` to `active`.

Idempotency table `stripe_webhook_events`:

```
id text primary key          -- Stripe event id
type text not null
processed_at timestamptz not null default now()
```

RLS enabled, **no** policies for `authenticated` (service-role only). A webhook
event that is already in this table is a no-op.

`billing_status` is the source of truth for whether a user is subscribed.
Nothing derives it by counting invoices.

## Routes

- `POST /api/billing/checkout` — authenticated. Gets or creates the Stripe
  customer for the user, stores `stripe_customer_id`, creates a Checkout
  Session (`mode: "subscription"`, `line_items: [{ price: STRIPE_PRICE_ID,
  quantity: 1 }]`, `client_reference_id` = user id,
  `customer_email` = user email, success/cancel URLs on `NEXT_PUBLIC_SITE_URL`),
  redirects to its `url`.
- `POST /api/billing/portal` — authenticated. Creates a Billing Portal session
  for the user's customer and redirects. Cancelling happens **in the Stripe
  portal**, never by our code calling cancel directly.
- `POST /api/billing/webhook` — no session. Read the **raw body**
  (`await req.text()`), verify with `stripe.webhooks.constructEvent`, insert
  the event id into `stripe_webhook_events` (skip if present), then handle:
  - `checkout.session.completed` → link customer + subscription, set status
    from the subscription object
  - `customer.subscription.created` / `.updated` → status,
    `current_period_end`, `cancel_at_period_end`
  - `customer.subscription.deleted` → `canceled`
  - `invoice.payment_failed` → `past_due`

  Always return 2xx once the event is recorded so Stripe stops retrying.

## UI

- `/dashboard/settings` (or a new `/dashboard/billing`): current plan, billing
  status, renewal date, "Subscribe — $12/month" when `none`/`canceled`,
  "Manage billing" when subscribed. Buttons post to the two routes above.
- A public `/pricing` page stating the single $12/month plan and nothing else.
- No fake "upgrade successful" screens. The page re-reads `billing_accounts`
  from Supabase, which only the webhook writes.

## Out of scope unless the owner approves

Annual pricing, discounts, promo codes, multiple tiers, usage-based billing,
proration changes, dunning email copy, gating existing S1–S9 features behind
payment.
