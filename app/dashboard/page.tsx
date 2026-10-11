import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatAnnualizedCost } from "@/lib/subscriptions/annualized-cost";
import {
  computeDashboardSummary,
  needsAttentionFilter,
} from "@/lib/dashboard/summary";
import type { BillingInterval } from "@/lib/types/subscription";

async function signOut() {
  "use server";
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

type Props = {
  searchParams: { filter?: string };
};

export default async function DashboardPage({ searchParams }: Props) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, email")
    .eq("id", user.id)
    .single();

  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select(
      "id, name, status, billing_amount, currency, billing_interval, next_renewal_at, trial_end_at, reminders_muted, merchants(name)"
    )
    .order("next_renewal_at", { ascending: true });

  const allSubs =
    subscriptions?.map((s) => ({
      id: s.id,
      name: s.name,
      status: s.status,
      billing_amount: s.billing_amount,
      currency: s.currency,
      billing_interval: s.billing_interval as BillingInterval | null,
      next_renewal_at: s.next_renewal_at,
      trial_end_at: s.trial_end_at,
      reminders_muted: s.reminders_muted,
      merchants: s.merchants,
    })) ?? [];

  const summary = computeDashboardSummary(allSubs);
  const attentionOnly = searchParams.filter === "attention";
  const visibleSubs = attentionOnly
    ? allSubs.filter(needsAttentionFilter)
    : allSubs;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm text-ink/60">Signed in as</p>
          <p className="font-medium">
            {profile?.display_name ?? profile?.email ?? user.email}
          </p>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="rounded-md border border-ink/20 px-3 py-1.5 text-sm hover:bg-ink/5"
          >
            Sign out
          </button>
        </form>
      </div>

      <nav className="mb-6 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink/60">
        <Link href="/dashboard/settings" className="hover:text-ink">
          Settings
        </Link>
        <Link href="/dashboard/renewals" className="hover:text-ink">
          Renewals
        </Link>
        <Link href="/dashboard/calendar" className="hover:text-ink">
          Calendar
        </Link>
        <Link href="/dashboard/import" className="hover:text-ink">
          Import / export
        </Link>
        <Link href="/dashboard/playbooks" className="hover:text-ink">
          Cancellation guides
        </Link>
        <Link href="/dashboard/financial" className="hover:text-ink">
          Bank monitoring
        </Link>
        <Link href="/dashboard/phase3" className="hover:text-ink">
          Payment protection
        </Link>
        <Link href="/dashboard/phase4" className="hover:text-ink">
          Browser automation
        </Link>
        <Link href="/dashboard/ultimate" className="hover:text-ink">
          Ultimate roadmap
        </Link>
      </nav>

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-md border border-ink/10 p-4">
          <p className="text-xs uppercase tracking-wide text-ink/60">
            Monthly recurring
          </p>
          <p className="text-2xl font-semibold">
            USD {summary.monthlyRecurring.toFixed(2)}
          </p>
        </div>
        <div className="rounded-md border border-ink/10 p-4">
          <p className="text-xs uppercase tracking-wide text-ink/60">
            Annual recurring
          </p>
          <p className="text-2xl font-semibold">
            USD {summary.annualRecurring.toFixed(2)}
          </p>
        </div>
        <div className="rounded-md border border-ink/10 p-4">
          <p className="text-xs uppercase tracking-wide text-ink/60">
            Renewals in 7 days
          </p>
          <p className="text-2xl font-semibold">
            {summary.renewalsIn7Days.length}
          </p>
        </div>
        <div className="rounded-md border border-ink/10 p-4">
          <p className="text-xs uppercase tracking-wide text-ink/60">
            Needs attention
          </p>
          <p className="text-2xl font-semibold">
            {summary.needsAttention.length}
          </p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Your subscriptions</h1>
        <div className="flex gap-2">
          <Link
            href="/dashboard"
            className={`rounded-md px-3 py-1.5 text-sm ${!attentionOnly ? "bg-ink text-paper" : "border border-ink/20 hover:bg-ink/5"}`}
          >
            All
          </Link>
          <Link
            href="/dashboard?filter=attention"
            className={`rounded-md px-3 py-1.5 text-sm ${attentionOnly ? "bg-ink text-paper" : "border border-ink/20 hover:bg-ink/5"}`}
          >
            Needs attention
          </Link>
          <Link
            href="/dashboard/subscriptions/new"
            className="rounded-md bg-accent px-3 py-1.5 text-sm text-paper hover:opacity-90"
          >
            Add
          </Link>
        </div>
      </div>

      {visibleSubs.length > 0 ? (
        <ul className="divide-y divide-ink/10 rounded-md border border-ink/10">
          {visibleSubs.map((s) => {
            const merchantName =
              s.merchants &&
              typeof s.merchants === "object" &&
              "name" in s.merchants
                ? (s.merchants as { name: string }).name
                : null;
            const annualized = formatAnnualizedCost(
              s.billing_amount,
              s.billing_interval,
              s.currency ?? "USD"
            );
            const attention = needsAttentionFilter(s);

            return (
              <li
                key={s.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div>
                  <Link
                    href={`/dashboard/subscriptions/${s.id}`}
                    className="font-medium hover:underline"
                  >
                    {s.name}
                  </Link>
                  <p className="text-sm text-ink/60">
                    {merchantName ? `${merchantName} · ` : ""}
                    {s.status.replace(/_/g, " ")}
                  </p>
                  {attention && (
                    <span className="mt-1 inline-block rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-900">
                      Needs attention
                    </span>
                  )}
                  {annualized && (
                    <p className="text-xs text-accent">{annualized}</p>
                  )}
                </div>
                <div className="text-right">
                  {s.billing_amount != null && (
                    <p className="font-medium">
                      {s.currency} {s.billing_amount}
                    </p>
                  )}
                  {s.next_renewal_at && (
                    <p className="text-sm text-ink/60">
                      Renews{" "}
                      {new Date(s.next_renewal_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="rounded-md border border-dashed border-ink/20 p-8 text-center text-ink/60">
          <p className="mb-1">
            {attentionOnly
              ? "Nothing needs attention right now."
              : "No subscriptions tracked yet."}
          </p>
          {!attentionOnly && (
            <p className="text-sm">
              <Link
                href="/dashboard/subscriptions/new"
                className="text-accent underline"
              >
                Add your first subscription
              </Link>{" "}
              to start tracking renewals and cancellations.
            </p>
          )}
        </div>
      )}
    </main>
  );
}
