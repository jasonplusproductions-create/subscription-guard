/**
 * S6 forecast insights — pure functions over the projected charges from
 * lib/forecast/spend.ts. Advisory only: nothing here changes a subscription's
 * status or takes any action against a merchant.
 */

import type { BillingInterval } from "@/lib/types/subscription";
import {
  daysUntil,
  type ForecastInput,
  type ProjectedCharge,
} from "@/lib/forecast/spend";

const DONE_STATUSES = new Set(["archived", "cancellation_confirmed"]);

const INTERVAL_LABELS: Record<BillingInterval | "unknown", string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  annual: "Annual",
  unknown: "No interval recorded",
};

const INTERVAL_ORDER: (BillingInterval | "unknown")[] = [
  "monthly",
  "annual",
  "quarterly",
  "weekly",
  "unknown",
];

/** Largest known charges inside the window — confirmed and estimated both. */
export function biggestUpcomingCharges(
  charges: ProjectedCharge[],
  limit = 5,
): ProjectedCharge[] {
  return charges
    .filter((c) => c.amount != null && c.amount > 0)
    .sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0))
    .slice(0, limit);
}

export type DeadlineInsight = {
  subscriptionId: string;
  name: string;
  /** YYYY-MM-DD */
  date: string;
  /** Negative when the deadline has already passed. */
  daysUntil: number;
  /** "recorded" when the merchant deadline is stored, "renewal" when the
   * renewal date is the only deadline we know. */
  source: "recorded" | "renewal";
  amount: number | null;
  currency: string;
};

function deadlineFor(s: ForecastInput): DeadlineInsight["source"] | null {
  if (s.cancellationDeadlineAt) return "recorded";
  if (s.nextRenewalAt) return "renewal";
  if (s.trialEndAt) return "renewal";
  return null;
}

function deadlineDay(s: ForecastInput): string | null {
  const raw = s.cancellationDeadlineAt ?? s.nextRenewalAt ?? s.trialEndAt;
  if (!raw) return null;
  const t = Date.parse(raw);
  return Number.isNaN(t) ? null : new Date(t).toISOString().slice(0, 10);
}

/**
 * The soonest cancellation deadline across everything still live. If every
 * recorded deadline has already passed, the most recent one is returned with a
 * negative `daysUntil` so the page can say so honestly.
 */
export function nearestCancellationDeadline(
  subscriptions: ForecastInput[],
  today: string,
): DeadlineInsight | null {
  const candidates: DeadlineInsight[] = [];

  for (const s of subscriptions) {
    if (DONE_STATUSES.has(s.status)) continue;
    const source = deadlineFor(s);
    const date = deadlineDay(s);
    if (!source || !date) continue;
    candidates.push({
      subscriptionId: s.id,
      name: s.name,
      date,
      daysUntil: daysUntil(date, today),
      source,
      amount: s.billingAmount,
      currency: s.currency || "USD",
    });
  }

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => a.date.localeCompare(b.date));

  const upcoming = candidates.find((c) => c.daysUntil >= 0);
  return upcoming ?? candidates[candidates.length - 1];
}

export type IntervalSpend = {
  interval: BillingInterval | "unknown";
  label: string;
  confirmedAmount: number;
  estimatedAmount: number;
  chargeCount: number;
  /** Average per month across the window. */
  monthlyAverage: number;
};

/** Where the money sits, grouped by how often it is billed. */
export function spendByInterval(
  charges: ProjectedCharge[],
  months = 12,
  currency = "USD",
): IntervalSpend[] {
  const groups = new Map<BillingInterval | "unknown", IntervalSpend>();

  for (const c of charges) {
    if (c.amount == null || c.currency !== currency) continue;
    const key: BillingInterval | "unknown" = c.interval ?? "unknown";
    const group =
      groups.get(key) ??
      ({
        interval: key,
        label: INTERVAL_LABELS[key],
        confirmedAmount: 0,
        estimatedAmount: 0,
        chargeCount: 0,
        monthlyAverage: 0,
      } satisfies IntervalSpend);

    if (c.certainty === "confirmed") group.confirmedAmount += c.amount;
    else group.estimatedAmount += c.amount;
    group.chargeCount += 1;
    groups.set(key, group);
  }

  return [...groups.values()]
    .map((g) => ({
      ...g,
      confirmedAmount: Math.round(g.confirmedAmount * 100) / 100,
      estimatedAmount: Math.round(g.estimatedAmount * 100) / 100,
      monthlyAverage:
        Math.round(
          ((g.confirmedAmount + g.estimatedAmount) / months) * 100,
        ) / 100,
    }))
    .sort(
      (a, b) =>
        INTERVAL_ORDER.indexOf(a.interval) - INTERVAL_ORDER.indexOf(b.interval),
    );
}
