import Link from "next/link";
import { notFound } from "next/navigation";
import { EditSubscriptionForm } from "@/app/dashboard/subscriptions/[id]/edit-subscription-form";
import { CancellationTimeline } from "@/app/dashboard/subscriptions/[id]/cancellation-timeline";
import {
  flagChargeAfterCancelAction,
  getCancellationTimeline,
  getEvidenceSignedUrl,
  uploadEvidenceAction,
} from "@/app/dashboard/subscriptions/[id]/evidence-actions";
import {
  archiveSubscriptionAction,
  deleteSubscriptionAction,
  getSubscriptionForEdit,
  setRenewalDecisionAction,
  snoozeRemindersAction,
  toggleRemindersMutedAction,
} from "@/app/dashboard/subscriptions/actions";
import { formatAnnualizedCost } from "@/lib/subscriptions/annualized-cost";
import {
  PRICE_CHANGE_SOURCE_LABELS,
  formatPriceChange,
  getPriceHistory,
} from "@/lib/subscriptions/price-history";
import { createClient } from "@/lib/supabase/server";
import {
  RENEWAL_DECISIONS,
  renewalDecisionLabel,
} from "@/lib/subscriptions/renewal-decision";
import type { BillingInterval } from "@/lib/types/subscription";

type Props = {
  params: { id: string };
  searchParams: { error?: string; evidence?: string; flagged?: string };
};

