# Send due renewal reminders

Automated via **Vercel Cron** → `GET /api/cron/send-reminders` (daily, 14:00 UTC).
The Vercel plan this app deploys on allows only daily cron jobs, so the
schedule is `0 14 * * *` rather than hourly. A 7-day or 3-day reminder is
unaffected; a 24-hour reminder can fire up to ~24 hours early. If the account
moves to a plan that allows hourly crons, change `vercel.json` back to
`0 * * * *`.

## Required server env vars (Vercel / hosting)

| Variable | Purpose |
|----------|---------|
| `CRON_SECRET` | Random string; Vercel sends `Authorization: Bearer <CRON_SECRET>` |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only; processes all users' due notifications |
| `NEXT_PUBLIC_SUPABASE_URL` | Already required for the app |
| `RESEND_API_KEY` | Optional — sends real email when set |
| `REMINDER_FROM_EMAIL` | Optional — verified sender in Resend |

Without Resend, due notifications are marked `stub_logged` (logged once, not retried).

## Local test

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/send-reminders
```

## Behavior

1. Select `notifications` where `scheduled_for <= now()`, `sent_at` is null, `status = scheduled`
2. Skip subscriptions that are archived, muted, or snoozed
3. Send email via Resend when configured; otherwise stub-log
4. Set `sent_at` and update `status` (`sent` or `stub_logged`)

## Alternative: Supabase Edge Function

`supabase/functions/send-reminders/` remains a stub. Prefer the Next.js cron route
when deploying on Vercel (`vercel.json` cron schedule included).

## Supabase pg_cron (optional)

You can alternatively invoke the same HTTP endpoint from pg_cron with the
`CRON_SECRET` header if not using Vercel Cron.
