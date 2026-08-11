import Link from "next/link";
import { NewSubscriptionForm } from "@/app/dashboard/subscriptions/new/new-subscription-form";

export default function NewSubscriptionPage() {
  return (
    <main className="mx-auto max-w-lg px-6 py-10">
      <Link
        href="/dashboard"
        className="mb-6 inline-block text-sm text-ink/60 hover:text-ink"
      >
        ← Back to dashboard
      </Link>
      <h1 className="mb-2 text-xl font-semibold">Add subscription</h1>
      <p className="mb-6 text-sm text-ink/60">
        Track a recurring charge manually. Merchant names are matched loosely —
        type the name you recognize on your statement.
      </p>
      <NewSubscriptionForm />
    </main>
  );
}
