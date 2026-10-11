import { toCsv } from "@/lib/csv/csv";
import { CSV_HEADERS } from "@/lib/csv/subscription-csv";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("subscriptions")
    .select(
      "name, billing_amount, currency, billing_interval, next_renewal_at, trial_end_at, notes, status, merchants(name)"
    )
    .eq("user_id", user.id)
    .neq("status", "archived")
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Could not export." }, { status: 500 });
  }

  const rows = (data ?? []).map((s) => {
    const m = s.merchants as { name?: string } | { name?: string }[] | null;
    const merchant = (Array.isArray(m) ? m[0]?.name : m?.name) ?? "";
    return [
      merchant,
      s.name,
      s.billing_amount,
      s.currency,
      s.billing_interval,
      s.next_renewal_at?.slice(0, 10),
      s.trial_end_at?.slice(0, 10),
      s.notes,
    ];
  });

  return new NextResponse(toCsv([[...CSV_HEADERS], ...rows]), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="subscription-guard-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
