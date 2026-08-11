/**
 * Prefer the Next.js cron route: GET /api/cron/send-reminders
 * See docs/REMINDER_CRON_SPEC.md
 */
export async function processDueNotifications(): Promise<void> {
  console.log(
    "[send-reminders edge stub] Deploy /api/cron/send-reminders on Vercel instead."
  );
}
