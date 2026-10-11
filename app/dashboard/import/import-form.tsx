"use client";

import { useFormState } from "react-dom";
import {
  commitImportAction,
  previewImportAction,
  type ImportState,
} from "@/app/dashboard/import/actions";

const STATUS_LABEL: Record<string, string> = {
  new: "Will import",
  invalid: "Has a problem",
  duplicate: "Skipped",
  price_changed: "Price differs, skipped",
};

export function ImportForm() {
  const [state, formAction] = useFormState<ImportState, FormData>(
    previewImportAction,
    undefined
  );

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-3">
        <input
          type="file"
          name="file"
          accept=".csv,text/csv"
          required
          className="block w-full text-sm"
        />
        <button
          type="submit"
          className="rounded-md border border-ink/20 px-4 py-2 text-sm hover:bg-ink/5"
        >
          Preview import
        </button>
        {state?.error && (
          <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {state.error}
          </p>
        )}
      </form>

      {state?.rows && state.csv && (
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink/60">
            Preview: {state.newCount} of {state.rows.length} will be added
          </h2>
          <ul className="mb-4 divide-y divide-ink/10 rounded-md border border-ink/10 text-sm">
            {state.rows.map((r) => (
              <li key={r.line} className="px-3 py-2">
                <span className="font-medium">{r.name || r.merchant || "(blank)"}</span>
                <span className="text-ink/60">
                  {" "}
                  · {r.amount} {r.interval}
                  {r.nextRenewal ? ` · renews ${r.nextRenewal}` : ""}
                </span>
                <span
                  className={`block text-xs ${r.status === "new" ? "text-accent" : r.status === "invalid" ? "text-red-700" : "text-ink/60"}`}
                >
                  Line {r.line}: {STATUS_LABEL[r.status]}
                  {r.note ? `. ${r.note}` : ""}
                </span>
              </li>
            ))}
          </ul>
          {state.newCount ? (
            <form action={commitImportAction}>
              <input type="hidden" name="csv" value={state.csv} />
              <button
                type="submit"
                className="rounded-md bg-accent px-4 py-2 text-sm text-paper hover:opacity-90"
              >
                Add {state.newCount} subscription
                {state.newCount === 1 ? "" : "s"}
              </button>
            </form>
          ) : (
            <p className="text-sm text-ink/60">Nothing new to add.</p>
          )}
        </section>
      )}
    </div>
  );
}
