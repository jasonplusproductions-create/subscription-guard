import { createClient } from "@/lib/supabase/server";

export default async function SupabaseTestPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen p-10">
      <h1 className="text-3xl font-bold">Supabase Connection Test</h1>
      <p className="mt-4">
        {error
          ? `Connection error: ${error.message}`
          : `Supabase client is working. User: ${
              data.user ? "authenticated" : "none"
            }`}
      </p>
    </main>
  );
}
