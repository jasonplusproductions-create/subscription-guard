import { parseCsv } from "@/lib/csv/csv";
import {
  validateSubscriptionForm,
  type ParsedSubscriptionForm,
} from "@/lib/subscriptions/validation";

export const MAX_CSV_BYTES = 256 * 1024;
export const MAX_CSV_ROWS = 500;

/** Columns written on export and accepted on import (header names). */
export const CSV_HEADERS = [
  "merchant",
  "name",
  "amount",
  "currency",
  "interval",
  "next_renewal",
  "trial_end",
  "notes",
] as const;

type Header = (typeof CSV_HEADERS)[number];

const ALIASES: Record<string, Header> = {
  merchant: "merchant",
  vendor: "merchant",
  service: "merchant",
  name: "name",
  subscription: "name",
  plan: "name",
  amount: "amount",
  price: "amount",
  cost: "amount",
  currency: "currency",
  interval: "interval",
  billing_interval: "interval",
  frequency: "interval",
  next_renewal: "next_renewal",
  renewal: "next_renewal",
  renewal_date: "next_renewal",
  next_billing_date: "next_renewal",
  trial_end: "trial_end",
  trial_end_date: "trial_end",
  notes: "notes",
  note: "notes",
};

const INTERVAL_ALIASES: Record<string, string> = {
  weekly: "weekly",
  week: "weekly",
  monthly: "monthly",
  month: "monthly",
  quarterly: "quarterly",
  quarter: "quarterly",
  annual: "annual",
  annually: "annual",
  yearly: "annual",
  year: "annual",
};

export type ImportRow = {
  line: number; // 1-based line in the file (header is line 1)
  ok: boolean;
  error?: string;
  data?: ParsedSubscriptionForm;
  raw: Partial<Record<Header, string>>;
};

export type ParsedCsv =
  | { ok: false; error: string }
  | { ok: true; rows: ImportRow[] };

function normHeader(h: string): string {
  return h.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

export function parseSubscriptionCsv(text: string): ParsedCsv {
  if (text.length > MAX_CSV_BYTES) {
    return { ok: false, error: "File is too large (limit 256 KB)." };
  }
  const table = parseCsv(text);
  if (table.length < 2) {
    return { ok: false, error: "No data rows found. Include a header row." };
  }
  if (table.length - 1 > MAX_CSV_ROWS) {
    return { ok: false, error: `Too many rows (limit ${MAX_CSV_ROWS}).` };
  }

  const colIndex = new Map<Header, number>();
  table[0].forEach((h, i) => {
    const key = ALIASES[normHeader(h)];
    if (key && !colIndex.has(key)) colIndex.set(key, i);
  });
  for (const required of ["merchant", "amount", "interval"] as const) {
    if (!colIndex.has(required)) {
      return { ok: false, error: `Missing required column: ${required}.` };
    }
  }

  const rows: ImportRow[] = table.slice(1).map((cells, idx) => {
    const raw: Partial<Record<Header, string>> = {};
    for (const [key, i] of colIndex) raw[key] = (cells[i] ?? "").trim();

    const interval =
      INTERVAL_ALIASES[(raw.interval ?? "").toLowerCase()] ??
      (raw.interval ?? "");
    const amount = (raw.amount ?? "").replace(/[$,\s]/g, "");

    const result = validateSubscriptionForm({
      merchantName: raw.merchant ?? "",
      name: raw.name || raw.merchant || "",
      billingAmount: amount,
      currency: raw.currency || "USD",
      billingInterval: interval,
      trialStartAt: "",
      trialEndAt: raw.trial_end ?? "",
      nextRenewalAt: raw.next_renewal ?? "",
      cancellationUrl: "",
      supportEmail: "",
      notes: raw.notes ?? "",
    });

    return result.ok
      ? { line: idx + 2, ok: true, data: result.data, raw }
      : { line: idx + 2, ok: false, error: result.error, raw };
  });

  return { ok: true, rows };
}
