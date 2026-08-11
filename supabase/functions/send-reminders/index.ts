/**
 * Hourly reminder sender — deploy as Supabase Edge Function when credentials
 * are available. Requires SUPABASE_SERVICE_ROLE_KEY and email provider
 * (Resend/Postmark) as server-only secrets.
 *
 * TODO(human): Deploy to Supabase and wire RESEND_API_KEY (or equivalent).
 * Until then, due notifications remain in `notifications` with status
 * `scheduled`; this stub logs what would be sent.
 */
export async function processDueNotifications(): Promise<void> {
  const now = new Date().toISOString();
  console.log(
    `[reminder-job stub] Would process due notifications at ${now}. Wire service-role + email provider to send.`
  );
}
