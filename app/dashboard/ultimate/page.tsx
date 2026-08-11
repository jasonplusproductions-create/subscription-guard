import Link from "next/link";

const ULTIMATE_FEATURES = [
  "AI Subscription Concierge (reviewable action plans only)",
  "Usage-based recommendations (opt-in)",
  "Smart savings engine",
  "Bill negotiation & refund drafting (draft assistant — never auto-send)",
  "Subscription firewall rules (requires Phase 3 cards)",
  "Post-cancellation watchdog — Cancellation Verified status",
  "Shared household mode",
  "Inbox & receipt intelligence",
  "Universal cancellation passport (PDF export)",
  "Emergency financial mode",
  "Privacy & data vault (cross-cutting)",
  "Merchant intelligence network",
];

export default function UltimateRoadmapPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Link href="/dashboard" className="mb-6 inline-block text-sm text-ink/60">
        ← Dashboard
      </Link>
      <h1 className="mb-2 text-xl font-semibold">Ultimate roadmap</h1>
      <p className="mb-6 text-sm text-ink/60">
        Long-term differentiation layer — planning reference in{" "}
        <code className="text-xs">docs/ULTIMATE_FEATURES_SCOPE.md</code>
      </p>
      <ul className="list-disc space-y-2 pl-5 text-sm text-ink/80">
        {ULTIMATE_FEATURES.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
    </main>
  );
}
