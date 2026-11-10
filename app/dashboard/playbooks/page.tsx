import Link from "next/link";
import { searchPlaybooks } from "@/lib/playbooks";
import { PlaybookCard } from "@/lib/playbooks/playbook-card";

type Props = { searchParams: { q?: string } };

export default function PlaybooksPage({ searchParams }: Props) {
  const q = searchParams.q ?? "";
  const results = searchPlaybooks(q);

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Link
        href="/dashboard"
        className="mb-6 inline-block text-sm text-ink/60 hover:text-ink"
      >
        ← Dashboard
      </Link>
      <h1 className="mb-2 text-xl font-semibold">Cancellation guides</h1>
      <p className="mb-6 text-sm text-ink/60">
        How to cancel at common merchants. Guidance only; nothing here acts on
        your behalf.
      </p>
      <form className="mb-6" action="/dashboard/playbooks">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search merchant or category"
          className="w-full rounded-md border border-ink/20 px-3 py-2 text-sm"
        />
      </form>
      {results.length === 0 ? (
        <p className="text-sm text-ink/60">No guide for that yet.</p>
      ) : (
        <div className="space-y-4">
          {results.map((p) => (
            <PlaybookCard key={p.merchant} playbook={p} />
          ))}
        </div>
      )}
    </main>
  );
}
