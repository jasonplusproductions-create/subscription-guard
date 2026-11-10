import type { Playbook } from "./types";

export function PlaybookCard({ playbook }: { playbook: Playbook }) {
  return (
    <div className="rounded-md border border-ink/10 bg-white p-4 text-sm">
      <p className="mb-1 text-xs uppercase tracking-wide text-ink/60">
        {playbook.category} · {playbook.channel}
      </p>
      <h3 className="mb-2 font-medium">{playbook.merchant}</h3>
      <ol className="mb-3 list-decimal space-y-1 pl-5 text-ink/80">
        {playbook.steps.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
      {playbook.notes && <p className="mb-3 text-ink/60">{playbook.notes}</p>}
      <a
        href={playbook.cancelUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-accent underline"
      >
        Open merchant page
      </a>
      <p className="mt-3 text-xs text-ink/50">
        General guidance, last checked July 2026. Steps change; confirm on the
        merchant&apos;s site. You complete the cancellation yourself.
      </p>
    </div>
  );
}
