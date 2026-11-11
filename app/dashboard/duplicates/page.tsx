import Link from "next/link";
import { redirect } from "next/navigation";
import {
  OVERLAP_WINDOW_DAYS,
  findDuplicateGroups,
  type DuplicateCandidate,
} from "@/lib/subscriptions/duplicates";
import { createClient } from "@/lib/supabase/server";

export default async function DuplicatesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select(
      "id, name, status, billing_amount, currency, next_renewal_at, merchant_id, merchants(name)"
    )
    .eq("user_id", user.id)
    .order("next_renewal_at", { ascending: true });

  const candidates: DuplicateCandidate[] = (subscriptions ?? []).map((s) => {
    const m = s.merchants as { name?: string } | { name?: string }[] | null;
    return {
      id: s.id,
      name: s.name,
      status: s.status,
      merchantId: s.merchant_id ?? "",
      merchantName: (Array.isArray(m) ? m[0]?.name : m?.name) ?? "",
      billingAmount: s.billing_amount,
      currency: s.currency ?? "USD",
      nextRenewalAt: s.next_renewal_at,
    };
  });

  const groups = findDuplicateGroups(candidates);

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Link
        href="/dashboard"
        className="mb-6 inline-block text-sm text-ink/60 hover:text-ink"
      >
        ← Dashboard
      </Link>

      <h1 className="mb-2 text-xl font-semibold">Possible duplicates</h1>
      <p className="mb-6 text-sm text-ink/60">
        Subscriptions from the same merchant, or with renewals within{" "}
        {OVERLAP_WINDOW_DAYS} days of each other. This is only a flag — nothing
        is merged, changed, or cancelled for you. Archived subscriptions are
        ignored.
      </p>

      {groups.length > 0 ? (
        <ul className="space-y-4">
          {groups.map((group) => (
            <li
              key={group.key}
              className="rounded-md border border-amber-300 bg-amber-50/60 p-4"
            >
              <p className="mb-1 text-sm font-medium text-amber-900">
                {group.kind === "same_merchant"
                  ? "Same merchant"
                  : "Overlapping renewals"}
              </p>
              <p className="mb-3 text-sm text-ink/70">{group.reason}</p>
              <ul className="divide-y divide-ink/10 rounded-md border border-ink/10 bg-paper text-sm">
                {group.subscriptions.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between px-3 py-2"
                  >
                    <div>
                      <Link
                        href={`/dashboard/subscriptions/${s.id}`}
                        className="font-medium hover:underline"
                      >
                        {s.name}
                      </Link>
                      <p className="text-xs text-ink/60">
                        {s.merchantName || "Unknown merchant"} ·{" "}
                        {s.status.replace(/_/g, " ")}
                      </p>
                    </div>
                    <div className="text-right text-xs text-ink/60">
                      {s.billingAmount != null && (
                        <p className="font-medium text-ink">
                          {s.currency} {Number(s.billingAmount).toFixed(2)}
                        </p>
                      )}
                      {s.nextRenewalAt && (
                        <p>
                          Renews{" "}
                          {new Date(s.nextRenewalAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-md border border-dashed border-ink/20 p-8 text-center text-ink/60">
          <p className="mb-1">No duplicates or overlaps found.</p>
          <p className="text-sm">
            Nothing is tracked twice from the same merchant, and no two
            renewals fall within {OVERLAP_WINDOW_DAYS} days of each other.
          </p>
        </div>
      )}
    </main>
  );
}
