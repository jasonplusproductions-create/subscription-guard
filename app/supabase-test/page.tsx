import { createClient } from "@/lib/supabase/client";

export default async function SupabaseTestPage() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getSession();

  return (
    <main className="min-h-screen p-10">
      <h1 className="text-3xl font-bold">Supabase Connection Test</h1>
      <p className="mt-4">
        {error
          ? `Connection error: ${error.message}`
          : `Supabase client is working. Session: ${
              data.session ? "active" : "none"
            }`}
      </p>
    </main>
  );
}