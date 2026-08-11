"use server";

import { logAuditEvent } from "@/lib/audit/log-event";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "crypto";

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function uploadEvidenceAction(formData: FormData) {
  const subscriptionId = String(formData.get("subscriptionId") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    redirect(
      `/dashboard/subscriptions/${subscriptionId}?error=${encodeURIComponent("Choose a file to upload.")}`
    );
  }

  const { supabase, user } = await requireUser();

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("id", subscriptionId)
    .eq("user_id", user.id)
    .single();

  if (!subscription) {
    redirect("/dashboard");
  }

  const evidenceId = randomUUID();
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const storagePath = `${user.id}/${subscriptionId}/${evidenceId}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await supabase.storage
    .from("evidence")
    .upload(storagePath, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) {
    redirect(
      `/dashboard/subscriptions/${subscriptionId}?error=${encodeURIComponent(uploadError.message)}`
    );
  }

  const evidenceType =
    file.type.startsWith("image/") ? "screenshot" : "document";

  const { data: evidence, error: insertError } = await supabase
    .from("evidence")
    .insert({
      id: evidenceId,
      user_id: user.id,
      subscription_id: subscriptionId,
      evidence_type: evidenceType,
      storage_path: storagePath,
      description: description || null,
    })
    .select("id")
    .single();

  if (insertError || !evidence) {
    redirect(
      `/dashboard/subscriptions/${subscriptionId}?error=${encodeURIComponent(insertError?.message ?? "Could not save evidence record.")}`
    );
  }

  await logAuditEvent(supabase, {
    userId: user.id,
    action: "evidence_uploaded",
    entityType: "evidence",
    entityId: evidence.id,
    metadata: { subscription_id: subscriptionId },
  });

  revalidatePath(`/dashboard/subscriptions/${subscriptionId}`);
  redirect(`/dashboard/subscriptions/${subscriptionId}?evidence=uploaded`);
}

export async function flagChargeAfterCancelAction(formData: FormData) {
  const subscriptionId = String(formData.get("subscriptionId") ?? "");
  const { supabase, user } = await requireUser();
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("subscriptions")
    .update({
      status: "payment_detected_after_cancel",
      updated_at: now,
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
    action: "payment_detected_after_cancel",
    entityType: "subscription",
    entityId: subscriptionId,
  });

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/subscriptions/${subscriptionId}`);
  redirect(`/dashboard/subscriptions/${subscriptionId}?flagged=1`);
}

export async function getEvidenceSignedUrl(storagePath: string) {
  const { supabase, user } = await requireUser();
  if (!storagePath.startsWith(`${user.id}/`)) {
    return null;
  }
  const { data } = await supabase.storage
    .from("evidence")
    .createSignedUrl(storagePath, 3600);
  return data?.signedUrl ?? null;
}

export async function getCancellationTimeline(subscriptionId: string) {
  const { supabase, user } = await requireUser();

  const { data: requests } = await supabase
    .from("cancellation_requests")
    .select("id, status, user_approved_at, requested_at, completed_at, failure_reason, created_at")
    .eq("subscription_id", subscriptionId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const requestIds = (requests ?? []).map((r) => r.id);

  let attempts: {
    id: string;
    cancellation_request_id: string;
    method: string;
    result: string;
    attempted_at: string;
    response_notes: string | null;
  }[] = [];

  if (requestIds.length > 0) {
    const { data } = await supabase
      .from("cancellation_attempts")
      .select("id, cancellation_request_id, method, result, attempted_at, response_notes")
      .in("cancellation_request_id", requestIds)
      .order("attempted_at", { ascending: true });
    attempts = data ?? [];
  }

  const { data: evidence } = await supabase
    .from("evidence")
    .select("id, evidence_type, description, storage_path, created_at")
    .eq("subscription_id", subscriptionId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  return { requests: requests ?? [], attempts, evidence: evidence ?? [] };
}
