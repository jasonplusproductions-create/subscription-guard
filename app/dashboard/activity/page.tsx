import Link from "next/link";
import { redirect } from "next/navigation";
import {
  actionLabel,
  entityLabel,
  eventSummary,
  type AuditEventRow,
} from "@/lib/activity/format";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

type Props = {
  searchParams: { action?: string; entity?: string; page?: string };
};

function fmt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function parsePage(raw: string | undefined): number {
  const n = Number.parseInt(raw ?? "1", 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return n;
}

export default async function ActivityPage({ searchParams }: Props) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const action = (searchParams.action ?? "").trim();
  const entity = (searchParams.entity ?? "").trim();
  const page = parsePage(searchParams.page);
  const from = (page - 1) * PAGE_SIZE;

  // Filter options come from the actions and entity types this account has
  // actually produced, so the dropdowns never offer empty results.
  const { data: facetRows } = await supabase
    .from("audit_events")
    .select("action, entity_type")
    .eq("user_id", user.id)
    .limit(1000);

  const actionOptions = Array.from(
    new Set(
      (facetRows ?? [])
        .map((r) => r.action as string | null)
        .filter((a): a is string => Boolean(a))
    )
  ).sort((a, b) => actionLabel(a).localeCompare(actionLabel(b)));

  const entityOptions = Array.from(
    new Set(
      (facetRows ?? [])
        .map((r) => r.entity_type as string | null)
        .filter((e): e is string => Boolean(e))
    )
  ).sort((a, b) => entityLabel(a).localeCompare(entityLabel(b)));

  let query = supabase
    .from("audit_events")
    .select("id, action, entity_type, entity_id, metadata, created_at", {
      count: "exact",
    })
    .eq("user_id", user.id);

  if (action) query = query.eq("action", action);
  if (entity) query = query.eq("entity_type", entity);

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  const events: AuditEventRow[] = (data ?? []).map((r) => ({
    id: r.id,
    action: r.action,
    entity_type: r.entity_type,
    entity_id: r.entity_id,
    metadata: r.metadata,
    created_at: r.created_at,
  }));

  // Resolve subscription names for the entity column in one extra read.
  const subIds = Array.from(
    new Set(
      events
        .filter((e) => e.entity_type === "subscription" && e.entity_id)
        .map((e) => e.entity_id as string)
    )
  );
  const subNames = new Map<string, string>();
  if (subIds.length > 0) {
    const { data: subs } = await supabase
      .from("subscriptions")
      .select("id, name")
      .in("id", subIds);
    for (const s of subs ?? []) {
      subNames.set(s.id as string, s.name as string);
    }
  }

  const total = count ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function hrefFor(target: { page?: number; action?: string; entity?: string }) {
    const params = new URLSearchParams();
    const a = target.action ?? action;
    const e = target.entity ?? entity;
    const p = target.page ?? page;
    if (a) params.set("action", a);
    if (e) params.set("entity", e);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/dashboard/activity?${qs}` : "/dashboard/activity";
  }

  const filtered = Boolean(action || entity);

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Link
        href="/dashboard"
        className="mb-6 inline-block text-sm text-ink/60 hover:text-ink"
      >
        ← Dashboard
      </Link>
      <h1 className="mb-2 text-xl font-semibold">Activity</h1>
      <p className="mb-6 text-sm text-ink/60">
        Everything that has happened in your account, newest first. This is a
        read-only history — it never changes a subscription&apos;s current
        state, and nothing here contacts a merchant.
      </p>

      {error && (
        <p className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Could not load your activity. Try again shortly.
        </p>
      )}

      <form
        method="get"
        className="mb-6 flex flex-wrap items-end gap-3 rounded-md border border-ink/10 p-3 text-sm"
      >
        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-ink/60">
            Action
          </span>
          <select
            name="action"
            defaultValue={action}
            className="rounded-md border border-ink/20 bg-paper px-2 py-1.5"
          >
            <option value="">All actions</option>
            {actionOptions.map((a) => (
              <option key={a} value={a}>
                {actionLabel(a)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-ink/60">
            Entity
          </span>
          <select
            name="entity"
            defaultValue={entity}
            className="rounded-md border border-ink/20 bg-paper px-2 py-1.5"
          >
            <option value="">All entities</option>
            {entityOptions.map((e) => (
              <option key={e} value={e}>
                {entityLabel(e)}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          className="rounded-md border border-ink/20 px-3 py-1.5 hover:bg-ink/5"
        >
          Apply
        </button>
        {filtered && (
          <Link
            href="/dashboard/activity"
            className="text-ink/60 hover:text-ink"
          >
            Clear filters
          </Link>
        )}
      </form>

      <p className="mb-2 text-sm text-ink/60">
        {total === 0
          ? "No events"
          : `${total} event${total === 1 ? "" : "s"}`}
        {filtered ? " match this filter" : ""}
        {total > 0 ? ` · page ${page} of ${lastPage}` : ""}
      </p>

      {events.length > 0 ? (
        <ul className="divide-y divide-ink/10 rounded-md border border-ink/10">
          {events.map((e) => {
            const summary = eventSummary(e);
            const isSubscription = e.entity_type === "subscription";
            const subName =
              isSubscription && e.entity_id
                ? subNames.get(e.entity_id)
                : undefined;
            return (
              <li key={e.id} className="px-4 py-3">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <p className="font-medium">{actionLabel(e.action)}</p>
                  <time
                    dateTime={e.created_at}
                    title={e.created_at}
                    className="text-xs text-ink/60"
                  >
                    {fmt(e.created_at)}
                  </time>
                </div>
                {summary && (
                  <p className="text-sm text-ink/80">{summary}</p>
                )}
                <p className="text-xs text-ink/60">
                  {isSubscription && e.entity_id && subName ? (
                    <Link
                      href={`/dashboard/subscriptions/${e.entity_id}`}
                      className="hover:text-ink hover:underline"
                    >
                      {subName}
                    </Link>
                  ) : isSubscription ? (
                    <span>Subscription no longer in your list</span>
                  ) : (
                    <span>{entityLabel(e.entity_type)}</span>
                  )}
                </p>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="rounded-md border border-dashed border-ink/20 p-6 text-center text-sm text-ink/60">
          {filtered
            ? "No events match these filters."
            : "Nothing has happened yet. Add a subscription and it will show up here."}
        </p>
      )}

      {lastPage > 1 && (
        <nav className="mt-6 flex items-center justify-between text-sm">
          {page > 1 ? (
            <Link
              href={hrefFor({ page: page - 1 })}
              className="rounded-md border border-ink/20 px-3 py-1.5 hover:bg-ink/5"
            >
              ← Newer
            </Link>
          ) : (
            <span />
          )}
          {page < lastPage ? (
            <Link
              href={hrefFor({ page: page + 1 })}
              className="rounded-md border border-ink/20 px-3 py-1.5 hover:bg-ink/5"
            >
              Older →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </main>
  );
}
