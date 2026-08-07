import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-start justify-center px-6">
      <p className="mb-2 text-sm font-medium uppercase tracking-wide text-accent">
        Subscription Guard
      </p>
      <h1 className="mb-6 text-4xl font-semibold leading-tight">
        Your money should never renew a relationship you already ended.
      </h1>
      <p className="mb-8 text-lg text-ink/70">
        Find every recurring charge, get warned before renewal, and keep
        proof of when you canceled.
      </p>
      <Link
        href="/login"
        className="rounded-md bg-ink px-5 py-3 text-paper transition hover:opacity-90"
      >
        Sign in
      </Link>
    </main>
  );
}
