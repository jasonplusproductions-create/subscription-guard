import Link from "next/link";
import { getSubscriptions } from "@/lib/supabase/subscriptions";
import {
  formatPrice,
  isBillingStatus,
  monthlyCost,
} from "@/lib/subscription-display";
import {
  AddSubscriptionButton,
  SubscriptionRow,
} from "./subscription-form";

export default async function SubscriptionsPage() {
  const { user, subscriptions, error, isSuperuser } = await getSubscriptions();

  if (!user) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center bg-zinc-50 py-12 px-6 dark:bg-black">
        <div className="w-full max-w-3xl rounded-2xl border border-zinc-200 bg-white px-8 py-12 text-center dark:border-zinc-800 dark:bg-black">
          <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Subscriptions
          </h1>
          <p className="mt-3 text-zinc-600 dark:text-zinc-400">
            Sign in to view your subscriptions.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            Sign in
          </Link>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center bg-zinc-50 py-12 px-6 dark:bg-black">
        <div className="w-full max-w-3xl rounded-2xl border border-zinc-200 bg-white px-8 py-12 text-center dark:border-zinc-800 dark:bg-black">
          <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Subscriptions
          </h1>
          <p className="mt-3 text-zinc-600 dark:text-zinc-400">
            Could not load your subscriptions. Please try again later.
          </p>
        </div>
      </main>
    );
  }

  const billedSubscriptions = subscriptions.filter((s) =>
    isBillingStatus(s.status)
  );
  const totalMonthly = billedSubscriptions.reduce(
    (sum, s) => sum + monthlyCost(s),
    0
  );

  return (
    <main className="flex flex-1 flex-col items-center bg-zinc-50 py-12 px-6 dark:bg-black">
      <div className="w-full max-w-3xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
              Subscriptions
            </h1>
            <p className="mt-1 text-zinc-600 dark:text-zinc-400">
              {billedSubscriptions.length} active subscription
              {billedSubscriptions.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="h-10 rounded-full border border-zinc-200 px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                Sign out
              </button>
            </form>
            <div className="rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-right dark:border-zinc-800 dark:bg-black">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Monthly total
              </p>
              <p className="text-2xl font-semibold text-black dark:text-zinc-50">
                {formatPrice(totalMonthly, "USD")}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <AddSubscriptionButton />
        </div>

        {subscriptions.length === 0 ? (
          <p className="mt-8 text-zinc-600 dark:text-zinc-400">
            No subscriptions yet.
          </p>
        ) : (
          <ul className="mt-8 flex flex-col gap-3">
            {subscriptions.map((subscription) => (
              <SubscriptionRow
                key={subscription.id}
                subscription={subscription}
              />
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
