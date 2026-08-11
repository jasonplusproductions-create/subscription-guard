-- Per-subscription reminder preferences (Day 5)
-- Apply with: supabase db push

alter table subscriptions
add column if not exists reminders_muted boolean not null default false;

alter table subscriptions
add column if not exists reminders_snoozed_until timestamptz;
