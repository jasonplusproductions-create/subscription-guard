import Link from "next/link";
import { getRenewalItems } from "@/lib/subscriptions/get-renewal-items";
import {
  daysUntil,
  formatAmount,
  groupRenewals,
  type RenewalItem,
} from "@/lib/subscriptions/renewals";
import { renewalDecisionLabel } from "@/lib/subscriptions/renewal-decision";

function whenLabel(item: RenewalItem): string {
  const d = daysUntil(item.date);
  if (d < 0) return `${Math.abs(d)} day${d === -1 ? "" : "s"} ago`;
  if (d === 0) return "today";
  if (d === 1) return "tomorrow";
  return `in ${d} days`;
}

function Row({ item }: { item: RenewalItem }) {
  const amount = formatAmount(item.amount, item.currency);
  return (
    <li>
      <Link
        href={`/dashboard/subscriptions/${item.id}`}
        className="flex items-start justify-between gap-3 px-3 py-3 text-sm hover:bg-ink/5"
      >
        <span>
          <span className="font-medium">{item.name}</span>
          {item.merchantName && (
            <span className="text-ink/60"> · {item.merchantName}</span>
          )}
          <span className="block text-ink/60">
            {item.kind === "trial_end" ? "Trial ends" : "Renews"} {item.date} (
            {whenLabel(item)})
            {amount && item.kind === "renewal" ? ` · ${amount}` : ""}
          </span>
        </span>
        <span className="shrink-0 text-right text-xs text-ink/60">
          {renewalDecisionLabel(item.decision)}
        </span>
      </Link>
    </li>
  );
}

function Section({ title, items }: { title: string; items: RenewalItem[] }) {
  if (items.length === 0) return null;
  return (
    <section className="mb-6">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink/60">
        {title}
      </h2>
      <ul className="divide-y divide-ink/10 rounded-md border border-ink/10">
        {items.map((i) => (
          <Row key={`${i.id}-${i.kind}`} item={i} />
        ))}
      </ul>
    </section>
  );
}

export default async function RenewalsPage() {
  const items = await getRenewalItems();
  const g = groupRenewals(items);

  return (
    <main className="mx-auto max-w-lg px-6 py-10">
      <Link
        href="/dashboard"
        className="mb-6 inline-block text-sm text-ink/60 hover:text-ink"
      >
        ← Dashboard
      </Link>
      <div className="mb-6 flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Upcoming renewals</h1>
        <Link
          href="/dashboard/calendar"
          className="rounded-md border border-ink/20 px-3 py-1.5 text-sm hover:bg-ink/5"
        >
          Calendar
        </Link>
      </div>

      {items.length === 0 && (
        <p className="text-sm text-ink/60">
          No renewal or trial dates yet. Add a subscription with a renewal date
          and it will show up here.
        </p>
      )}

      <Section title="Past date, check these" items={g.overdue} />
      <Section title="Next 7 days" items={g.next7} />
      <Section title="8 to 30 days" items={g.next30} />
      <Section title="Later" items={g.later} />
    </main>
  );
}
