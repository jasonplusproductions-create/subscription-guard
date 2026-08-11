import type { BillingInterval } from "@/lib/types/subscription";

export function annualizedCost(
  amount: number,
  interval: BillingInterval
): number {
  switch (interval) {
    case "weekly":
      return amount * 52;
    case "monthly":
      return amount * 12;
    case "quarterly":
      return amount * 4;
    case "annual":
      return amount;
    default:
      return amount;
  }
}

export function formatAnnualizedCost(
  amount: number | null,
  interval: BillingInterval | null,
  currency: string
): string | null {
  if (amount == null || interval == null) return null;
  const annual = annualizedCost(amount, interval);
  return `${currency} ${annual.toFixed(2)}/yr`;
}
