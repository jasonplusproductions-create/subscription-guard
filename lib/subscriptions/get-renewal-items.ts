import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  buildRenewalItems,
  type RenewalItem,
} from "@/lib/subscriptions/renewals";

/** Signed-in user's renewals and trial ends. RLS limits rows to the owner. */
export async function getRenewalItems(): Promise<RenewalItem[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("subscriptions")
    .select(
      "id, name, status, billing_amount, currency, next_renewal_at, trial_end_at, renewal_decision, merchants(name)",
    )
    .eq("user_id", user.id);

  return buildRenewalItems(
    (data ?? []).map((s) => {
      const m = s.merchants as { name?: string } | { name?: string }[] | null;
      const merchantName = Array.isArray(m) ? m[0]?.name ?? null : m?.name ?? null;
      return {
        id: s.id,
        name: s.name,
        status: s.status,
        billing_amount: s.billing_amount,
        currency: s.currency,
        next_renewal_at: s.next_renewal_at,
        trial_end_at: s.trial_end_at,
        renewal_decision: s.renewal_decision,
        merchantName,
      };
    }),
  );
}
