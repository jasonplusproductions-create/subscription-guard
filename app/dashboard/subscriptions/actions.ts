"use server";

import { logAuditEvent } from "@/lib/audit/log-event";
import { findOrCreateMerchant, getMerchant } from "@/lib/merchants/find-or-create";
import { syncRenewalNotifications } from "@/lib/notifications/sync-renewal-notifications";
import { parseRenewalDecision } from "@/lib/subscriptions/renewal-decision";
import {
  formDataToInput,
  validateSubscriptionForm,
} from "@/lib/subscriptions/validation";
import { createClient } from "@/lib/supabase/server";
import type { SubscriptionStatus } from "@/lib/types/subscription";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type ActionState = { error?: string } | undefined;

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function createSubscription(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  const validated = validateSubscriptionForm(formDataToInput(formData));
  if (!validated.ok) return { error: validated.error };

  const d = validated.data;
  const merchantId = await findOrCreateMerchant(supabase, d.merchantName, {
    cancellationUrl: d.cancellationUrl,
    supportEmail: d.supportEmail,
  });

  const initialStatus: SubscriptionStatus =
    d.trialEndAt && new Date(d.trialEndAt) > new Date() ? "trial" : d.status;

  const { data: subscription, error } = await supabase
    .from("subscriptions")
    .insert({
      user_id: user.id,
      merchant_id: merchantId,
      name: d.name,
      status: initialStatus,
      billing_amount: d.billingAmount,
      currency: d.currency,
      billing_interval: d.billingInterval,
      trial_start_at: d.trialStartAt,
      trial_end_at: d.trialEndAt,
      next_renewal_at: d.nextRenewalAt,
      notes: d.notes,
      source: "manual",
    })
    .select("id")
    .single();

  if (error || !subscription) {
    return { error: error?.message ?? "Could not create subscription." };
  }

  await logAuditEvent(supabase, {
    userId: user.id,
    action: "subscription_created",
    entityType: "subscription",
    entityId: subscription.id,
    metadata: { name: d.name, merchant: d.merchantName },
  });

  await syncRenewalNotifications(supabase, {
    userId: user.id,
    subscriptionId: subscription.id,
    nextRenewalAt: d.nextRenewalAt,
  });

  revalidatePath("/dashboard");
  redirect(`/dashboard/subscriptions/${subscription.id}`);
}

export async function updateSubscription(
  subscriptionId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { supabase, user } = await requireUser();

  const { data: existing } = await supabase
    .from("subscriptions")
    .select("id, merchant_id, status")
    .eq("id", subscriptionId)
    .eq("user_id", user.id)
    .single();

  if (!existing) {
    return { error: "Subscription not found." };
  }

  const validated = validateSubscriptionForm(
    formDataToInput(formData, existing.status as SubscriptionStatus)
  );
  if (!validated.ok) return { error: validated.error };

  const d = validated.data;
  const merchantId = await findOrCreateMerchant(supabase, d.merchantName, {
    cancellationUrl: d.cancellationUrl,
    supportEmail: d.supportEmail,
  });

  const { error } = await supabase
    .from("subscriptions")
    .update({
      merchant_id: merchantId,
      name: d.name,
      status: d.status,
      billing_amount: d.billingAmount,
      currency: d.currency,
      billing_interval: d.billingInterval,
      trial_start_at: d.trialStartAt,
      trial_end_at: d.trialEndAt,
      next_renewal_at: d.nextRenewalAt,
      notes: d.notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", subscriptionId)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  await logAuditEvent(supabase, {
    userId: user.id,
    action: "subscription_edited",
    entityType: "subscription",
    entityId: subscriptionId,
    metadata: { name: d.name },
  });

  const { data: prefs } = await supabase
    .from("subscriptions")
    .select("reminders_muted")
    .eq("id", subscriptionId)
    .single();

  await syncRenewalNotifications(supabase, {
    userId: user.id,
    subscriptionId,
    nextRenewalAt: d.nextRenewalAt,
    muted: prefs?.reminders_muted ?? false,
  });

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/subscriptions/${subscriptionId}`);
  return undefined;
}

export async function archiveSubscriptionAction(formData: FormData) {
  const subscriptionId = String(formData.get("subscriptionId") ?? "");
  const { supabase, user } = await requireUser();

  const { error } = await supabase
    .from("subscriptions")
    .update({
      status: "archived",
      updated_at: new Date().toISOString(),
    })
    .eq("id", subscriptionId)
    .eq("user_id", user.id);

  if (error) {
    redirect(
      `/dashboard/subscriptions/${subscriptionId}?error=${encodeURIComponent(error.message)}`
    );
  }

  await logAuditEvent(supabase, {
    userId: user.id,
    action: "subscription_archived",
    entityType: "subscription",
    entityId: subscriptionId,
  });

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/subscriptions/${subscriptionId}`);
  redirect("/dashboard");
}

