import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Link href="/" className="mb-6 inline-block text-sm text-ink/60">
        ← Home
      </Link>
      <h1 className="mb-4 text-2xl font-semibold">Terms of Service</h1>
      <p className="mb-4 text-sm text-ink/70">
        Placeholder for beta — requires human legal review before public
        launch.
      </p>
      <ul className="list-disc space-y-2 pl-5 text-sm text-ink/80">
        <li>
          Subscription Guard assists with tracking and documenting
          cancellations; it does not cancel on your behalf without approval.
        </li>
        <li>
          Blocking or declining a payment is not the same as merchant
          cancellation.
        </li>
        <li>Beta software is provided as-is during the private beta period.</li>
      </ul>
    </main>
  );
}
