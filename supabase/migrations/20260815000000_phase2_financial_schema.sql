-- Launch 2 / Phase 2 financial schema (Aug 15–18)
-- Apply with: supabase db push after Launch 1 is stable.

create table if not exists public.financial_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  provider_item_id text not null,
  encrypted_access_token text,
  institution_name text,
  status text not null default 'active',
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider, provider_item_id)
);

alter table public.financial_connections enable row level security;

create policy "financial_connections_own"
on public.financial_connections for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create table if not exists public.financial_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  connection_id uuid not null references public.financial_connections(id) on delete cascade,
  provider_account_id text not null,
  account_name text,
  account_type text,
  account_mask text,
  currency text default 'USD',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (connection_id, provider_account_id)
);

alter table public.financial_accounts enable row level security;

create policy "financial_accounts_own"
on public.financial_accounts for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  financial_account_id uuid not null references public.financial_accounts(id) on delete cascade,
  provider_transaction_id text not null,
  merchant_name_raw text,
  merchant_name_normalized text,
  amount numeric not null,
  currency text default 'USD',
  transaction_date date not null,
  pending boolean not null default false,
  category text,
  raw_data_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (financial_account_id, provider_transaction_id)
);

alter table public.transactions enable row level security;

create policy "transactions_own"
on public.transactions for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create table if not exists public.recurring_patterns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  merchant_name text not null,
  frequency text,
  average_amount numeric,
  last_charge_at timestamptz,
  predicted_next_charge_at timestamptz,
  confidence_score numeric,
  status text not null default 'pending_review',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.recurring_patterns enable row level security;

create policy "recurring_patterns_own"
on public.recurring_patterns for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create table if not exists public.subscription_matches (
  id uuid primary key default gen_random_uuid(),
  recurring_pattern_id uuid not null references public.recurring_patterns(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  confidence_score numeric,
  match_status text not null default 'suggested',
  created_at timestamptz not null default now(),
  unique (recurring_pattern_id, subscription_id)
);

alter table public.subscription_matches enable row level security;

create policy "subscription_matches_own"
on public.subscription_matches for all
to authenticated
using (
  exists (
    select 1 from public.recurring_patterns rp
    where rp.id = subscription_matches.recurring_pattern_id
    and rp.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.recurring_patterns rp
    where rp.id = subscription_matches.recurring_pattern_id
    and rp.user_id = auth.uid()
  )
);
