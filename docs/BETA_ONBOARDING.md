# Beta tester onboarding

Welcome to the Subscription Guard private beta (Launch 1).

## Getting started

1. Visit the app and sign in with **Magic Link** (email only — no password).
2. Add subscriptions manually from **Dashboard → Add subscription**.
3. Before a renewal, you'll see reminders scheduled at 7 days, 3 days, and 24 hours
   (email delivery requires the reminder cron — see `docs/REMINDER_CRON_SPEC.md`).
4. To cancel, open a subscription → **Cancel…**, review the draft, click
   **Approve and prepare**, then send the message yourself.
5. Upload screenshots or PDFs as **evidence** on the subscription detail page.

## What we need feedback on

- Is manual entry fast enough for your subscriptions?
- Is the cancellation draft useful? What's missing?
- Do status labels (`payment detected after cancel` vs `cancellation confirmed`)
  make sense?

## Safety rules (by design)

- The app **never** submits merchant cancellation forms for you.
- A blocked or declined payment is **not** labeled as canceled.

## Support

Contact the team via your beta invite channel. Include your account email and
screenshots when reporting issues.
