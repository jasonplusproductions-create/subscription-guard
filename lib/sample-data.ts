import type { Subscription } from "./types";

export const sampleSubscriptions: Subscription[] = [
  {
    id: "1",
    name: "Netflix",
    billingAmount: 15.49,
    currency: "USD",
    billingInterval: "monthly",
    nextRenewalAt: "2026-08-15T00:00:00.000Z",
    status: "active",
  },
  {
    id: "2",
    name: "Spotify",
    billingAmount: 11.99,
    currency: "USD",
    billingInterval: "monthly",
    nextRenewalAt: "2026-08-10T00:00:00.000Z",
    status: "active",
  },
  {
    id: "3",
    name: "iCloud+",
    billingAmount: 2.99,
    currency: "USD",
    billingInterval: "monthly",
    nextRenewalAt: "2026-08-20T00:00:00.000Z",
    status: "trial",
  },
  {
    id: "4",
    name: "Amazon Prime",
    billingAmount: 139.0,
    currency: "USD",
    billingInterval: "annual",
    nextRenewalAt: "2026-12-01T00:00:00.000Z",
    status: "active",
  },
  {
    id: "5",
    name: "Gym Membership",
    billingAmount: 45.0,
    currency: "USD",
    billingInterval: "monthly",
    nextRenewalAt: "2026-08-05T00:00:00.000Z",
    status: "archived",
  },
];
