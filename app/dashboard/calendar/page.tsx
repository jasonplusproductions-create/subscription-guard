import Link from "next/link";
import { getRenewalItems } from "@/lib/subscriptions/get-renewal-items";
import {
  monthGrid,
  monthKey,
  parseMonthParam,
  shiftMonth,
  todayUtc,
  type RenewalItem,
} from "@/lib/subscriptions/renewals";

type Props = { searchParams: { m?: string } };

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function CalendarPage({ searchParams }: Props) {
  const today = todayUtc();
  const { year, month } = parseMonthParam(searchParams.m, today);
  const prev = shiftMonth(year, month, -1);
  const next = shiftMonth(year, month, 1);

  const items = await getRenewalItems();
  const byDay = new Map<string, RenewalItem[]>();
  for (const it of items) {
    const list = byDay.get(it.date) ?? [];
    list.push(it);
    byDay.set(it.date, list);
  }

  const weeks = monthGrid(year, month);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link
        href="/dashboard"
        className="mb-6 inline-block text-sm text-ink/60 hover:text-ink"
      >
        ← Dashboard
      </Link>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">
          {MONTHS[month - 1]} {year}
        </h1>
        <div className="flex gap-2 text-sm">
          <Link
            href={`/dashboard/calendar?m=${monthKey(prev.year, prev.month)}`}
            className="rounded-md border border-ink/20 px-3 py-1.5 hover:bg-ink/5"
          >
            ← Prev
          </Link>
          <Link
            href="/dashboard/calendar"
            className="rounded-md border border-ink/20 px-3 py-1.5 hover:bg-ink/5"
          >
            Today
          </Link>
          <Link
            href={`/dashboard/calendar?m=${monthKey(next.year, next.month)}`}
            className="rounded-md border border-ink/20 px-3 py-1.5 hover:bg-ink/5"
          >
            Next →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-md border border-ink/10 bg-ink/10 text-xs">
        {DOW.map((d) => (
          <div key={d} className="bg-paper px-1 py-1 text-center text-ink/60">
            {d}
          </div>
        ))}
        {weeks.flat().map((day, i) => {
          if (!day) return <div key={i} className="min-h-16 bg-paper/60" />;
          const list = byDay.get(day) ?? [];
          return (
            <div
              key={day}
              className={`min-h-16 bg-paper p-1 ${day === today ? "ring-1 ring-inset ring-accent" : ""}`}
            >
              <p className="mb-1 text-ink/60">{Number(day.slice(8))}</p>
              <ul className="space-y-0.5">
                {list.map((it) => (
                  <li key={`${it.id}-${it.kind}`}>
                    <Link
                      href={`/dashboard/subscriptions/${it.id}`}
                      className={`block truncate rounded px-1 py-0.5 ${it.kind === "trial_end" ? "bg-amber-100 text-amber-900" : "bg-accent/15"}`}
                      title={`${it.name} · ${it.kind === "trial_end" ? "trial ends" : "renews"}`}
                    >
                      {it.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-ink/60">
        Green: renewal. Amber: trial ends. Dates shown in UTC.
      </p>
    </main>
  );
}
