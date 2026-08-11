import Link from "next/link";

export default function FinancialDashboardPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Link
        href="/dashboard"
        className="mb-6 inline-block text-sm text-ink/60 hover:text-ink"
      >
        ← Dashboard
      </Link>
      <h1 className="mb-2 text-xl font-semibold">Bank & card monitoring</h1>
      <p className="mb-4 text-sm text-ink/60">Launch 2 · Phase 2</p>

      <div className="rounded-md border border-dashed border-ink/20 p-6 text-sm text-ink/70">
        <p className="mb-3">
          Financial account connection (Plaid or equivalent) is scaffolded in{" "}
          <code className="text-xs">supabase/migrations/20260815000000_phase2_financial_schema.sql</code>
          . Connecting requires provider API credentials as server-only secrets.
        </p>
        <p className="mb-3">
          {/* TODO(human): Wire PLAID_CLIENT_ID, PLAID_SECRET, and Link token route. */}
          When connected, this page will show: linked accounts, a recurring-charge
          review queue, price-change alerts, and post-cancellation charge detection.
          Matches are never auto-confirmed — you must accept each one.
        </p>
        <p>
          CSV import fallback and disconnect-and-delete workflow ship with the
          provider integration.
        </p>
      </div>
    </main>
  );
}
