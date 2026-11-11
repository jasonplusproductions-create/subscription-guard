-- S5: price-change history.
-- Append-only record of every time a subscription's billing_amount changed,
-- written by the subscription edit action and by CSV import. This is history
-- only: subscriptions.billing_amount stays the current price, and
-- subscriptions.status stays the only source of truth for state.
-- RLS ships with the table in this same migration.
-- Apply with: supabase db push

create table if not exists public.subscription_price_changes (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  old_amount numeric,
  new_amount numeric not null,
  currency text not null default 'USD',
  changed_at timestamptz not null default now(),
  source text not null default 'manual_edit',
  created_at timestamptz not null default now(),
  constraint subscription_price_changes_source_check
    check (source in ('manual_edit', 'csv_import', 'manual'))
);

create index if not exists subscription_price_changes_subscription_idx
  on public.subscription_price_changes (subscription_id, changed_at desc);

create index if not exists subscription_price_changes_user_idx
  on public.subscription_price_changes (user_id, changed_at desc);

alter table public.subscription_price_changes enable row level security;

drop policy if exists "subscription_price_changes_own" on public.subscription_price_changes;

create policy "subscription_price_changes_own"
on public.subscription_price_changes for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
