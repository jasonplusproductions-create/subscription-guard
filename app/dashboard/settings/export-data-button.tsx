"use client";

import { useState } from "react";

type Props = {
  exportAction: () => Promise<string>;
};

export function ExportDataButton({ exportAction }: Props) {
  const [pending, setPending] = useState(false);

  async function handleExport() {
    setPending(true);
    try {
      const json = await exportAction();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `subscription-guard-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={pending}
      className="rounded-md border border-ink/20 px-3 py-1.5 text-sm hover:bg-ink/5 disabled:opacity-50"
    >
      {pending ? "Preparing…" : "Download JSON export"}
    </button>
  );
}
