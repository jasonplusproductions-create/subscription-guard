"use server";

import { logAuditEvent } from "@/lib/audit/log-event";
import {
  POST_CANCEL_NOTIFICATION_TYPES,
  isPostCancelStatus,
  schedulePostCancelFollowUps,
} from "@/lib/notifications/post-cancel-followups";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

/**
 * The user checked their statement and no charge appeared.
 * Dismisses the pending post-cancel follow-ups for this subscription (or the
 * single one named in the form). Never touches `subscriptions.status`.
 */
export async function confirmNoChargeAction(formData: FormData) {
  const subscriptionId = String(formData.get("subscriptionId") ?? "");
  const notificationId = String(formData.get("notificationId") ?? "").trim();
  const { supabase, user } = await requireUser();
  const now = new Date().toISOString();

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("id, status")
    .eq("id", subscriptionId)
    .eq("user_id", user.id)
    .single();

  if (!subscription) redirect("/dashboard");

  if (notificationId) {
    await supabase
      .from("notifications")
      .update({ status: "skipped", sent_at: now })
      .eq("id", notificationId)
      .eq("user_id", user.id)
      .eq("subscription_id", subscriptionId)
      .in("notification_type", POST_CANCEL_NOTIFICATION_TYPES);
  } else {
    await supabase
      .from("notifications")
      .update({ status: "skipped", sent_at: now })
      .eq("user_id", user.id)
      .eq("subscription_id", subscriptionId)
      .in("notification_type", POST_CANCEL_NOTIFICATION_TYPES)
      .eq("status", "scheduled");
  }

  await logAuditEvent(supabase, {
    userId: user.id,
    action: "post_cancel_charge_check_cleared",
    entityType: "subscription",
    entityId: subscriptionId,
    metadata: { notification_id: notificationId || null },
  });

  revalidatePath("/dashboard/reminders");
  revalidatePath(`/dashboard/subscriptions/${subscriptionId}`);
  redirect(`/dashboard/subscriptions/${subscriptionId}?checked=1`);
}

/**
 * Make sure the 7-day and 30-day charge checks exist for a subscription that
 * was already cancelled before this shipped.
 */
export async function schedulePostCancelChecksAction(formData: FormData) {
  const subscriptionId = String(formData.get("subscriptionId") ?? "");
  const { supabase, user } = await requireUser();

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("id, status")
    .eq("id", subscriptionId)
    .eq("user_id", user.id)
    .single();

  if (!subscription || !isPostCancelStatus(subscription.status)) {
    redirect(`/dashboard/subscriptions/${subscriptionId}`);
  }

  await schedulePostCancelFollowUps(supabase, {
    userId: user.id,
    subscriptionId,
  });

  await logAuditEvent(supabase, {
    userId: user.id,
    action: "post_cancel_monitoring_scheduled",
    entityType: "subscription",
    entityId: subscriptionId,
    metadata: { source: "manual" },
  });

  revalidatePath("/dashboard/reminders");
  revalidatePath(`/dashboard/subscriptions/${subscriptionId}`);
  redirect(`/dashboard/subscriptions/${subscriptionId}?checks=scheduled`);
}
