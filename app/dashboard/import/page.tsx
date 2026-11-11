import Link from "next/link";
import { ImportForm } from "@/app/dashboard/import/import-form";
import { CSV_HEADERS } from "@/lib/csv/subscription-csv";

type Props = {
  searchParams: { done?: string; updated?: string; failed?: string; error?: string };
};

export default function ImportPage({ searchParams }: Props) {
  const done = searchParams.done;
  const updated = Number(searchParams.updated ?? 0);
  const failed = Number(searchParams.failed ?? 0);

  return (
    <main className="mx-auto max-w-lg px-6 py-10">
      <Link
        href="/dashboard"
        className="mb-6 inline-block text-sm text-ink/60 hover:text-ink"
      >
        ← Dashboard
      </Link>
      <h1 className="mb-2 text-xl font-semibold">Import from CSV</h1>
      <p className="mb-2 text-sm text-ink/60">
        Columns: {CSV_HEADERS.join(", ")}. Required: merchant, amount,
        interval (weekly, monthly, quarterly, annual). Each renewing row needs
        a next_renewal date. You see a preview before anything is saved, and
        rows already tracked are skipped unless the price changed — a new
        price is applied and recorded in that subscription&apos;s price history.
      </p>
      <p className="mb-6 text-sm">
        <a
          href="/api/export/subscriptions"
          className="text-accent underline"
          download
        >
          Download your current subscriptions as CSV
        </a>{" "}
        to see the format.
      </p>

      {searchParams.error && (
        <p className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {searchParams.error}
        </p>
      )}
      {done !== undefined && (
        <p className="mb-4 rounded-md border border-accent/30 bg-accent/10 p-3 text-sm">
          Added {done} subscription{done === "1" ? "" : "s"}
          {updated > 0
            ? `, updated ${updated} price${updated === 1 ? "" : "s"}`
            : ""}
          {failed > 0 ? `. ${failed} could not be saved.` : "."}{" "}
          <Link href="/dashboard" className="underline">
            View dashboard
          </Link>
        </p>
      )}

      <ImportForm />
    </main>
  );
}
