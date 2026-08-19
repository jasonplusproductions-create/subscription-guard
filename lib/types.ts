export const BILLING_INTERVALS = [
  "weekly",
  "monthly",
  "quarterly",
  "annual",
  "other",
] as const;

export type BillingInterval = (typeof BILLING_INTERVALS)[number];

export type SubscriptionStatus =
  | "trial"
  | "active"
  | "renewal_approaching"
  | "cancellation_requested"
  | "cancellation_submitted"
  | "cancellation_confirmed"
  | "cancellation_failed"
  | "payment_detected_after_cancel"
  | "archived";

export type Subscription = {
  id: string;
  userId: string;
  name: string;
  billingAmount: number | null;
  currency: string;
  billingInterval: BillingInterval | null;
  nextRenewalAt: string | null;
  status: SubscriptionStatus;
};