export default async function SubscriptionDetailPage({
  params,
  searchParams,
}: Props) {
  const data = await getSubscriptionForEdit(params.id);
  if (!data) notFound();

  const timeline = await getCancellationTimeline(params.id);
  const priceHistory = await getPriceHistory(createClient(), params.id);
  const evidenceWithUrls = await Promise.all(
    timeline.evidence.map(async (e) => ({
      ...e,
      signedUrl: await getEvidenceSignedUrl(e.storage_path),
    }))
  );

  const { subscription, merchant } = data;
  const annualized = formatAnnualizedCost(
    subscription.billing_amount,
    subscription.billing_interval as BillingInterval | null,
    subscription.currency ?? "USD"
  );

  const defaults = {
    merchantName: merchant.name,
    name: subscription.name,
    billingAmount:
      subscription.billing_amount != null
        ? String(subscription.billing_amount)
        : "",
    currency: subscription.currency ?? "USD",
    billingInterval: subscription.billing_interval ?? "monthly",
    trialStartAt: subscription.trial_start_at,
    trialEndAt: subscription.trial_end_at,
    nextRenewalAt: subscription.next_renewal_at,
    cancellationUrl: merchant.cancellation_url ?? "",
    supportEmail: merchant.support_email ?? "",
    notes: subscription.notes ?? "",
    status: subscription.status,
  };

  return (
    <main className="mx-auto max-w-lg px-6 py-10">
      <Link
        href="/dashboard"
        className="mb-6 inline-block text-sm text-ink/60 hover:text-ink"
      >
        ← Back to dashboard
      </Link>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">{subscription.name}</h1>
          <p className="text-sm text-ink/60">{merchant.name}</p>
          <p className="mt-1 text-sm capitalize text-ink/80">
            Status: {subscription.status.replace(/_/g, " ")}
          </p>
          {annualized && (
            <p className="mt-1 text-sm font-medium text-accent">
              Annualized: {annualized}
            </p>
          )}
        </div>
        {subscription.status !== "archived" && (
          <Link
            href={`/dashboard/subscriptions/${params.id}/cancel`}
            className="shrink-0 rounded-md border border-ink/20 px-3 py-1.5 text-sm hover:bg-ink/5"
          >
            Cancel…
          </Link>
        )}
      </div>

      {searchParams.error && (
        <p className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {searchParams.error}
        </p>
      )}

      {searchParams.evidence === "uploaded" && (
        <p className="mb-4 rounded-md border border-accent/30 bg-accent/10 p-3 text-sm">
          Evidence uploaded successfully.
        </p>
      )}

      {searchParams.flagged === "1" && (
        <p className="mb-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          Subscription marked as{" "}
          <span className="font-medium">payment detected after cancel</span>.
          This is distinct from merchant cancellation confirmed.
        </p>
      )}

      {subscription.status === "payment_detected_after_cancel" && (
        <p className="mb-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          A charge was flagged after cancellation. Blocking a payment is not
          the same as canceling with the merchant.
        </p>
      )}

      {subscription.status !== "archived" && (
        <section className="mb-6 rounded-md border border-ink/10 p-4">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-ink/60">
            Next renewal
          </h2>
          <p className="mb-3 text-sm text-ink/60">
            Your call: {renewalDecisionLabel(subscription.renewal_decision)}.
            This only records your intent. Nothing is sent to the merchant,
            and choosing Cancel takes you to the approval step.
          </p>
          <div className="flex flex-wrap gap-2">
            {RENEWAL_DECISIONS.map((d) => (
              <form key={d.value} action={setRenewalDecisionAction}>
                <input type="hidden" name="subscriptionId" value={params.id} />
                <input type="hidden" name="decision" value={d.value} />
                <button
                  type="submit"
                  className={
                    (subscription.renewal_decision ?? "undecided") === d.value
                      ? "rounded-md bg-accent px-3 py-1.5 text-sm text-paper"
                      : "rounded-md border border-ink/20 px-3 py-1.5 text-sm hover:bg-ink/5"
                  }
                >
                  {d.label}
                </button>
              </form>
            ))}
          </div>
        </section>
      )}

      <EditSubscriptionForm subscriptionId={params.id} defaults={defaults} />

      <section className="mt-8 rounded-md border border-ink/10 p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink/60">
          Price history
        </h2>
        {priceHistory.length > 0 ? (
          <ul className="divide-y divide-ink/10 text-sm">
            {priceHistory.map((change) => (
              <li
                key={change.id}
                className="flex items-center justify-between py-2"
              >
                <span className="font-medium">{formatPriceChange(change)}</span>
                <span className="text-xs text-ink/60">
                  {new Date(change.changed_at).toLocaleDateString()} ·{" "}
                  {PRICE_CHANGE_SOURCE_LABELS[change.source] ?? change.source}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink/60">
            No price changes recorded yet. Changing the amount here, or
            importing a CSV with a different price, adds an entry.
          </p>
        )}
      </section>

      <section className="mt-8 rounded-md border border-ink/10 p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink/60">
          Reminder preferences
        </h2>
        <p className="mb-3 text-sm text-ink/60">
          {subscription.reminders_muted
            ? "Renewal reminders are muted for this subscription."
            : "Renewal reminders are scheduled at 7 days, 3 days, and 24 hours before renewal."}
        </p>
        <div className="flex flex-wrap gap-2">
          <form action={toggleRemindersMutedAction}>
            <input type="hidden" name="subscriptionId" value={params.id} />
            <button
              type="submit"
              className="rounded-md border border-ink/20 px-3 py-1.5 text-sm hover:bg-ink/5"
            >
              {subscription.reminders_muted ? "Unmute reminders" : "Mute reminders"}
            </button>
          </form>
          <form action={snoozeRemindersAction}>
            <input type="hidden" name="subscriptionId" value={params.id} />
            <input type="hidden" name="days" value="7" />
            <button
              type="submit"
              className="rounded-md border border-ink/20 px-3 py-1.5 text-sm hover:bg-ink/5"
            >
              Snooze 7 days
            </button>
          </form>
        </div>
      </section>

      {subscription.status !== "archived" && (
        <form action={archiveSubscriptionAction} className="mt-8">
          <input type="hidden" name="subscriptionId" value={params.id} />
          <button
            type="submit"
            className="text-sm text-ink/70 underline hover:text-ink"
          >
            Archive this subscription
          </button>
        </form>
      )}

      <form action={deleteSubscriptionAction} className="mt-6 border-t border-ink/10 pt-6">
        <input type="hidden" name="subscriptionId" value={params.id} />
        <p className="mb-2 text-sm font-medium text-red-800">
          Permanently delete
        </p>
        <p className="mb-3 text-sm text-ink/60">
          This removes the subscription and cannot be undone.
        </p>
        <label className="mb-3 flex items-center gap-2 text-sm">
          <input type="checkbox" name="confirmDelete" value="yes" required />
          I understand this is permanent
        </label>
        <button
          type="submit"
          className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
        >
          Delete subscription
        </button>
      </form>

      <section className="mt-10 border-t border-ink/10 pt-8">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink/60">
          Evidence
        </h2>
        <form action={uploadEvidenceAction} className="mb-6 flex flex-col gap-3">
          <input type="hidden" name="subscriptionId" value={params.id} />
          <input
            name="file"
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            required
            className="text-sm"
          />
          <input
            name="description"
            placeholder="Description (optional)"
            className="rounded-md border border-ink/20 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="w-fit rounded-md border border-ink/20 px-3 py-1.5 text-sm hover:bg-ink/5"
          >
            Upload evidence
          </button>
        </form>

        {evidenceWithUrls.length > 0 && (
          <ul className="mb-6 space-y-2 text-sm">
            {evidenceWithUrls.map((e) => (
              <li key={e.id} className="flex items-center justify-between">
                <span>
                  {e.evidence_type}
                  {e.description ? ` · ${e.description}` : ""}
                </span>
                {e.signedUrl && (
                  <a
                    href={e.signedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent underline"
                  >
                    View
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}

        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink/60">
          Cancellation timeline
        </h2>
        <CancellationTimeline
          requests={timeline.requests}
          attempts={timeline.attempts}
          evidence={timeline.evidence}
        />

        {(subscription.status === "cancellation_confirmed" ||
          subscription.status === "cancellation_submitted") && (
          <form action={flagChargeAfterCancelAction} className="mt-6">
            <input type="hidden" name="subscriptionId" value={params.id} />
            <button
              type="submit"
              className="rounded-md border border-amber-400 px-3 py-1.5 text-sm text-amber-900 hover:bg-amber-50"
            >
              Flag charge after cancellation
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
