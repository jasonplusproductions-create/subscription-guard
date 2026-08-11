import { sendReminderEmail } from "@/lib/email/send-reminder-email";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ProcessRemindersResult = {
  processed: number;
  sent: number;
  stubbed: number;
  skipped: number;
  errors: string[];
};

type DueNotification = {
  id: string;
  user_id: string;
  subscription_id: string;
  notification_type: string;
  scheduled_for: string;
};

export async function processDueReminders(
  supabase: SupabaseClient
): Promise<ProcessRemindersResult> {
  const now = new Date().toISOString();
  const result: ProcessRemindersResult = {
    processed: 0,
    sent: 0,
    stubbed: 0,
    skipped: 0,
    errors: [],
  };

  const { data: due, error } = await supabase
    .from("notifications")
    .select("id, user_id, subscription_id, notification_type, scheduled_for")
    .lte("scheduled_for", now)
    .is("sent_at", null)
    .eq("status", "scheduled")
    .limit(100);

  if (error) {
    result.errors.push(error.message);
    return result;
  }

  for (const row of (due ?? []) as DueNotification[]) {
    result.processed += 1;

    try {
      const skipReason = await shouldSkipReminder(supabase, row);
      if (skipReason) {
        await supabase
          .from("notifications")
          .update({
            status: "skipped",
            sent_at: now,
          })
          .eq("id", row.id);
        result.skipped += 1;
        continue;
      }

      const context = await loadReminderContext(supabase, row);
      if (!context) {
        result.errors.push(`Missing context for notification ${row.id}`);
        continue;
      }

      const sendResult = await sendReminderEmail({
        to: context.email,
        subscriptionName: context.subscriptionName,
        merchantName: context.merchantName,
        notificationType: row.notification_type,
        renewalDate: context.renewalDate,
      });

      const status = sendResult.mode === "sent" ? "sent" : "stub_logged";

      await supabase
        .from("notifications")
        .update({
          status,
          sent_at: now,
        })
        .eq("id", row.id);

      if (sendResult.mode === "sent") {
        result.sent += 1;
      } else {
        result.stubbed += 1;
        console.info(
          `[reminders] stub ${row.id}: ${sendResult.reason} → ${context.email}`
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      result.errors.push(`notification ${row.id}: ${message}`);
    }
  }

  return result;
}

async function shouldSkipReminder(
  supabase: SupabaseClient,
  row: DueNotification
): Promise<string | null> {
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("reminders_muted, reminders_snoozed_until, status")
    .eq("id", row.subscription_id)
    .single();

  if (!sub) return "subscription missing";
  if (sub.status === "archived") return "archived";
  if (sub.reminders_muted) return "muted";

  if (sub.reminders_snoozed_until) {
    const snoozedUntil = new Date(sub.reminders_snoozed_until).getTime();
    if (snoozedUntil > Date.now()) return "snoozed";
  }

  return null;
}

async function loadReminderContext(
  supabase: SupabaseClient,
  row: DueNotification
): Promise<{
  email: string;
  subscriptionName: string;
  merchantName: string;
  renewalDate: string;
} | null> {
  const [{ data: profile }, { data: subscription }] = await Promise.all([
    supabase.from("profiles").select("email").eq("id", row.user_id).single(),
    supabase
      .from("subscriptions")
      .select("name, next_renewal_at, merchants(name)")
      .eq("id", row.subscription_id)
      .single(),
  ]);

  if (!profile?.email || !subscription?.name || !subscription.next_renewal_at) {
    return null;
  }

  const merchantRaw = subscription.merchants;
  const merchantName =
    merchantRaw &&
    !Array.isArray(merchantRaw) &&
    typeof merchantRaw === "object" &&
    "name" in merchantRaw
      ? String((merchantRaw as { name: string }).name)
      : "Merchant";

  return {
    email: profile.email,
    subscriptionName: subscription.name,
    merchantName,
    renewalDate: new Date(subscription.next_renewal_at).toLocaleDateString(),
  };
}
