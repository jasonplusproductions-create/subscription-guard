import type { Subscription, SubscriptionStatus } from "./types";

const BILLING_STATUSES: SubscriptionStatus[] = [
  "trial",
  "active",
  "renewal_approaching",
  "cancellation_requested",
  "cancellation_submitted",
  "cancellation_failed",
  "payment_detected_after_cancel",
];

export function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatDate(isoDate: string) {
  return new Date(isoDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatStatus(status: SubscriptionStatus) {
  return status.replaceAll("_", " ");
}

export function isBillingStatus(status: SubscriptionStatus) {
  return BILLING_STATUSES.includes(status);
}

export function monthlyCost(subscription: Subscription) {
  if (subscription.billingAmount === null) {
    return 0;
  }

  switch (subscription.billingInterval) {
    case "monthly":
      return subscription.billingAmount;
    case "annual":
      return subscription.billingAmount / 12;
    case "weekly":
      return subscription.billingAmount * 4.33;
    case "quarterly":
      return subscription.billingAmount / 3;
    case "other":
    case null:
      return 0;
  }
}

export function statusTone(status: SubscriptionStatus) {
  if (
    status === "active" ||
    status === "renewal_approaching" ||
    status === "trial"
  ) {
    return "positive";
  }
  if (status === "archived" || status === "cancellation_confirmed") {
    return "muted";
  }
  return "warning";
}

export function toDateInputValue(isoDate: string | null) {
  if (!isoDate) {
    return "";
  }

  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}
