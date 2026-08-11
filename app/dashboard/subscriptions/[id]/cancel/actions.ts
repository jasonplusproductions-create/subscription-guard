"use server";

import { logAuditEvent } from "@/lib/audit/log-event";
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

async function requireOwnedSubscription(subscriptionId: string) {
  const { supabase, user } = await requireUser();
  const { data: subscription, error } = await supabase
    .from("subscriptions")
    .select("id, name, status, merchant_id, merchants(name)")
    .eq("id", subscriptionId)
    .eq("user_id", user.id)
    .single();

  if (error || !subscription) {
    redirect("/dashboard");
  }

  return { supabase, user, subscription };
}

export async function approveCancellationRequest(
  subscriptionId: string,
  messageBody: string
) {
  const { supabase, user, subscription } =
    await requireOwnedSubscription(subscriptionId);

  const now = new Date().toISOString();

  const { data: request, error: requestError } = await supabase
    .from("cancellation_requests")
    .insert({
      subscription_id: subscriptionId,
      user_id: user.id,
      status: "approved",
      method: "email",
      user_approved_at: now,
      requested_at: now,
    })
    .select("id")
    .single();

  if (requestError || !request) {
    redirect(
      `/dashboard/subscriptions/${subscriptionId}/cancel?error=${encodeURIComponent(requestError?.message ?? "Could not create cancellation request.")}`
    );
  }

  await supabase.from("cancellation_attempts").insert({
    cancellation_request_id: request.id,
    method: "email",
    message_body: messageBody,
    result: "prepared",
    attempted_at: now,
  });

  await supabase
    .from("subscriptions")
    .update({
      status: "cancellation_requested",
      updated_at: now,
    })
    .eq("id", subscriptionId)
    .eq("user_id", user.id);

  await logAuditEvent(supabase, {
    userId: user.id,
    action: "cancellation_approved",
    entityType: "cancellation_request",
    entityId: request.id,
    metadata: { subscription_id: subscriptionId },
  });

  revalidatePath(`/dashboard/subscriptions/${subscriptionId}`);
  revalidatePath(`/dashboard/subscriptions/${subscriptionId}/cancel`);
  redirect(
    `/dashboard/subscriptions/${subscriptionId}/cancel?approved=1`
  );
}

export async function markCancellationSentAction(formData: FormData) {
  const subscriptionId = String(formData.get("subscriptionId") ?? "");
  const requestId = String(formData.get("requestId") ?? "");
  const messageBody = String(formData.get("messageBody") ?? "");
  const { supabase, user } = await requireUser();
  const now = new Date().toISOString();

  const { data: request } = await supabase
    .from("cancellation_requests")
    .select("id")
    .eq("id", requestId)
    .eq("subscription_id", subscriptionId)
    .eq("user_id", user.id)
    .single();

  if (!request) {
    redirect(
      `/dashboard/subscriptions/${subscriptionId}/cancel?error=${encodeURIComponent("Cancellation request not found.")}`
    );
  }

  await supabase.from("cancellation_attempts").insert({
    cancellation_request_id: requestId,
    method: "email",
    message_body: messageBody,
    result: "sent",
    attempted_at: now,
  });

  await supabase
    .from("cancellation_requests")
    .update({ status: "in_progress", updated_at: now })
    .eq("id", requestId);

  await supabase
    .from("subscriptions")
    .update({
      status: "cancellation_submitted",
      updated_at: now,
    })
    .eq("id", subscriptionId)
    .eq("user_id", user.id);

  await logAuditEvent(supabase, {
    userId: user.id,
    action: "cancellation_marked_sent",
    entityType: "cancellation_request",
    entityId: requestId,
  });

  revalidatePath(`/dashboard/subscriptions/${subscriptionId}`);
  redirect(`/dashboard/subscriptions/${subscriptionId}/cancel?sent=1`);
}

