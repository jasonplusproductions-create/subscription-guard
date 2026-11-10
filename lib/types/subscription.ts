export type BillingInterval = "weekly" | "monthly" | "quarterly" | "annual";

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

export const BILLING_INTERVALS: { value: BillingInterval; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "annual", label: "Annual" },
];

export const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD"] as const;

export type SubscriptionRow = {
  id: string;
  user_id: string;
  merchant_id: string;
  name: string;
  status: SubscriptionStatus;
  billing_amount: number | null;
  currency: string;
  billing_interval: BillingInterval | null;
  trial_start_at: string | null;
  trial_end_at: string | null;
  next_renewal_at: string | null;
  notes: string | null;
  /** Optional until migration 20261011000000 is applied. */
  renewal_decision?: "undecided" | "keep" | "cancel";
  renewal_decision_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type MerchantRow = {
  id: string;
  name: string;
  website_url: string | null;
  cancellation_url: string | null;
  support_email: string | null;
};
