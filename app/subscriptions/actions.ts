"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { BILLING_INTERVALS, type BillingInterval } from "@/lib/types";

export type SubscriptionActionState = {
  ok: boolean;
  error: string | null;
};

export const initialSubscriptionActionState: SubscriptionActionState = {
  ok: false,
  error: null,
};

const NAME_MAX_LENGTH = 120;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CURRENCY_PATTERN = /^[A-Z]{3}$/;
const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

type ParsedSubscriptionInput = {
  name: string;
  billingAmount: number | null;
  currency: string;
  billingInterval: BillingInterval | null;
  nextRenewalAt: string | null;
};

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function parseSubscriptionForm(
  formData: FormData
): ParsedSubscriptionInput | { error: string } {
  const name = readString(formData, "name").replace(/\s+/g, " ");
  if (!name) {
    return { error: "Enter a subscription name." };
  }
  if (name.length > NAME_MAX_LENGTH) {
    return { error: `Name must be ${NAME_MAX_LENGTH} characters or fewer.` };
  }

  const amountRaw = readString(formData, "billing_amount");
  let billingAmount: number | null = null;
  if (amountRaw) {
    if (!AMOUNT_PATTERN.test(amountRaw)) {
      return { error: "Enter a valid amount with up to two decimal places." };
    }
    billingAmount = Number(amountRaw);
    if (!Number.isFinite(billingAmount) || billingAmount < 0) {
      return { error: "Amount must be zero or greater." };
    }
  }

  const currencyRaw = readString(formData, "currency").toUpperCase();
  const currency = currencyRaw || "USD";
  if (!CURRENCY_PATTERN.test(currency)) {
    return { error: "Currency must be a 3-letter code such as USD." };
  }

  const intervalRaw = readString(formData, "billing_interval");
  let billingInterval: BillingInterval | null = null;
  if (intervalRaw) {
    if (!BILLING_INTERVALS.includes(intervalRaw as BillingInterval)) {
      return { error: "Choose a valid billing interval." };
    }
    billingInterval = intervalRaw as BillingInterval;
  }

  if (billingAmount !== null && billingInterval === null) {
    return { error: "Choose a billing interval when an amount is set." };
  }

  const dateRaw = readString(formData, "next_renewal_at");
  let nextRenewalAt: string | null = null;
  if (dateRaw) {
    if (!DATE_PATTERN.test(dateRaw)) {
      return { error: "Enter a valid next renewal date." };
    }
    const parsed = new Date(`${dateRaw}T12:00:00.000Z`);
    if (Number.isNaN(parsed.getTime())) {
      return { error: "Enter a valid next renewal date." };
    }
    nextRenewalAt = parsed.toISOString();
  }

  return {
    name,
    billingAmount,
    currency,
    billingInterval,
    nextRenewalAt,
  };
}

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { supabase, user: null, error: "Sign in to manage subscriptions." };
  }

  return { supabase, user, error: null };
}

export async function createSubscription(
  _prev: SubscriptionActionState,
  formData: FormData
): Promise<SubscriptionActionState> {
  const parsed = parseSubscriptionForm(formData);
  if ("error" in parsed) {
    return { ok: false, error: parsed.error };
  }

  const { supabase, user, error } = await requireUser();
  if (!user) {
    return { ok: false, error };
  }

  const { error: insertError } = await supabase.from("subscriptions").insert({
    user_id: user.id,
    name: parsed.name,
    billing_amount: parsed.billingAmount,
    currency: parsed.currency,
    billing_interval: parsed.billingInterval,
    next_renewal_at: parsed.nextRenewalAt,
    status: "active",
    source: "manual",
  });

  if (insertError) {
    return { ok: false, error: "Could not save this subscription." };
  }

  revalidatePath("/subscriptions");
  return { ok: true, error: null };
}

export async function updateSubscription(
  _prev: SubscriptionActionState,
  formData: FormData
): Promise<SubscriptionActionState> {
  const id = readString(formData, "id");
  if (!UUID_PATTERN.test(id)) {
    return { ok: false, error: "Invalid subscription." };
  }

  const parsed = parseSubscriptionForm(formData);
  if ("error" in parsed) {
    return { ok: false, error: parsed.error };
  }

  const { supabase, user, error } = await requireUser();
  if (!user) {
    return { ok: false, error };
  }

  const { data, error: updateError } = await supabase
    .from("subscriptions")
    .update({
      name: parsed.name,
      billing_amount: parsed.billingAmount,
      currency: parsed.currency,
      billing_interval: parsed.billingInterval,
      next_renewal_at: parsed.nextRenewalAt,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (updateError) {
    return { ok: false, error: "Could not update this subscription." };
  }

  if (!data) {
    return { ok: false, error: "Subscription not found." };
  }

  revalidatePath("/subscriptions");
  return { ok: true, error: null };
}
