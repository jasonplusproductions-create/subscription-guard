/**
 * S6 spend forecast — pure functions over subscription rows, so the
 * /dashboard/forecast page can run them in a Server Component.
 *
 * Two kinds of money, kept apart everywhere (numbers and UI):
 *
 *   confirmed — the renewal is expected to charge at a known amount: the
 *               subscription is live (active / renewal_approaching), an amount
 *               and a billing interval are recorded, and the user has marked
 *               the renewal "Keep".
 *   estimated — money that might still leave the account but isn't settled:
 *               trials that convert, renewals the user hasn't decided on,
 *               renewals the user plans to cancel but hasn't yet, subscriptions
 *               whose cancellation isn't confirmed, charges with no amount
 *               recorded (counted, never guessed into a total) and charges with
 *               no billing interval recorded (a single date is all we know).
 *
 * Read-only: nothing here changes `subscriptions.status` (the only source of
 * truth for a subscription's state), and nothing contacts a merchant.
 */

import type { BillingInterval } from "@/lib/types/subscription";

export type RenewalDecision = "undecided" | "keep" | "cancel";

export type ForecastInput = {
  id: string;
  name: string;
  status: string;
  billingAmount: number | null;
  currency: string;
  billingInterval: BillingInterval | null;
  nextRenewalAt: string | null;
  trialEndAt: string | null;
  cancellationDeadlineAt: string | null;
  renewalDecision: RenewalDecision;
};

export type ChargeCertainty = "confirmed" | "estimated";

export type EstimateReason =
  | "trial_conversion"
  | "undecided_renewal"
  | "planned_cancel"
  | "cancellation_pending"
  | "missing_amount"
  | "unknown_schedule";

export type ProjectedCharge = {
  subscriptionId: string;
  name: string;
  /** YYYY-MM-DD (UTC). */
  date: string;
  amount: number | null;
  currency: string;
  interval: BillingInterval | null;
  certainty: ChargeCertainty;
  /** null for confirmed charges. */
  reason: EstimateReason | null;
};

export type CurrencyTotal = {
  currency: string;
  confirmedAmount: number;
  estimatedAmount: number;
  confirmedCount: number;
  estimatedCount: number;
  /** Charges inside the window that have no recorded amount. */
  unknownAmountCount: number;
};

export type ForecastWindowSummary = {
  months: number;
  from: string;
  to: string;
  totals: CurrencyTotal[];
  trialConversionCount: number;
  undecidedCount: number;
};

export type MonthBucket = {
  /** YYYY-MM */
  month: string;
  label: string;
  confirmed: number;
  estimated: number;
  unknownAmountCount: number;
};

export type Forecast = {
  today: string;
  primaryCurrency: string;
  /** 3 months, then 12 months. */
  windows: ForecastWindowSummary[];
  /** 12 monthly buckets, for the bars. */
  months: MonthBucket[];
  charges: ProjectedCharge[];
};

/** Already finished with: nothing left to charge. */
const DONE_STATUSES = new Set(["archived", "cancellation_confirmed"]);

/** Statuses where a renewal is expected rather than merely possible. */
const LIVE_STATUSES = new Set(["active", "renewal_approaching"]);

const MONTHS_BY_INTERVAL: Record<BillingInterval, number> = {
  weekly: 0,
  monthly: 1,
  quarterly: 3,
  annual: 12,
};

const DAY_MS = 86_400_000;
const MAX_STEPS = 600;

const pad = (n: number) => String(n).padStart(2, "0");

export function todayUtc(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

function toDay(iso: string | null): string | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : new Date(t).toISOString().slice(0, 10);
}

/** Calendar-month addition with end-of-month clamping (Jan 31 + 1 = Feb 28). */
export function addMonths(day: string, months: number): string {
  const [year, month, date] = day.split("-").map(Number);
  const idx = year * 12 + (month - 1) + months;
  const nextYear = Math.floor(idx / 12);
  const nextMonth = (idx % 12) + 1;
  const lastDay = new Date(Date.UTC(nextYear, nextMonth, 0)).getUTCDate();
  return `${nextYear}-${pad(nextMonth)}-${pad(Math.min(date, lastDay))}`;
}