export async function deleteSubscriptionAction(formData: FormData) {
  const subscriptionId = String(formData.get("subscriptionId") ?? "");
  const confirmed = formData.get("confirmDelete") === "yes";

  if (!confirmed) {
    redirect(
      `/dashboard/subscriptions/${subscriptionId}?error=${encodeURIComponent("Confirm permanent deletion before continuing.")}`
    );
  }

  const { supabase, user } = await requireUser();

  const { error } = await supabase
    .from("subscriptions")
    .delete()
    .eq("id", subscriptionId)
    .eq("user_id", user.id);

  if (error) {
    redirect(
      `/dashboard/subscriptions/${subscriptionId}?error=${encodeURIComponent(error.message)}`
    );
  }

  await logAuditEvent(supabase, {
    userId: user.id,
    action: "subscription_deleted",
    entityType: "subscription",
    entityId: subscriptionId,
  });

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function getSubscriptionForEdit(subscriptionId: string) {
  const { supabase, user } = await requireUser();

  const { data: subscription, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("id", subscriptionId)
    .eq("user_id", user.id)
    .single();

  if (error || !subscription) {
    return null;
  }

  const merchant = await getMerchant(supabase, subscription.merchant_id);

  return { subscription, merchant };
}

export async function toggleRemindersMutedAction(formData: FormData) {
  const subscriptionId = String(formData.get("subscriptionId") ?? "");
  const { supabase, user } = await requireUser();

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("reminders_muted, next_renewal_at")
    .eq("id", subscriptionId)
    .eq("user_id", user.id)
    .single();

  if (!sub) redirect("/dashboard");

  const muted = !sub.reminders_muted;

  await supabase
    .from("subscriptions")
    .update({
      reminders_muted: muted,
      updated_at: new Date().toISOString(),
    })
    .eq("id", subscriptionId);

  await syncRenewalNotifications(supabase, {
    userId: user.id,
    subscriptionId,
    nextRenewalAt: sub.next_renewal_at,
    muted,
  });

  revalidatePath(`/dashboard/subscriptions/${subscriptionId}`);
  redirect(`/dashboard/subscriptions/${subscriptionId}`);
}

export async function snoozeRemindersAction(formData: FormData) {
  const subscriptionId = String(formData.get("subscriptionId") ?? "");
  const days = Number(formData.get("days") ?? 7);
  const { supabase, user } = await requireUser();

  const until = new Date();
  until.setDate(until.getDate() + days);

  await supabase
    .from("subscriptions")
    .update({
      reminders_snoozed_until: until.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", subscriptionId)
    .eq("user_id", user.id);

  revalidatePath(`/dashboard/subscriptions/${subscriptionId}`);
  redirect(`/dashboard/subscriptions/${subscriptionId}`);
}

/**
 * Records the user's intent for the next renewal. Never touches
 * `status` and never contacts a merchant. "cancel" only sends the user to
 * the approval-gated cancel flow.
 */
export async function setRenewalDecisionAction(formData: FormData) {
  const subscriptionId = String(formData.get("subscriptionId") ?? "");
  const decision = parseRenewalDecision(formData.get("decision"));
  const { supabase, user } = await requireUser();
  const detail = `/dashboard/subscriptions/${subscriptionId}`;

  if (!subscriptionId || !decision) {
    redirect(`${detail}?error=${encodeURIComponent("Invalid decision.")}`);
  }

  const { error } = await supabase
    .from("subscriptions")
    .update({
      renewal_decision: decision,
      renewal_decision_at:
        decision === "undecided" ? null : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", subscriptionId)
    .eq("user_id", user.id);

  if (error) {
    redirect(`${detail}?error=${encodeURIComponent(error.message)}`);
  }

  await logAuditEvent(supabase, {
    userId: user.id,
    action: "renewal_decision_set",
    entityType: "subscription",
    entityId: subscriptionId,
    metadata: { decision },
  });

  revalidatePath(detail);
  revalidatePath("/dashboard");

  if (decision === "cancel") {
    redirect(`${detail}/cancel`);
  }
  redirect(detail);
}
