import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * S8 — post-cancel monitoring.
 *
 * Once a cancellation has been handed to (or confirmed by) the merchant we
 * schedule two in-app follow-ups asking the user to check their statement for
 * a charge. These are rows in the existing `notifications` table, so no schema
 * change is needed. Nothing here contacts a merchant, and the follow-ups never
 * touch `subscriptions.status` — that stays the only source of truth.
 */

/** Statuses that mean "the cancellation is out of our hands — watch for charges". */
export const POST_CANCEL_STATUSES = [
  "cancellation_submitted",
  "cancellation_confirmed",
  "payment_detected_after_cancel",
] as const;

export type PostCancelStatus = (typeof POST_CANCEL_STATUSES)[number];

export const POST_CANCEL_FOLLOWUPS = [
  { type: "post_cancel_check_7_days", days: 7, label: "7-day charge check" },
  { type: "post_cancel_check_30_days", days: 30, label: "30-day charge check" },
] as const;

export const POST_CANCEL_NOTIFICATION_TYPES: string[] =
  POST_CANCEL_FOLLOWUPS.map((f) => f.type);

export function isPostCancelNotificationType(type: string): boolean {
  return POST_CANCEL_NOTIFICATION_TYPES.includes(type);
}

export function isPostCancelStatus(
  status: string | null | undefined
): status is PostCancelStatus {
  return (
    typeof status === "string" &&
    (POST_CANCEL_STATUSES as readonly string[]).includes(status)
  );
}

export type PostCancelFollowUp = {
  id: string;
  notificationType: string;
  scheduledFor: string;
  status: string;
  label: string;
  done: boolean;
};

function labelFor(type: string): string {
  return (
    POST_CANCEL_FOLLOWUPS.find((f) => f.type === type)?.label ??
    "Charge check"
  );
}

/**
 * Replace any pending post-cancel follow-ups for this subscription with a
 * fresh 7-day / 30-day pair measured from `from` (defaults to now).
 * Already actioned rows (sent_at set, or skipped by the user) are kept so the
 * history on the detail page does not disappear.
 */
export async function schedulePostCancelFollowUps(
  supabase: SupabaseClient,
  params: { userId: string; subscriptionId: string; from?: string }
): Promise<void> {
  await supabase
    .from("notifications")
    .delete()
    .eq("subscription_id", params.subscriptionId)
    .eq("user_id", params.userId)
    .in("notification_type", POST_CANCEL_NOTIFICATION_TYPES)
    .eq("status", "scheduled")
    .is("sent_at", null);

  const start = params.from ? new Date(params.from) : new Date();
  if (Number.isNaN(start.getTime())) return;

  const rows = POST_CANCEL_FOLLOWUPS.map(({ type, days }) => {
    const scheduled = new Date(start);
    scheduled.setDate(scheduled.getDate() + days);
    return {
      user_id: params.userId,
      subscription_id: params.subscriptionId,
      notification_type: type,
      scheduled_for: scheduled.toISOString(),
      status: "scheduled",
    };
  });

  await supabase.from("notifications").insert(rows);
}

export async function getPostCancelFollowUps(
  supabase: SupabaseClient,
  params: { userId: string; subscriptionId: string }
): Promise<PostCancelFollowUp[]> {
  const { data } = await supabase
    .from("notifications")
    .select("id, notification_type, scheduled_for, status, sent_at")
    .eq("subscription_id", params.subscriptionId)
    .eq("user_id", params.userId)
    .in("notification_type", POST_CANCEL_NOTIFICATION_TYPES)
    .order("scheduled_for", { ascending: true });

  return (data ?? []).map((row) => ({
    id: row.id,
    notificationType: row.notification_type,
    scheduledFor: row.scheduled_for,
    status: row.status,
    label: labelFor(row.notification_type),
    done: row.status !== "scheduled",
  }));
}