function addInterval(day: string, interval: BillingInterval): string {
  if (interval === "weekly") {
    return new Date(Date.parse(`${day}T00:00:00Z`) + 7 * DAY_MS)
      .toISOString()
      .slice(0, 10);
  }
  return addMonths(day, MONTHS_BY_INTERVAL[interval]);
}

/**
 * Last day of the last calendar month in a window, so a 3-month window runs
 * from today through the end of the third month and a 12-month window matches
 * the 12 monthly bars exactly.
 */
export function windowEnd(today: string, months: number): string {
  const [year, month] = today.split("-").map(Number);
  const idx = year * 12 + (month - 1) + (months - 1);
  const endYear = Math.floor(idx / 12);
  const endMonth = (idx % 12) + 1;
  const lastDay = new Date(Date.UTC(endYear, endMonth, 0)).getUTCDate();
  return `${endYear}-${pad(endMonth)}-${pad(lastDay)}`;
}

export function daysUntil(day: string, today: string): number {
  return Math.round(
    (Date.parse(`${day}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / DAY_MS,
  );
}

function firstChargeDay(s: ForecastInput): string | null {
  if (s.status === "trial") return toDay(s.trialEndAt) ?? toDay(s.nextRenewalAt);
  return toDay(s.nextRenewalAt);
}

function classify(s: ForecastInput): {
  certainty: ChargeCertainty;
  reason: EstimateReason | null;
} {
  if (s.billingAmount == null) {
    return { certainty: "estimated", reason: "missing_amount" };
  }
  if (s.status === "trial") {
    return { certainty: "estimated", reason: "trial_conversion" };
  }
  if (s.renewalDecision === "cancel") {
    return { certainty: "estimated", reason: "planned_cancel" };
  }
  if (!LIVE_STATUSES.has(s.status)) {
    return { certainty: "estimated", reason: "cancellation_pending" };
  }
  if (s.renewalDecision !== "keep") {
    return { certainty: "estimated", reason: "undecided_renewal" };
  }
  if (s.billingInterval == null) {
    return { certainty: "estimated", reason: "unknown_schedule" };
  }
  return { certainty: "confirmed", reason: null };
}

/**
 * Every charge the subscriptions are expected (confirmed) or could plausibly
 * produce (estimated) between `today` and `today + months`, inclusive.
 * Renewal dates that have already passed roll forward to the next occurrence.
 */
export function projectCharges(
  subscriptions: ForecastInput[],
  today: string,
  months = 12,
): ProjectedCharge[] {
  const to = windowEnd(today, months);
  const charges: ProjectedCharge[] = [];

  for (const s of subscriptions) {
    if (DONE_STATUSES.has(s.status)) continue;
    const first = firstChargeDay(s);
    if (!first) continue;

    const { certainty, reason } = classify(s);
    const currency = s.currency || "USD";
    const base = {
      subscriptionId: s.id,
      name: s.name,
      amount: s.billingAmount,
      currency,
      interval: s.billingInterval,
      certainty,
      reason,
    };

    if (s.billingInterval == null) {
      if (first >= today && first <= to) charges.push({ ...base, date: first });
      continue;
    }

    let day = first;
    let steps = 0;
    while (day < today && steps < MAX_STEPS) {
      day = addInterval(day, s.billingInterval);
      steps += 1;
    }
    while (day <= to && steps < MAX_STEPS) {
      charges.push({ ...base, date: day });
      day = addInterval(day, s.billingInterval);
      steps += 1;
    }
  }

  return charges.sort((a, b) => a.date.localeCompare(b.date));
}

function inWindow(charge: ProjectedCharge, from: string, to: string): boolean {
  return charge.date >= from && charge.date <= to;
}

export function summarizeWindow(
  charges: ProjectedCharge[],
  months: number,
  today: string,
): ForecastWindowSummary {
  const to = windowEnd(today, months);
  const byCurrency = new Map<string, CurrencyTotal>();
  let trialConversionCount = 0;
  let undecidedCount = 0;

  for (const c of charges) {
    if (!inWindow(c, today, to)) continue;

    const total =
      byCurrency.get(c.currency) ??
      ({
        currency: c.currency,
        confirmedAmount: 0,
        estimatedAmount: 0,
        confirmedCount: 0,
        estimatedCount: 0,
        unknownAmountCount: 0,
      } satisfies CurrencyTotal);

    if (c.amount == null) {
      total.unknownAmountCount += 1;
    } else if (c.certainty === "confirmed") {
      total.confirmedAmount += c.amount;
      total.confirmedCount += 1;
    } else {
      total.estimatedAmount += c.amount;
      total.estimatedCount += 1;
    }

    if (c.reason === "trial_conversion") trialConversionCount += 1;
    if (c.reason === "undecided_renewal") undecidedCount += 1;

    byCurrency.set(c.currency, total);
  }

  const totals = [...byCurrency.values()]
    .map((t) => ({
      ...t,
      confirmedAmount: round2(t.confirmedAmount),
      estimatedAmount: round2(t.estimatedAmount),
    }))
    .sort(
      (a, b) =>
        b.confirmedAmount +
        b.estimatedAmount -
        (a.confirmedAmount + a.estimatedAmount),
    );

  return { months, from: today, to, totals, trialConversionCount, undecidedCount };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** The currency most of the money is in — what the bars and headline use. */
export function primaryCurrency(windows: ForecastWindowSummary[]): string {
  const longest = windows.reduce<ForecastWindowSummary | null>(
    (best, w) => (best == null || w.months > best.months ? w : best),
    null,
  );
  return longest?.totals[0]?.currency ?? "USD";
}

function monthLabel(month: string): string {
  const [year, m] = month.split("-").map(Number);
  const name = new Date(Date.UTC(year, m - 1, 1)).toLocaleDateString("en-US", {
    month: "short",
    timeZone: "UTC",
  });
  return `${name} ${String(year).slice(2)}`;
}

export function buildMonthBuckets(
  charges: ProjectedCharge[],
  today: string,
  currency: string,
  months = 12,
): MonthBucket[] {
  const buckets: MonthBucket[] = [];
  const index = new Map<string, MonthBucket>();

  for (let i = 0; i < months; i += 1) {
    const month = addMonths(today, i).slice(0, 7);
    const bucket: MonthBucket = {
      month,
      label: monthLabel(month),
      confirmed: 0,
      estimated: 0,
      unknownAmountCount: 0,
    };
    buckets.push(bucket);
    index.set(month, bucket);
  }

  for (const c of charges) {
    const bucket = index.get(c.date.slice(0, 7));
    if (!bucket) continue;
    if (c.amount == null) {
      bucket.unknownAmountCount += 1;
      continue;
    }
    if (c.currency !== currency) continue;
    if (c.certainty === "confirmed") bucket.confirmed += c.amount;
    else bucket.estimated += c.amount;
  }

  for (const b of buckets) {
    b.confirmed = round2(b.confirmed);
    b.estimated = round2(b.estimated);
  }
  return buckets;
}

export function buildForecast(
  subscriptions: ForecastInput[],
  today: string = todayUtc(),
): Forecast {
  const charges = projectCharges(subscriptions, today, 12);
  const windows = [3, 12].map((months) =>
    summarizeWindow(charges, months, today),
  );
  const currency = primaryCurrency(windows);

  return {
    today,
    primaryCurrency: currency,
    windows,
    months: buildMonthBuckets(charges, today, currency, 12),
    charges,
  };
}

export function formatMoney(amount: number, currency: string): string {
  return `${currency} ${amount.toFixed(2)}`;
}
