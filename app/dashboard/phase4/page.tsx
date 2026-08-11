import Link from "next/link";

export default function Phase4Page() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Link href="/dashboard" className="mb-6 inline-block text-sm text-ink/60">
        ← Dashboard
      </Link>
      <h1 className="mb-2 text-xl font-semibold">Browser automation</h1>
      <p className="mb-4 text-sm text-ink/60">Phase 4 · Trial detection & cancellation assist</p>
      <ul className="list-disc space-y-2 pl-5 text-sm text-ink/70">
        <li>Browser extension with explicit confirmation before saving trial data</li>
        <li>Never auto-submits merchant forms — same human-approval rule as Launch 1</li>
        <li>Merchant playbooks and Playwright workers with approval gate before final submit</li>
        <li>Stops and asks on ambiguous cancellation screens</li>
      </ul>
      <p className="mt-4 text-sm text-ink/60">
        Deferred until Phase 3 is stable and merchant intelligence exists. See{" "}
        <code className="text-xs">docs/ULTIMATE_FEATURES_SCOPE.md</code>.
      </p>
    </main>
  );
}
