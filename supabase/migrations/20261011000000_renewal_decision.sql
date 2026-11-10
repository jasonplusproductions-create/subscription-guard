-- Renewal decision (S2): the user's stated intent for the next renewal.
-- Deliberately separate from subscriptions.status, which stays the only
-- source of truth for current state. Recording "cancel" here never contacts
-- a merchant; it only points the user to the approval-gated cancel flow.
-- No new table, so existing subscriptions RLS (owner select/update) applies.
-- Apply with: supabase db push

alter table subscriptions
add column if not exists renewal_decision text not null default 'undecided';

alter table subscriptions
add column if not exists renewal_decision_at timestamptz;

alter table subscriptions
drop constraint if exists subscriptions_renewal_decision_check;

alter table subscriptions
add constraint subscriptions_renewal_decision_check
check (renewal_decision in ('undecided', 'keep', 'cancel'));
