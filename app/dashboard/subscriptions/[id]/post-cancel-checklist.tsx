import Link from "next/link";
import { flagChargeAfterCancelAction } from "@/app/dashboard/subscriptions/[id]/evidence-actions";
import {
  confirmNoChargeAction,
  schedulePostCancelChecksAction,
} from "@/app/dashboard/subscriptions/[id]/post-cancel-actions";
import type { PostCancelFollowUp } from "@/lib/notifications/post-cancel-followups";

type Props = {
  subscriptionId: string;
  status: string;
  followUps: PostCancelFollowUp[];
};

function fmt(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const STATUS_BADGE: Record<
  string,
  { label: string; note: string; className: string }
> = {
  cancellation_submitted: {
    label: "Cancellation submitted",
    note: "You sent the cancellation. The merchant has not confirmed it yet — watch for a charge on your next statement.",
    className: "border-sky-300 bg-sky-50 text-sky-900",
  },
  cancellation_confirmed: {
    label: "Cancellation confirmed by the merchant",
    note: "The merchant confirmed the cancellation. Keep checking for a while — a confirmed cancellation and a charge after cancellation are different things.",
    className: "border-accent/30 bg-accent/10 text-ink",
  },
  payment_detected_after_cancel: {
    label: "Charge detected after cancellation",
    note: "This is not a confirmed cancellation. A charge appeared after you cancelled — blocking or disputing a payment does not cancel the subscription with the merchant.",
    className: "border-amber-400 bg-amber-50 text-amber-900",
  },
};

function Check({ done }: { done: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={
        done
          ? "mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent text-[10px] text-paper"
          : "mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-ink/30 text-[10px] text-ink/40"
      }
    >
      {done ? "✓" : ""}
    </span>
  );
}

export function PostCancelChecklist({ subscriptionId, status, followUps }: Props) {
  const badge = STATUS_BADGE[status];
  if (!badge) return null;

  const confirmed = status === "cancellation_confirmed";
  const flagged = status === "payment_detected_after_cancel";
  const pending = followUps.filter((f) => !f.done);
  const answered = followUps.filter((f) => f.done);
  const dueNow = pending.filter(
    (f) => new Date(f.scheduledFor).getTime() <= Date.now()
  );
  const scheduledLater = pending.filter(
    (f) => new Date(f.scheduledFor).getTime() > Date.now()
  );

  return (
    <section className="mt-8 rounded-md border border-ink/10 p-4">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink/60">
        After cancellation
      </h2>

      <p
        className={`mb-3 rounded-md border p-3 text-sm ${badge.className}`}
      >
        <span className="block font-semibold">{badge.label}</span>
        <span className="block">{badge.note}</span>
      </p>

      <ol className="space-y-3 text-sm">
        <li className="flex gap-2">
          <Check done />
          <span>
            <span className="font-medium">Cancellation handed to the merchant.</span>{" "}
            <span className="text-ink/60">
              Nothing here contacts the merchant for you.
            </span>
          </span>
        </li>

        <li className="flex gap-2">
          <Check done={confirmed} />
          <span>
            <span className="font-medium">
              Merchant confirmed the cancellation.
            </span>{" "}
            <span className="text-ink/60">
              {confirmed
                ? "Recorded."
                : flagged
                  ? "Not confirmed — a charge was flagged instead."
                  : "Waiting on the merchant. Mark it confirmed from the cancel page when they tell you."}
            </span>
          </span>
        </li>

        <li className="flex gap-2">
          <Check done={answered.length > 0 && pending.length === 0} />
          <span className="flex-1">
            <span className="font-medium">
              Check your statement for a charge after cancelling.
            </span>{" "}
            <span className="text-ink/60">
              We prompt you 7 and 30 days after the cancellation.
            </span>

            {followUps.length === 0 ? (
              <form action={schedulePostCancelChecksAction} className="mt-2">
                <input
                  type="hidden"
                  name="subscriptionId"
                  value={subscriptionId}
                />
                <button
                  type="submit"
                  className="rounded-md border border-ink/20 px-3 py-1.5 text-xs hover:bg-ink/5"
                >
                  Schedule the 7-day and 30-day checks
                </button>
              </form>
            ) : (
              <ul className="mt-2 space-y-2">
                {[...dueNow, ...scheduledLater, ...answered].map((f) => (
                  <li
                    key={f.id}
                    className="rounded-md border border-ink/10 px-3 py-2 text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">{f.label}</span>
                      <span className="text-ink/60">
                        {f.done
                          ? f.status === "skipped"
                            ? "Checked — no charge"
                            : "Reminder delivered"
                          : new Date(f.scheduledFor).getTime() <= Date.now()
                            ? "Due now"
                            : `Due ${fmt(f.scheduledFor)}`}
                      </span>
                    </div>
                    {!f.done && !flagged && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        <form action={confirmNoChargeAction}>
                          <input
                            type="hidden"
                            name="subscriptionId"
                            value={subscriptionId}
                          />
                          <input
                            type="hidden"
                            name="notificationId"
                            value={f.id}
                          />
                          <button
                            type="submit"
                            className="rounded-md border border-ink/20 px-2 py-1 hover:bg-ink/5"
                          >
                            No charge — mark checked
                          </button>
                        </form>
                        <form action={flagChargeAfterCancelAction}>
                          <input
                            type="hidden"
                            name="subscriptionId"
                            value={subscriptionId}
                          />
                          <button
                            type="submit"
                            className="rounded-md border border-amber-400 px-2 py-1 text-amber-900 hover:bg-amber-50"
                          >
                            I was charged
                          </button>
                        </form>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </span>
        </li>

        <li className="flex gap-2">
          <Check done={flagged} />
          <span>
            <span className="font-medium">
              Flag a charge if one appears.
            </span>{" "}
            <span className="text-ink/60">
              {flagged
                ? "Flagged. This subscription is shown as payment detected after cancel, not as cancelled."
                : "Flagging keeps the charge visible and separate from a confirmed cancellation. It does not cancel anything."}
            </span>
            {!flagged && (
              <form action={flagChargeAfterCancelAction} className="mt-2">
                <input
                  type="hidden"
                  name="subscriptionId"
                  value={subscriptionId}
                />
                <button
                  type="submit"
                  className="rounded-md border border-amber-400 px-3 py-1.5 text-xs text-amber-900 hover:bg-amber-50"
                >
                  Flag charge after cancellation
                </button>
              </form>
            )}
          </span>
        </li>
      </ol>

      <p className="mt-3 text-xs text-ink/60">
        These checks land in{" "}
        <Link href="/dashboard/reminders" className="underline">
          Reminders
        </Link>{" "}
        and can be answered there. They are in-app only and never contact the
        merchant.
      </p>
    </section>
  );
}
