export type Subscription = {
  id: string;
  name: string;
  price: number;
  currency: string;
  billingCycle: "monthly" | "yearly" | "weekly";
  nextBillingDate: string; // ISO date string
  category: string;
  active: boolean;
};