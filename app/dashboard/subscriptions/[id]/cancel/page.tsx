import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCancellationPageData,
  markCancellationSentAction,
  updateCancellationStatusAction,
} from "@/app/dashboard/subscriptions/[id]/cancel/actions";
import { CancellationApprovalPanel } from "@/app/dashboard/subscriptions/[id]/cancel/cancellation-approval-panel";
import { buildCancellationMessageDraft } from "@/lib/cancellation/message-draft";

type Props = {
  params: { id: string };
  searchParams: { error?: string; approved?: string; sent?: string };
};

export default async function CancelSubscriptionPage({
  params,
  searchParams,
}: Props) {
  const data = await getCancellationPageData(params.id);
  if (!data) notFound();

  const { subscription, merchant, accountEmail, latestRequest, attempts } =
    data;

  const messageDraft = buildCancellationMessageDraft({
    merchantName: merchant.name,
    subscriptionName: subscription.name,
    accountEmail,
  });

  const approved =
    Boolean(latestRequest?.user_approved_at) ||
    searchParams.approved === "1";

  const showRetry =
    subscription.status === "cancellation_failed" ||
    latestRequest?.status === "failed";

  return (
    <main className="mx-auto max-w-lg px-6 py-10">
      <Link
        href={`/dashboard/subscriptions/${params.id}`}
        className="mb-6 inline-block text-sm text-ink/60 hover:text-ink"
      >
        ← Back to subscription
      </Link>

      <h1 className="mb-2 text-xl font-semibold">Cancel subscription</h1>
      <p className="mb-2 text-sm text-ink/60">
        {subscription.name} · {merchant.name}
      </p>
      <p className="mb-6 text-sm capitalize text-ink/80">
        Status: {subscription.status.replace(/_/g, " ")}
      </p>

      {searchParams.error && (
        <p className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {searchParams.error}
        </p>
      )}

      {searchParams.sent === "1" && (
        <p className="mb-4 rounded-md border border-accent/30 bg-accent/10 p-3 text-sm">
          Marked as sent. Update status when you hear back from the merchant.
        </p>
      )}

      {showRetry && (
        <div className="mb-6 rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">Cancellation needs another try</p>
          <p className="mt-1">
            Your last attempt was marked failed. Review the message and try
            again, or update the status once you have confirmation.
          </p>
        </div>
      )}

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink/60">
          Draft message
        </h2>
        <pre className="mb-4 whitespace-pre-wrap rounded-md border border-ink/10 bg-white p-4 text-sm">
          {messageDraft}
        </pre>
        <CancellationApprovalPanel
          subscriptionId={params.id}
          messageDraft={messageDraft}
          approved={approved}
        />
      </section>

      {merchant.cancellation_url && (
        <p className="mb-6 text-sm">
          Merchant cancellation page:{" "}
          <a
            href={merchant.cancellation_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent underline"
          >
            Open cancellation URL
          </a>
          . You must complete any form yourself — the app will not submit it.
        </p>
      )}

      {approved && latestRequest && (
        <section className="mb-8 space-y-4 border-t border-ink/10 pt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/60">
            After you send
          </h2>

          <form action={markCancellationSentAction}>
            <input type="hidden" name="subscriptionId" value={params.id} />
            <input type="hidden" name="requestId" value={latestRequest.id} />
            <input type="hidden" name="messageBody" value={messageDraft} />
            <button
              type="submit"
              className="rounded-md border border-ink/20 px-4 py-2 text-sm hover:bg-ink/5"
            >
              Mark as sent via email
            </button>
          </form>

          <div className="flex flex-wrap gap-2">
            <form action={updateCancellationStatusAction}>
              <input type="hidden" name="subscriptionId" value={params.id} />
              <input type="hidden" name="requestId" value={latestRequest.id} />
              <input
                type="hidden"
                name="newStatus"
                value="cancellation_confirmed"
              />
              <button
                type="submit"
                className="rounded-md bg-accent px-3 py-1.5 text-sm text-paper"
              >
                Merchant confirmed cancellation
              </button>
            </form>
            <form action={updateCancellationStatusAction}>
              <input type="hidden" name="subscriptionId" value={params.id} />
              <input type="hidden" name="requestId" value={latestRequest.id} />
              <input
                type="hidden"
                name="newStatus"
                value="cancellation_failed"
              />
              <button
                type="submit"
                className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-700"
              >
                Attempt failed — retry
              </button>
            </form>
          </div>
        </section>
      )}

      {attempts.length > 0 && (
        <section className="border-t border-ink/10 pt-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink/60">
            Attempt history
          </h2>
          <ul className="divide-y divide-ink/10 rounded-md border border-ink/10 text-sm">
            {attempts.map((a) => (
              <li key={a.id} className="px-3 py-2">
                <span className="font-medium capitalize">{a.result}</span>
                <span className="text-ink/60">
                  {" "}
                  · {new Date(a.attempted_at).toLocaleString()}
                </span>
                {a.response_notes && (
                  <p className="text-ink/60">{a.response_notes}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
