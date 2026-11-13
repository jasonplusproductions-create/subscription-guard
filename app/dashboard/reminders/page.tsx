import Link from "next/link";
import { redirect } from "next/navigation";
import { flagChargeAfterCancelAction } from "@/app/dashboard/subscriptions/[id]/evidence-actions";
import { confirmNoChargeAction } from "@/app/dashboard/subscriptions/[id]/post-cancel-actions";
import { buildInbox, type InboxItem, type InboxRow } from "@/lib/notifications/inbox";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function fmt(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function PostCancelActions({ item }: { item: InboxItem }) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      <form action={confirmNoChargeAction}>
        <input type="hidden" name="subscriptionId" value={item.subscriptionId} />
        <input type="hidden" name="notificationId" value={item.id} />
        <button
          type="submit"
          className="rounded-md border border-ink/20 px-2 py-1 text-xs hover:bg-ink/5"
        >
          No charge — mark checked
        </button>
      </form>
      <form action={flagChargeAfterCancelAction}>
        <input type="hidden" name="subscriptionId" value={item.subscriptionId} />
        <button
          type="submit"
          className="rounded-md border border-amber-400 px-2 py-1 text-xs text-amber-900 hover:bg-amber-50"
        >
          I was charged
        </button>
      </form>
    </div>
  );
}

function Row({ item, actionable }: { item: InboxItem; actionable: boolean }) {
  return (
    <li className="px-4 py-3">
      <Link
        href={`/dashboard/subscriptions/${item.subscriptionId}`}
        className="font-medium hover:underline"
      >
        {item.subscriptionName}
      </Link>{" "}
      <span className="text-ink/80">{item.message}</span>
      {item.kind === "post_cancel" && (
        <span className="ml-1 rounded border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[11px] text-amber-900">
          after cancellation
        </span>
      )}
      <p className="text-xs text-ink/60">
        {item.renewsAt ? `Renews ${fmt(item.renewsAt)}. ` : ""}
        {item.kind === "post_cancel" ? "Check due" : "Reminder date"}{" "}
        {fmt(item.when)}.
        {item.delivered ? " Also emailed." : ""}
      </p>
      {item.kind === "post_cancel" && actionable && (
        <PostCancelActions item={item} />
      )}
    </li>
  );
}

export default async function RemindersPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("notifications")
    .select(
      "id, notification_type, scheduled_for, status, subscriptions(id, name, status, next_renewal_at, reminders_muted, reminders_snoozed_until)"
    )
    .eq("user_id", user.id)
    .order("scheduled_for", { ascending: true })
    .limit(300);

  const rows: InboxRow[] = (data ?? []).map((n) => {
    const s = n.subscriptions as unknown;
    const sub = Array.isArray(s) ? s[0] : s;
    return {
      id: n.id,
      notification_type: n.notification_type,
      scheduled_for: n.scheduled_for,
      status: n.status,
      subscription: (sub as InboxRow["subscription"]) ?? null,
    };
  });

  const { due, upcoming } = buildInbox(rows);

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Link
        href="/dashboard"
        className="mb-6 inline-block text-sm text-ink/60 hover:text-ink"
      >
        ← Dashboard
      </Link>
      <h1 className="mb-2 text-xl font-semibold">Reminders</h1>
      <p className="mb-6 text-sm text-ink/60">
        Renewal heads-ups, plus charge checks after you cancel. Muted, snoozed,
        and archived subscriptions are left out. Nothing here contacts a
        merchant, and flagging a charge never marks a subscription as cancelled.
      </p>

      {error && (
        <p className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Could not load reminders. Try again shortly.
        </p>
      )}

      <section className="mb-8">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink/60">
          Needs a look ({due.length})
        </h2>
        {due.length > 0 ? (
          <ul className="divide-y divide-ink/10 rounded-md border border-ink/10">
            {due.map((i) => (
              <Row key={i.id} item={i} actionable />
            ))}
          </ul>
        ) : (
          <p className="rounded-md border border-dashed border-ink/20 p-6 text-center text-sm text-ink/60">
            You are all caught up.
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink/60">
          Coming up ({upcoming.length})
        </h2>
        {upcoming.length > 0 ? (
          <ul className="divide-y divide-ink/10 rounded-md border border-ink/10">
            {upcoming.slice(0, 30).map((i) => (
              <Row key={i.id} item={i} actionable={false} />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink/60">No scheduled reminders.</p>
        )}
      </section>
    </main>
  );
}
