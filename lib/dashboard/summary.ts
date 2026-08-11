import type { BillingInterval } from "@/lib/types/subscription";
import { annualizedCost } from "@/lib/subscriptions/annualized-cost";

export type DashboardSubscription = {
  id: string;
  name: string;
  status: string;
  billing_amount: number | null;
  currency: string | null;
  billing_interval: BillingInterval | null;
  next_renewal_at: string | null;
  trial_end_at: string | null;
  reminders_muted?: boolean;
};

export function computeDashboardSummary(subs: DashboardSubscription[]) {
  const active = subs.filter((s) => s.status !== "archived");

  let monthlyRecurring = 0;
  let annualRecurring = 0;

  for (const s of active) {
    if (s.billing_amount == null || !s.billing_interval) continue;
    const annual = annualizedCost(s.billing_amount, s.billing_interval);
    annualRecurring += annual;
    monthlyRecurring += annual / 12;
  }

  const now = Date.now();
  const in7Days = now + 7 * 24 * 60 * 60 * 1000;

  const renewalsIn7Days = active.filter((s) => {
    if (!s.next_renewal_at) return false;
    const t = new Date(s.next_renewal_at).getTime();
    return t >= now && t <= in7Days;
  });

  const needsAttention = active.filter(needsAttentionFilter);

  return {
    monthlyRecurring,
    annualRecurring,
    renewalsIn7Days,
    needsAttention,
    activeCount: active.length,
  };
}

export function needsAttentionFilter(s: DashboardSubscription): boolean {
  if (
    s.status === "cancellation_failed" ||
    s.status === "payment_detected_after_cancel"
  ) {
    return true;
  }

  const now = Date.now();
  const in7Days = now + 7 * 24 * 60 * 60 * 1000;

  if (s.trial_end_at) {
    const trialEnd = new Date(s.trial_end_at).getTime();
    if (trialEnd >= now && trialEnd <= in7Days) return true;
  }

  if (s.next_renewal_at && s.status === "active") {
    const renewal = new Date(s.next_renewal_at).getTime();
    if (renewal >= now && renewal <= in7Days) return true;
  }

  return false;
}