export async function updateCancellationStatusAction(formData: FormData) {
  const subscriptionId = String(formData.get("subscriptionId") ?? "");
  const requestId = String(formData.get("requestId") ?? "");
  const newStatus = String(formData.get("newStatus") ?? "");
  const { supabase, user } = await requireUser();
  const now = new Date().toISOString();

  const allowed = [
    "cancellation_submitted",
    "cancellation_confirmed",
    "cancellation_failed",
  ] as const;

  if (!allowed.includes(newStatus as (typeof allowed)[number])) {
    redirect(
      `/dashboard/subscriptions/${subscriptionId}/cancel?error=${encodeURIComponent("Invalid status.")}`
    );
  }

  await supabase
    .from("subscriptions")
    .update({ status: newStatus, updated_at: now })
    .eq("id", subscriptionId)
    .eq("user_id", user.id);

  const requestStatus =
    newStatus === "cancellation_confirmed"
      ? "completed"
      : newStatus === "cancellation_failed"
        ? "failed"
        : "in_progress";

  await supabase
    .from("cancellation_requests")
    .update({
      status: requestStatus,
      updated_at: now,
      ...(newStatus === "cancellation_confirmed"
        ? { completed_at: now }
        : {}),
      ...(newStatus === "cancellation_failed"
        ? { failure_reason: "User reported cancellation attempt failed" }
        : {}),
    })
    .eq("id", requestId)
    .eq("user_id", user.id);

  if (newStatus === "cancellation_failed") {
    await supabase.from("cancellation_attempts").insert({
      cancellation_request_id: requestId,
      method: "email",
      result: "failed",
      response_notes: "User marked attempt as failed",
      attempted_at: now,
    });
  }

  if (newStatus === "cancellation_confirmed") {
    await supabase.from("cancellation_attempts").insert({
      cancellation_request_id: requestId,
      method: "email",
      result: "confirmed",
      attempted_at: now,
    });
  }

  await logAuditEvent(supabase, {
    userId: user.id,
    action: "cancellation_status_updated",
    entityType: "subscription",
    entityId: subscriptionId,
    metadata: { status: newStatus },
  });

  revalidatePath(`/dashboard/subscriptions/${subscriptionId}`);
  redirect(`/dashboard/subscriptions/${subscriptionId}/cancel`);
}

export async function getCancellationPageData(subscriptionId: string) {
  const { supabase, user } = await requireUser();

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("id, name, status, merchant_id, merchants(name, cancellation_url)")
    .eq("id", subscriptionId)
    .eq("user_id", user.id)
    .single();

  if (!subscription) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", user.id)
    .single();

  const { data: requests } = await supabase
    .from("cancellation_requests")
    .select("id, status, user_approved_at, created_at, failure_reason")
    .eq("subscription_id", subscriptionId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const latestRequest = requests?.[0] ?? null;

  let attempts: {
    id: string;
    result: string;
    attempted_at: string;
    response_notes: string | null;
  }[] = [];

  if (latestRequest) {
    const { data } = await supabase
      .from("cancellation_attempts")
      .select("id, result, attempted_at, response_notes")
      .eq("cancellation_request_id", latestRequest.id)
      .order("attempted_at", { ascending: false });
    attempts = data ?? [];
  }

  const merchantRaw = subscription.merchants;
  const merchant =
    merchantRaw &&
    !Array.isArray(merchantRaw) &&
    typeof merchantRaw === "object" &&
    "name" in merchantRaw
      ? {
          name: String((merchantRaw as { name: string }).name),
          cancellation_url:
            "cancellation_url" in merchantRaw
              ? ((merchantRaw as { cancellation_url: string | null })
                  .cancellation_url ?? null)
              : null,
        }
      : { name: "Merchant", cancellation_url: null };

  return {
    subscription,
    merchant,
    accountEmail: profile?.email ?? user.email ?? "",
    latestRequest,
    attempts,
  };
}
