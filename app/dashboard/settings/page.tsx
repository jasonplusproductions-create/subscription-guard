import Link from "next/link";
import {
  deleteAccountAction,
  exportUserDataAction,
} from "@/app/dashboard/settings/actions";
import { ExportDataButton } from "@/app/dashboard/settings/export-data-button";

type Props = {
  searchParams: { error?: string };
};

export default function SettingsPage({ searchParams }: Props) {
  return (
    <main className="mx-auto max-w-lg px-6 py-10">
      <Link
        href="/dashboard"
        className="mb-6 inline-block text-sm text-ink/60 hover:text-ink"
      >
        ← Dashboard
      </Link>
      <h1 className="mb-6 text-xl font-semibold">Account settings</h1>

      {searchParams.error && (
        <p className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {searchParams.error}
        </p>
      )}

      <section className="mb-8 rounded-md border border-ink/10 p-4">
        <h2 className="mb-2 font-medium">Export data</h2>
        <p className="mb-3 text-sm text-ink/60">
          Download JSON of your subscriptions, cancellations, evidence metadata,
          and audit history.
        </p>
        <ExportDataButton exportAction={exportUserDataAction} />
      </section>

      <section className="rounded-md border border-red-200 p-4">
        <h2 className="mb-2 font-medium text-red-800">Delete account</h2>
        <p className="mb-3 text-sm text-ink/60">
          Permanently deletes your account and associated data. This cannot be
          undone.
        </p>
        <form action={deleteAccountAction}>
          <label className="mb-3 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="confirmDeleteAccount"
              value="yes"
              required
            />
            I understand my account and data will be permanently deleted
          </label>
          <button
            type="submit"
            className="rounded-md border border-red-400 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
          >
            Delete my account
          </button>
        </form>
      </section>

      <p className="mt-8 text-sm text-ink/60">
        <Link href="/privacy" className="underline">
          Privacy
        </Link>
        {" · "}
        <Link href="/terms" className="underline">
          Terms
        </Link>
      </p>
    </main>
  );
}
