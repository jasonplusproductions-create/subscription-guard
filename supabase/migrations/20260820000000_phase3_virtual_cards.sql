-- Phase 3: virtual card / payment protection schema (stub)
-- Requires card-issuing partner before production use.
-- See docs/ULTIMATE_FEATURES_SCOPE.md § Phase 3.

create table if not exists public.virtual_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subscription_id uuid not null references public.subscriptions(id) on delete cascade,
  issuer_provider text not null,
  issuer_card_id text,
  status text not null default 'pending_issuance',
  merchant_restriction text,
  max_charge_amount numeric,
  max_payments integer,
  frozen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (subscription_id)
);

alter table public.virtual_cards enable row level security;

create policy "virtual_cards_own"
on public.virtual_cards for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  virtual_card_id uuid references public.virtual_cards(id) on delete set null,
  provider_event_id text not null,
  amount numeric not null,
  currency text default 'USD',
  decision text not null,
  merchant_descriptor text,
  occurred_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (provider_event_id)
);

alter table public.payment_events enable row level security;

create policy "payment_events_own"
on public.payment_events for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
