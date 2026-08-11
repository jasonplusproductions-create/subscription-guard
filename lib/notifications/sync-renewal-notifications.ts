import type { SupabaseClient } from "@supabase/supabase-js";

const REMINDER_TYPES = [
  { type: "renewal_7_days", daysBefore: 7 },
  { type: "renewal_3_days", daysBefore: 3 },
  { type: "renewal_24_hours", daysBefore: 1 },
] as const;

export async function syncRenewalNotifications(
  supabase: SupabaseClient,
  params: {
    userId: string;
    subscriptionId: string;
    nextRenewalAt: string | null;
    muted?: boolean;
  }
): Promise<void> {
  await supabase
    .from("notifications")
    .delete()
    .eq("subscription_id", params.subscriptionId)
    .eq("user_id", params.userId)
    .in("notification_type", REMINDER_TYPES.map((r) => r.type))
    .is("sent_at", null);

  if (params.muted || !params.nextRenewalAt) {
    return;
  }

  const renewal = new Date(params.nextRenewalAt);
  if (Number.isNaN(renewal.getTime())) return;

  const rows = REMINDER_TYPES.map(({ type, daysBefore }) => {
    const scheduled = new Date(renewal);
    scheduled.setDate(scheduled.getDate() - daysBefore);
    return {
      user_id: params.userId,
      subscription_id: params.subscriptionId,
      notification_type: type,
      scheduled_for: scheduled.toISOString(),
      status: scheduled.getTime() > Date.now() ? "scheduled" : "skipped",
    };
  }).filter((r) => r.status === "scheduled");

  if (rows.length > 0) {
    await supabase.from("notifications").insert(rows);
  }
}
