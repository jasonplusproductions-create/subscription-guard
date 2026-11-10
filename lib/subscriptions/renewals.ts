import type { RenewalDecision } from "@/lib/subscriptions/renewal-decision";

export type RenewalKind = "renewal" | "trial_end";

export type RenewalItem = {
  id: string;
  name: string;
  merchantName: string | null;
  amount: number | null;
  currency: string;
  date: string; // YYYY-MM-DD (UTC)
  kind: RenewalKind;
  status: string;
  decision: RenewalDecision;
};

export type RenewalSource = {
  id: string;
  name: string;
  status: string;
  billing_amount: number | null;
  currency: string | null;
  next_renewal_at: string | null;
  trial_end_at: string | null;
  renewal_decision?: string | null;
  merchantName: string | null;
};

// Already finished with: nothing left to renew.
const INACTIVE = new Set(["archived", "cancellation_confirmed"]);

function toDay(iso: string | null): string | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : new Date(t).toISOString().slice(0, 10);
}

function toDecision(raw: string | null | undefined): RenewalDecision {
  return raw === "keep" || raw === "cancel" ? raw : "undecided";
}

export function buildRenewalItems(subs: RenewalSource[]): RenewalItem[] {
  const items: RenewalItem[] = [];
  for (const s of subs) {
    if (INACTIVE.has(s.status)) continue;
    const base = {
      id: s.id,
      name: s.name,
      merchantName: s.merchantName,
      amount: s.billing_amount,
      currency: s.currency ?? "USD",
      status: s.status,
      decision: toDecision(s.renewal_decision),
    };
    const renewal = toDay(s.next_renewal_at);
    if (renewal) items.push({ ...base, date: renewal, kind: "renewal" });
    const trial = toDay(s.trial_end_at);
    if (trial) items.push({ ...base, date: trial, kind: "trial_end" });
  }
  return items.sort((a, b) => a.date.localeCompare(b.date));
}

export function todayUtc(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

function daysBetween(fromDay: string, toDayStr: string): number {
  return Math.round(
    (Date.parse(`${toDayStr}T00:00:00Z`) - Date.parse(`${fromDay}T00:00:00Z`)) /
      86_400_000,
  );
}

export function daysUntil(day: string, today: string = todayUtc()): number {
  return daysBetween(today, day);
}

export type RenewalGroups = {
  overdue: RenewalItem[];
  next7: RenewalItem[];
  next30: RenewalItem[];
  later: RenewalItem[];
};

export function groupRenewals(
  items: RenewalItem[],
  today: string = todayUtc(),
): RenewalGroups {
  const g: RenewalGroups = { overdue: [], next7: [], next30: [], later: [] };
  for (const it of items) {
    const d = daysBetween(today, it.date);
    if (d < 0) g.overdue.push(it);
    else if (d <= 7) g.next7.push(it);
    else if (d <= 30) g.next30.push(it);
    else g.later.push(it);
  }
  return g;
}

const pad = (n: number) => String(n).padStart(2, "0");

export function parseMonthParam(
  raw: string | undefined,
  today: string = todayUtc(),
): { year: number; month: number } {
  const m = /^(\d{4})-(\d{2})$/.exec(raw ?? "");
  if (m) {
    const year = Number(m[1]);
    const month = Number(m[2]);
    if (month >= 1 && month <= 12) return { year, month };
  }
  return { year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) };
}

export function shiftMonth(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const idx = year * 12 + (month - 1) + delta;
  return { year: Math.floor(idx / 12), month: (idx % 12) + 1 };
}

export function monthKey(year: number, month: number): string {
  return `${year}-${pad(month)}`;
}

/** Weeks (Sunday first). Cells are YYYY-MM-DD, or null for padding. */
export function monthGrid(year: number, month: number): (string | null)[][] {
  const startDow = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: (string | null)[] = Array(startDow).fill(null);
  for (let d = 1; d <= days; d++) cells.push(`${year}-${pad(month)}-${pad(d)}`);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export function formatAmount(
  amount: number | null,
  currency: string,
): string | null {
  return amount == null ? null : `${currency} ${amount.toFixed(2)}`;
}
