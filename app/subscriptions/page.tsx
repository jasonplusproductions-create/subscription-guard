import { sampleSubscriptions } from "@/lib/sample-data";
import type { Subscription } from "@/lib/types";

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(price);
}

function formatDate(isoDate: string) {
  return new Date(isoDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function monthlyCost(subscription: Subscription) {
  switch (subscription.billingCycle) {
    case "monthly":
      return subscription.price;
    case "yearly":
      return subscription.price / 12;
    case "weekly":
      return subscription.price * 4.33;
  }
}

export default function SubscriptionsPage() {
  const activeSubscriptions = sampleSubscriptions.filter((s) => s.active);
  const totalMonthly = activeSubscriptions.reduce(
    (sum, s) => sum + monthlyCost(s),
    0
  );

  return (
    <main className="flex flex-1 flex-col items-center bg-zinc-50 py-12 px-6 dark:bg-black">
      <div className="w-full max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
              Subscriptions
            </h1>
            <p className="mt-1 text-zinc-600 dark:text-zinc-400">
              {activeSubscriptions.length} active subscription
              {activeSubscriptions.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-right dark:border-zinc-800 dark:bg-black">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Monthly total
            </p>
            <p className="text-2xl font-semibold text-black dark:text-zinc-50">
              {formatPrice(totalMonthly, "USD")}
            </p>
          </div>
        </div>

        <ul className="mt-8 flex flex-col gap-3">
          {sampleSubscriptions.map((subscription) => (
            <li
              key={subscription.id}
              className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-5 py-4 dark:border-zinc-800 dark:bg-black"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${
                    subscription.active
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                      : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                  }`}
                >
                  {subscription.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-black dark:text-zinc-50">
                    {subscription.name}
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {subscription.category} · {subscription.billingCycle} ·{" "}
                    {formatDate(subscription.nextBillingDate)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-black dark:text-zinc-50">
                  {formatPrice(subscription.price, subscription.currency)}
                </p>
                <p
                  className={`text-xs font-medium ${
                    subscription.active
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-zinc-400 dark:text-zinc-500"
                  }`}
                >
                  {subscription.active ? "Active" : "Paused"}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}