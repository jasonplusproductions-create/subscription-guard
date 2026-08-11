import Link from "next/link";

export default function Phase3Page() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Link href="/dashboard" className="mb-6 inline-block text-sm text-ink/60">
        ← Dashboard
      </Link>
      <h1 className="mb-2 text-xl font-semibold">Payment protection</h1>
      <p className="mb-4 text-sm text-ink/60">Phase 3 · Virtual cards</p>
      <div className="space-y-3 text-sm text-ink/70">
        <p>
          Schema stub:{" "}
          <code className="text-xs">supabase/migrations/20260820000000_phase3_virtual_cards.sql</code>
        </p>
        <p>
          {/* TODO(human): Card-issuing partner (e.g. Stripe Issuing) required. */}
          Virtual-card issuing, merchant/amount controls, freeze/unfreeze, and
          authorization webhooks depend on a regulated issuer relationship and
          KYC/AML review — not available in this repo without human setup.
        </p>
        <p className="font-medium text-amber-900">
          Payment blocked is never labeled as canceled — enforced in product
          rules and future UI.
        </p>
      </div>
    </main>
  );
}
