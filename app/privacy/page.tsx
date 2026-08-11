import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Link href="/" className="mb-6 inline-block text-sm text-ink/60">
        ← Home
      </Link>
      <h1 className="mb-4 text-2xl font-semibold">Privacy Policy</h1>
      <p className="mb-4 text-sm text-ink/70">
        Placeholder for beta — requires human legal review before public
        launch.
      </p>
      <ul className="list-disc space-y-2 pl-5 text-sm text-ink/80">
        <li>We store subscription and cancellation data you enter manually.</li>
        <li>
          We do not store raw card numbers, CVVs, or bank passwords.
        </li>
        <li>
          Evidence files are stored in private storage scoped to your account.
        </li>
        <li>You may export or delete your data from account settings.</li>
      </ul>
    </main>
  );
}
