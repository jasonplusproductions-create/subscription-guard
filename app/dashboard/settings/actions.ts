"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function exportUserDataAction() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [subscriptions, cancellationRequests, evidence, auditEvents] =
    await Promise.all([
      supabase.from("subscriptions").select("*").eq("user_id", user.id),
      supabase
        .from("cancellation_requests")
        .select("*")
        .eq("user_id", user.id),
      supabase.from("evidence").select("*").eq("user_id", user.id),
      supabase.from("audit_events").select("*").eq("user_id", user.id),
    ]);

  const payload = {
    exported_at: new Date().toISOString(),
    user_id: user.id,
    email: user.email,
    subscriptions: subscriptions.data ?? [],
    cancellation_requests: cancellationRequests.data ?? [],
    evidence: evidence.data ?? [],
    audit_events: auditEvents.data ?? [],
  };

  return JSON.stringify(payload, null, 2);
}

export async function deleteAccountAction(formData: FormData) {
  const confirmed = formData.get("confirmDeleteAccount") === "yes";
  if (!confirmed) {
    redirect("/dashboard/settings?error=confirm_required");
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Cascades per FK constraints on auth.users — verify in Supabase before prod.
  const { error } = await supabase.rpc("delete_own_account");
  if (error) {
    // Fallback: sign out and flag for human if RPC not deployed
    redirect(
      `/dashboard/settings?error=${encodeURIComponent("Account deletion requires the delete_own_account RPC migration. Contact support.")}`
    );
  }

  await supabase.auth.signOut();
  redirect("/?deleted=1");
}
