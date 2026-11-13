import Link from "next/link";
import { redirect } from "next/navigation";
import {
  biggestUpcomingCharges,
  nearestCancellationDeadline,
  spendByInterval,
} from "@/lib/forecast/insights";
import {
  buildForecast,
  formatMoney,
  todayUtc,
  type CurrencyTotal,
  type ForecastInput,
  type ForecastWindowSummary,
  type ProjectedCharge,
  type RenewalDecision,
} from "@/lib/forecast/spend";
import { createClient } from "@/lib/supabase/server";
import type { BillingInterval } from "@/lib/types/subscription";

export const dynamic = "force-dynamic";

const REASON_LABELS: Record<string, string> = {
  trial_conversion: "trial converts",
  undecided_renewal: "renewal undecided",
  planned_cancel: "you plan to cancel",
  cancellation_pending: "cancellation not confirmed",
  missing_amount: "no amount recorded",
  unknown_schedule: "no interval recorded",
};

function fmtDate(day: string): string {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function CertaintyBadge({ charge }: { charge: ProjectedCharge }) {
  if (charge.certainty === "confirmed") {
    return (
      <span className="rounded bg-accent/10 px-2 py-0.5 text-xs text-accent">
        Confirmed
      </span>
    );
  }
  return (
    <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-900">
      Estimated{charge.reason ? ` · ${REASON_LABELS[charge.reason]}` : ""}
    </span>
  );
}

function Money({
  total,
  currency,
  kind,
}: {
  total: CurrencyTotal | undefined;
  currency: string;
  kind: "confirmed" | "estimated";
}) {
  const amount =
    kind === "confirmed" ? (total?.confirmedAmount ?? 0) : (total?.estimatedAmount ?? 0);
  const count =
    kind === "confirmed" ? (total?.confirmedCount ?? 0) : (total?.estimatedCount ?? 0);
  return (
    <>
      <p
        className={`text-2xl font-semibold ${kind === "estimated" ? "text-amber-900" : ""}`}
      >
        {formatMoney(amount, currency)}
      </p>
      <p className="text-xs text-ink/60">
        {count} {count === 1 ? "charge" : "charges"}
      </p>
    </>
  );
}

function WindowCard({ window }: { window: ForecastWindowSummary }) {
  const primary = window.totals[0];
  const extra = window.totals.slice(1);

  return (
    <div className="rounded-md border border-ink/10 p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <p className="text-xs uppercase tracking-wide text-ink/60">
          Next {window.months} months
        </p>
        <p className="text-xs text-ink/40">
          {fmtDate(window.from)} – {fmtDate(window.to)}
        </p>
      </div>

      <div className="mb-3">
        <p className="text-xs uppercase tracking-wide text-ink/60">
          Confirmed
        </p>
        <Money
          total={primary}
          currency={primary?.currency ?? "USD"}
          kind="confirmed"
        />
      </div>

      <div className="rounded-md border border-amber-300 bg-amber-50/60 p-3">
        <p className="text-xs uppercase tracking-wide text-amber-900/70">
          Estimated
        </p>
        <Money
          total={primary}
          currency={primary?.currency ?? "USD"}
          kind="estimated"
        />
      </div>

      {primary && primary.unknownAmountCount > 0 && (
        <p className="mt-2 text-xs text-ink/60">
          {primary.unknownAmountCount} upcoming{" "}
          {primary.unknownAmountCount === 1 ? "charge has" : "charges have"} no
          amount recorded — counted above as a number, not as money.
        </p>
      )}

      {extra.length > 0 && (
        <ul className="mt-2 space-y-1 text-xs text-ink/60">
          {extra.map((t) => (
            <li key={t.currency}>
              Also {formatMoney(t.confirmedAmount, t.currency)} confirmed and{" "}
              {formatMoney(t.estimatedAmount, t.currency)} estimated.
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Bars({
  months,
  currency,
}: {
  months: ReturnType<typeof buildForecast>["months"];
  currency: string;
}) {
  const max = Math.max(
    1,
    ...months.map((m) => m.confirmed + m.estimated),
  );

  return (
    <div>
      <div className="flex items-end gap-1.5 sm:gap-2">
        {months.map((m) => {
          const total = m.confirmed + m.estimated;
          const barHeight = (total / max) * 100;
          const confirmedShare = total > 0 ? (m.confirmed / total) * 100 : 0;
          const estimatedShare = total > 0 ? (m.estimated / total) * 100 : 0;
          return (
            <div key={m.month} className="flex-1">
              <div className="flex h-32 items-end justify-center">
                <div
                  className="flex w-full max-w-[2.25rem] flex-col justify-end"
                  style={{ height: `${barHeight}%` }}
                  title={`${m.label}: ${formatMoney(m.confirmed, currency)} confirmed, ${formatMoney(m.estimated, currency)} estimated${
                    m.unknownAmountCount > 0
                      ? `, ${m.unknownAmountCount} charge(s) with no amount`
                      : ""
                  }`}
                >
                  {m.estimated > 0 && (
                    <div
                      className="w-full border border-amber-400 bg-amber-200"
                      style={{ height: `${estimatedShare}%` }}
                    />
                  )}
                  {m.confirmed > 0 && (
                    <div
                      className="w-full bg-accent"
                      style={{ height: `${confirmedShare}%` }}
                    />
                  )}
                  {total === 0 && (
                    <div className="h-px w-full bg-ink/20" />
                  )}
                </div>
              </div>
              <p className="mt-1 text-center text-[10px] text-ink/60">
                {m.label}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-4 text-xs text-ink/60">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-accent" />
          Confirmed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm border border-amber-400 bg-amber-200" />
          Estimated
        </span>
        <span className="text-ink/40">Amounts in {currency}</span>
      </div>
    </div>
  );
}

export default async function ForecastPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: rows } = await supabase
    .from("subscriptions")
    .select(
      "id, name, status, billing_amount, currency, billing_interval, next_renewal_at, trial_end_at, cancellation_deadline_at, renewal_decision"
    )
    .eq("user_id", user.id)
    .order("next_renewal_at", { ascending: true });

  const subscriptions: ForecastInput[] = (rows ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    status: s.status,
    billingAmount: s.billing_amount == null ? null : Number(s.billing_amount),
    currency: s.currency ?? "USD",
    billingInterval: (s.billing_interval as BillingInterval | null) ?? null,
    nextRenewalAt: s.next_renewal_at,
    trialEndAt: s.trial_end_at,
    cancellationDeadlineAt:
      (s as { cancellation_deadline_at?: string | null })
        .cancellation_deadline_at ?? null,
    renewalDecision: ((s as { renewal_decision?: string | null })
      .renewal_decision ?? "undecided") as RenewalDecision,
  }));

  const today = todayUtc();
  const forecast = buildForecast(subscriptions, today);
  const biggest = biggestUpcomingCharges(forecast.charges, 5);
  const deadline = nearestCancellationDeadline(subscriptions, today);
  const byInterval = spendByInterval(
    forecast.charges,
    12,
    forecast.primaryCurrency,
  );
  const maxIntervalAverage = Math.max(
    1,
    ...byInterval.map((g) => g.monthlyAverage),
  );
  const window12 = forecast.windows[forecast.windows.length - 1];
  const undecided = window12?.undecidedCount ?? 0;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link
        href="/dashboard"
        className="mb-6 inline-block text-sm text-ink/60 hover:text-ink"
      >
        ← Dashboard
      </Link>

      <h1 className="mb-2 text-xl font-semibold">Spend forecast</h1>
      <p className="mb-6 text-sm text-ink/60">
        What your subscriptions are projected to cost over the next 3 and 12
        months. Confirmed money and estimated money are counted separately and
        never added into one number.
      </p>

      {subscriptions.length === 0 ? (
        <div className="rounded-md border border-dashed border-ink/20 p-8 text-center text-ink/60">
          <p className="mb-1">Nothing to forecast yet.</p>
          <p className="text-sm">
            <Link
              href="/dashboard/subscriptions/new"
              className="text-accent underline"
            >
              Add a subscription
            </Link>{" "}
            and its renewal dates will show up here.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-6 grid gap-3 sm:grid-cols-2">
            {forecast.windows.map((w) => (
              <WindowCard key={w.months} window={w} />
            ))}
          </div>

          <div className="mb-6 rounded-md border border-ink/10 bg-ink/[0.02] p-4 text-xs text-ink/70">
            <p className="mb-1 font-medium text-ink">How this is counted</p>
            <p>
              <span className="font-medium">Confirmed</span> — an active
              subscription with an amount and a billing interval recorded, where
              you have marked the renewal Keep.
            </p>
            <p className="mt-1">
              <span className="font-medium">Estimated</span> — trials that
              convert, renewals you haven&apos;t decided on, renewals you plan to
              cancel but haven&apos;t yet, cancellations that aren&apos;t
              confirmed, and charges with no amount recorded (counted, never
              guessed).
            </p>
            {undecided > 0 && (
              <p className="mt-1 text-ink/60">
                {undecided} upcoming{" "}
                {undecided === 1 ? "renewal is" : "renewals are"} still
                undecided —{" "}
                <Link href="/dashboard/renewals" className="text-accent underline">
                  mark them Keep on Renewals
                </Link>{" "}
                to move them into confirmed.
              </p>
            )}
          </div>

          <section className="mb-8">
            <h2 className="mb-1 text-sm font-semibold">Next 12 months</h2>
            <p className="mb-3 text-xs text-ink/60">
              Each bar is one month, split into confirmed and estimated money.
            </p>
            <Bars months={forecast.months} currency={forecast.primaryCurrency} />
          </section>

          <section className="space-y-6">
            <div>
              <h2 className="mb-1 text-sm font-semibold">
                Biggest upcoming charges
              </h2>
              {biggest.length > 0 ? (
                <ul className="divide-y divide-ink/10 rounded-md border border-ink/10">
                  {biggest.map((c) => (
                    <li
                      key={`${c.subscriptionId}-${c.date}`}
                      className="flex items-center justify-between gap-3 px-4 py-3"
                    >
                      <div>
                        <Link
                          href={`/dashboard/subscriptions/${c.subscriptionId}`}
                          className="font-medium hover:underline"
                        >
                          {c.name}
                        </Link>
                        <p className="text-xs text-ink/60">{fmtDate(c.date)}</p>
                        <div className="mt-1">
                          <CertaintyBadge charge={c} />
                        </div>
                      </div>
                      <p className="text-right font-medium">
                        {formatMoney(c.amount ?? 0, c.currency)}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-md border border-dashed border-ink/20 p-4 text-sm text-ink/60">
                  No charges with a recorded amount in the next 12 months.
                </p>
              )}
            </div>

            <div>
              <h2 className="mb-1 text-sm font-semibold">
                Nearest cancellation deadline
              </h2>
              {deadline ? (
                <div className="rounded-md border border-ink/10 p-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <Link
                      href={`/dashboard/subscriptions/${deadline.subscriptionId}`}
                      className="font-medium hover:underline"
                    >
                      {deadline.name}
                    </Link>
                    <p className="text-sm font-medium">
                      {deadline.daysUntil >= 0
                        ? `in ${deadline.daysUntil} ${deadline.daysUntil === 1 ? "day" : "days"}`
                        : `${Math.abs(deadline.daysUntil)} days ago`}
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-ink/60">
                    {fmtDate(deadline.date)}
                    {deadline.source === "recorded"
                      ? " — the merchant deadline recorded on this subscription."
                      : " — no merchant deadline recorded, so the renewal date is the deadline to cancel by."}
                  </p>
                  {deadline.amount != null && (
                    <p className="mt-1 text-xs text-ink/60">
                      {formatMoney(deadline.amount, deadline.currency)} at stake.
                      Cancelling always needs your approval in the app.
                    </p>
                  )}
                </div>
              ) : (
                <p className="rounded-md border border-dashed border-ink/20 p-4 text-sm text-ink/60">
                  No upcoming deadline — nothing live has a renewal or
                  cancellation date recorded.
                </p>
              )}
            </div>

            <div>
              <h2 className="mb-1 text-sm font-semibold">
                Spend by interval
              </h2>
              {byInterval.length > 0 ? (
                <ul className="divide-y divide-ink/10 rounded-md border border-ink/10">
                  {byInterval.map((g) => (
                    <li key={g.interval} className="px-4 py-3">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="font-medium">{g.label}</p>
                        <p className="text-sm text-ink/60">
                          {formatMoney(g.monthlyAverage, forecast.primaryCurrency)}
                          /month avg
                        </p>
                      </div>
                      <p className="mt-1 text-xs text-ink/60">
                        {formatMoney(g.confirmedAmount, forecast.primaryCurrency)}{" "}
                        confirmed ·{" "}
                        {formatMoney(g.estimatedAmount, forecast.primaryCurrency)}{" "}
                        estimated over 12 months ({g.chargeCount}{" "}
                        {g.chargeCount === 1 ? "charge" : "charges"})
                      </p>
                      <div className="mt-2 h-1.5 w-full rounded bg-ink/10">
                        <div
                          className="h-1.5 rounded bg-accent"
                          style={{
                            width: `${(g.monthlyAverage / maxIntervalAverage) * 100}%`,
                          }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-md border border-dashed border-ink/20 p-4 text-sm text-ink/60">
                  No charges with a recorded amount in the next 12 months.
                </p>
              )}
            </div>
          </section>

          <p className="mt-8 text-xs text-ink/50">
            Estimates are not charges. Nothing on this page cancels, changes, or
            contacts a merchant — every cancellation still needs your approval in
            the app.
          </p>
        </>
      )}
    </main>
  );
}
