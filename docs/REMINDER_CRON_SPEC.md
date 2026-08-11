# Send due renewal reminders (stub)

Deploy when `SUPABASE_SERVICE_ROLE_KEY` and an email provider are available.

## Schedule

Run hourly via Supabase Cron or external scheduler:

```sql
-- Example cron (enable pg_cron in Supabase dashboard first):
-- select cron.schedule('send-reminders', '0 * * * *', ...);
```

## Behavior

1. Select `notifications` where `scheduled_for <= now()` and `sent_at` is null
2. Skip subscriptions with `reminders_muted = true` or active snooze
3. Send email via Resend/Postmark
4. Set `sent_at` and `status = 'sent'`

Until deployed, notifications rows are created on subscription create/edit
and remain `scheduled`.
