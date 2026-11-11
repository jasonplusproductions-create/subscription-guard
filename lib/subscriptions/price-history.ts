import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * S5 price-change history. Rows are append-only history of billing_amount
 * changes; `subscriptions.billing_amount` stays the current price and
 * `subscriptions.status` stays the only source of truth for state.
 */

export type PriceChangeSource = "manual_edit" | "csv_import" | "manual";

export type PriceChangeRow = {
  id: string;
  subscription_id: string;
  user_id: string;
  old_amount: number | null;
  new_amount: number;
  currency: string;
  changed_at: string;
  source: PriceChangeSource;
};

export const PRICE_CHANGE_SOURCE_LABELS: Record<PriceChangeSource, string> = {
  manual_edit: "Edited by you",
  csv_import: "CSV import",
  manual: "Added by you",
};

/** True when a new amount differs from the stored one. */
export function priceChanged(
  oldAmount: number | null | undefined,
  newAmount: number | null | undefined
): boolean {
  if (newAmount == null) return false;
  if (oldAmount == null) return true;
  return Number(oldAmount) !== Number(newAmount);
}

/**
 * Records one price change. A no-op when the amount did not change.
 *
 * Never throws: the price history table may not be applied in every
 * environment yet, and a history write must not block the subscription
 * edit or CSV import that triggered it.
 */
export async function recordPriceChange(
  supabase: SupabaseClient,
  params: {
    userId: string;
    subscriptionId: string;
    oldAmount: number | null | undefined;
    newAmount: number | null | undefined;
    currency: string;
    source: PriceChangeSource;
    changedAt?: string;
  }
): Promise<boolean> {
  if (!priceChanged(params.oldAmount, params.newAmount)) return false;

  const { error } = await supabase.from("subscription_price_changes").insert({
    subscription_id: params.subscriptionId,
    user_id: params.userId,
    old_amount: params.oldAmount ?? null,
    new_amount: params.newAmount,
    currency: params.currency || "USD",
    changed_at: params.changedAt ?? new Date().toISOString(),
    source: params.source,
  });

  if (error) {
    // TODO(human): once migration 20261110000000 is applied everywhere this
    // can be surfaced to the user instead of swallowed.
    console.error("price history write failed:", error.message);
    return false;
  }

  return true;
}

/** Price history for one subscription, newest first. Empty if not available. */
export async function getPriceHistory(
  supabase: SupabaseClient,
  subscriptionId: string
): Promise<PriceChangeRow[]> {
  const { data, error } = await supabase
    .from("subscription_price_changes")
    .select(
      "id, subscription_id, user_id, old_amount, new_amount, currency, changed_at, source"
    )
    .eq("subscription_id", subscriptionId)
    .order("changed_at", { ascending: false });

  if (error) return [];
  return (data ?? []) as PriceChangeRow[];
}

/** "USD 9.99 → USD 12.99" style label for one row. */
export function formatPriceChange(row: PriceChangeRow): string {
  const currency = row.currency || "USD";
  const from =
    row.old_amount == null ? "no price" : `${currency} ${Number(row.old_amount).toFixed(2)}`;
  return `${from} → ${currency} ${Number(row.new_amount).toFixed(2)}`;
}
