import type { BillingInterval, SubscriptionStatus } from "@/lib/types/subscription";
import { BILLING_INTERVALS, CURRENCIES } from "@/lib/types/subscription";

export type SubscriptionFormInput = {
  merchantName: string;
  name: string;
  billingAmount: string;
  currency: string;
  billingInterval: string;
  trialStartAt: string;
  trialEndAt: string;
  nextRenewalAt: string;
  cancellationUrl: string;
  supportEmail: string;
  notes: string;
  status?: SubscriptionStatus;
};

export type ValidationResult =
  | { ok: true; data: ParsedSubscriptionForm }
  | { ok: false; error: string };

export type ParsedSubscriptionForm = {
  merchantName: string;
  name: string;
  billingAmount: number;
  currency: string;
  billingInterval: BillingInterval;
  trialStartAt: string | null;
  trialEndAt: string | null;
  nextRenewalAt: string | null;
  cancellationUrl: string | null;
  supportEmail: string | null;
  notes: string | null;
  status: SubscriptionStatus;
};

function parseDate(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function validateSubscriptionForm(
  input: SubscriptionFormInput
): ValidationResult {
  const merchantName = input.merchantName.trim();
  const name = input.name.trim();

  if (!merchantName) {
    return { ok: false, error: "Merchant name is required." };
  }
  if (!name) {
    return { ok: false, error: "Subscription name is required." };
  }

  const amountRaw = input.billingAmount.trim();
  if (!amountRaw) {
    return { ok: false, error: "Billing amount is required." };
  }
  const billingAmount = Number(amountRaw);
  if (Number.isNaN(billingAmount) || billingAmount < 0) {
    return { ok: false, error: "Billing amount must be zero or greater." };
  }

  const currency = input.currency.trim().toUpperCase();
  if (!CURRENCIES.includes(currency as (typeof CURRENCIES)[number])) {
    return { ok: false, error: "Choose a supported currency." };
  }

  const billingInterval = input.billingInterval as BillingInterval;
  if (!BILLING_INTERVALS.some((i) => i.value === billingInterval)) {
    return { ok: false, error: "Choose a billing interval." };
  }

  const status = input.status ?? "active";

  let trialStartAt: string | null = null;
  let trialEndAt: string | null = null;
  if (input.trialStartAt.trim()) {
    trialStartAt = parseDate(input.trialStartAt);
    if (!trialStartAt) {
      return { ok: false, error: "Trial start date is invalid." };
    }
  }
  if (input.trialEndAt.trim()) {
    trialEndAt = parseDate(input.trialEndAt);
    if (!trialEndAt) {
      return { ok: false, error: "Trial end date is invalid." };
    }
  }

  let nextRenewalAt: string | null = null;
  if (input.nextRenewalAt.trim()) {
    nextRenewalAt = parseDate(input.nextRenewalAt);
    if (!nextRenewalAt) {
      return { ok: false, error: "Next renewal date is invalid." };
    }
  } else if (status !== "archived") {
    return {
      ok: false,
      error: "Next renewal date is required unless the subscription is archived.",
    };
  }

  const supportEmail = input.supportEmail.trim();
  if (supportEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmail)) {
    return { ok: false, error: "Support email format is invalid." };
  }

  const cancellationUrl = input.cancellationUrl.trim();
  if (cancellationUrl) {
    try {
      new URL(cancellationUrl);
    } catch {
      return { ok: false, error: "Cancellation URL must be a valid URL." };
    }
  }

  return {
    ok: true,
    data: {
      merchantName,
      name,
      billingAmount,
      currency,
      billingInterval,
      trialStartAt,
      trialEndAt,
      nextRenewalAt,
      cancellationUrl: cancellationUrl || null,
      supportEmail: supportEmail || null,
      notes: input.notes.trim() || null,
      status,
    },
  };
}

export function formDataToInput(
  formData: FormData,
  status?: SubscriptionStatus
): SubscriptionFormInput {
  return {
    merchantName: String(formData.get("merchantName") ?? ""),
    name: String(formData.get("name") ?? ""),
    billingAmount: String(formData.get("billingAmount") ?? ""),
    currency: String(formData.get("currency") ?? "USD"),
    billingInterval: String(formData.get("billingInterval") ?? ""),
    trialStartAt: String(formData.get("trialStartAt") ?? ""),
    trialEndAt: String(formData.get("trialEndAt") ?? ""),
    nextRenewalAt: String(formData.get("nextRenewalAt") ?? ""),
    cancellationUrl: String(formData.get("cancellationUrl") ?? ""),
    supportEmail: String(formData.get("supportEmail") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    status,
  };
}

export function toDateInputValue(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}
