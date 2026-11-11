"use server";

import { logAuditEvent } from "@/lib/audit/log-event";
import {
  MAX_CSV_BYTES,
  parseSubscriptionCsv,
  type ImportRow,
} from "@/lib/csv/subscription-csv";
import { findOrCreateMerchant } from "@/lib/merchants/find-or-create";
import { syncRenewalNotifications } from "@/lib/notifications/sync-renewal-notifications";
import { recordPriceChange } from "@/lib/subscriptions/price-history";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type PreviewRow = {
  line: number;
  merchant: string;
  name: string;
  amount: string;
  interval: string;
  nextRenewal: string;
  status: "new" | "invalid" | "duplicate" | "price_changed";
  note?: string;
};

export type ImportState =
  | {
      error?: string;
      csv?: string;
      rows?: PreviewRow[];
      newCount?: number;
      priceChangedCount?: number;
    }
  | undefined;

type Existing = {
  id: string;
  merchant: string;
  name: string;
  amount: number | null;
  currency: string;
};

function key(merchant: string, name: string): string {
  return `${merchant.trim().toLowerCase()}|${name.trim().toLowerCase()}`;
}

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

async function loadExisting(
  supabase: SupabaseClient,
  userId: string
): Promise<Map<string, Existing>> {
  const { data } = await supabase
    .from("subscriptions")
    .select("id, name, billing_amount, currency, merchants(name)")
    .eq("user_id", userId);

  const map = new Map<string, Existing>();
  for (const s of data ?? []) {
    const m = s.merchants as { name?: string } | { name?: string }[] | null;
    const merchant = (Array.isArray(m) ? m[0]?.name : m?.name) ?? "";
    map.set(key(merchant, s.name), {
      id: s.id,
      merchant,
      name: s.name,
      amount: s.billing_amount,
      currency: s.currency ?? "USD",
    });
  }
  return map;
}

function classify(
  row: ImportRow,
  existing: Map<string, Existing>,
  seen: Set<string>
): PreviewRow {
  const base = {
    line: row.line,
    merchant: row.raw.merchant ?? "",
    name: row.raw.name || row.raw.merchant || "",
    amount: row.raw.amount ?? "",
    interval: row.raw.interval ?? "",
    nextRenewal: row.raw.next_renewal ?? "",
  };
  if (!row.ok || !row.data) {
    return { ...base, status: "invalid", note: row.error };
  }
  const k = key(row.data.merchantName, row.data.name);
  if (seen.has(k)) {
    return { ...base, status: "duplicate", note: "Repeated in this file." };
  }
  seen.add(k);
  const found = existing.get(k);
  if (!found) return { ...base, status: "new" };
  if (found.amount != null && found.amount !== row.data.billingAmount) {
    return {
      ...base,
      status: "price_changed",
      note: `Tracked at ${found.amount}; file says ${row.data.billingAmount}. Importing updates the price and records the change.`,
    };
  }
  return { ...base, status: "duplicate", note: "Already tracked." };
}

export async function previewImportAction(
  _prev: ImportState,
  formData: FormData
): Promise<ImportState> {
  const { supabase, user } = await requireUser();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a CSV file." };
  }
  if (file.size > MAX_CSV_BYTES) {
    return { error: "File is too large (limit 256 KB)." };
  }

  const csv = await file.text();
  const parsed = parseSubscriptionCsv(csv);
  if (!parsed.ok) return { error: parsed.error };

  const existing = await loadExisting(supabase, user.id);
  const seen = new Set<string>();
  const rows = parsed.rows.map((r) => classify(r, existing, seen));

  return {
    csv,
    rows,
    newCount: rows.filter((r) => r.status === "new").length,
    priceChangedCount: rows.filter((r) => r.status === "price_changed").length,
  };
}

export async function commitImportAction(formData: FormData) {
  const { supabase, user } = await requireUser();

  const csv = String(formData.get("csv") ?? "");
  const parsed = parseSubscriptionCsv(csv);
  if (!parsed.ok) {
    redirect(`/dashboard/import?error=${encodeURIComponent(parsed.error)}`);
  }

  const existing = await loadExisting(supabase, user.id);
  const seen = new Set<string>();
  let created = 0;
  let updated = 0;
  let failed = 0;

  for (const row of parsed.rows) {
    const c = classify(row, existing, seen);
    if (c.status !== "new" && c.status !== "price_changed") continue;
    if (!row.data) continue;
    const d = row.data;

    if (c.status === "price_changed") {
      const found = existing.get(key(d.merchantName, d.name));
      if (!found) continue;

      const { error } = await supabase
        .from("subscriptions")
        .update({
          billing_amount: d.billingAmount,
          currency: d.currency,
          updated_at: new Date().toISOString(),
        })
        .eq("id", found.id)
        .eq("user_id", user.id);

      if (error) {
        failed++;
        continue;
      }

      await recordPriceChange(supabase, {
        userId: user.id,
        subscriptionId: found.id,
        oldAmount: found.amount,
        newAmount: d.billingAmount,
        currency: d.currency,
        source: "csv_import",
      });

      await logAuditEvent(supabase, {
        userId: user.id,
        action: "subscription_price_changed",
        entityType: "subscription",
        entityId: found.id,
        metadata: {
          old_amount: found.amount,
          new_amount: d.billingAmount,
          via: "csv_import",
        },
      });
      updated++;
      continue;
    }

    try {
      const merchantId = await findOrCreateMerchant(supabase, d.merchantName);
      const initialStatus =
        d.trialEndAt && new Date(d.trialEndAt) > new Date() ? "trial" : d.status;

      const { data: sub, error } = await supabase
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

      if (error || !sub) {
        failed++;
        continue;
      }

      await logAuditEvent(supabase, {
        userId: user.id,
        action: "subscription_created",
        entityType: "subscription",
        entityId: sub.id,
        metadata: { name: d.name, merchant: d.merchantName, via: "csv_import" },
      });
      await syncRenewalNotifications(supabase, {
        userId: user.id,
        subscriptionId: sub.id,
        nextRenewalAt: d.nextRenewalAt,
      });
      created++;
    } catch {
      failed++;
    }
  }

  revalidatePath("/dashboard");
  redirect(
    `/dashboard/import?done=${created}&updated=${updated}&failed=${failed}`
  );
}
