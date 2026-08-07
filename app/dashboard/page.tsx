import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

async function signOut() {
  "use server";
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export default async function DashboardPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, email")
    .eq("id", user.id)
    .single();

  // Subscription CRUD lands on Day 2 — for now this proves the
  // authenticated round-trip to Postgres through RLS.
  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("id, name, status, billing_amount, currency, next_renewal_at")
    .order("next_renewal_at", { ascending: true });

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm text-ink/60">Signed in as</p>
          <p className="font-medium">
            {profile?.display_name ?? profile?.email ?? user.email}
          </p>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="rounded-md border border-ink/20 px-3 py-1.5 text-sm hover:bg-ink/5"
          >
            Sign out
          </button>
        </form>
      </div>

      <h1 className="mb-4 text-xl font-semibold">Your subscriptions</h1>

      {subscriptions && subscriptions.length > 0 ? (
        <ul className="divide-y divide-ink/10 rounded-md border border-ink/10">
          {subscriptions.map((s) => (
            <li key={s.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="font-medium">{s.name}</p>
                <p className="text-sm text-ink/60">{s.status}</p>
              </div>
              <div className="text-right">
                {s.billing_amount != null && (
                  <p className="font-medium">
                    {s.currency} {s.billing_amount}
                  </p>
                )}
                {s.next_renewal_at && (
                  <p className="text-sm text-ink/60">
                    Renews {new Date(s.next_renewal_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-md border border-dashed border-ink/20 p-8 text-center text-ink/60">
          <p className="mb-1">No subscriptions tracked yet.</p>
          <p className="text-sm">
            Manual subscription entry ships next — this screen already talks
            to Postgres through your authenticated session.
          </p>
        </div>
      )}
    </main>
  );
}
