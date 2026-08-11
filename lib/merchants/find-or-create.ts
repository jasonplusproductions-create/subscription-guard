import type { SupabaseClient } from "@supabase/supabase-js";

type MerchantUpdate = {
  cancellationUrl?: string | null;
  supportEmail?: string | null;
};

export async function findOrCreateMerchant(
  supabase: SupabaseClient,
  name: string,
  updates?: MerchantUpdate
): Promise<string> {
  const trimmed = name.trim();

  const { data: existing } = await supabase
    .from("merchants")
    .select("id")
    .ilike("name", trimmed)
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
    if (updates?.cancellationUrl || updates?.supportEmail) {
      await supabase
        .from("merchants")
        .update({
          ...(updates.cancellationUrl
            ? { cancellation_url: updates.cancellationUrl }
            : {}),
          ...(updates.supportEmail
            ? { support_email: updates.supportEmail }
            : {}),
        })
        .eq("id", existing.id);
    }
    return existing.id;
  }

  const { data: created, error } = await supabase
    .from("merchants")
    .insert({
      name: trimmed,
      cancellation_url: updates?.cancellationUrl ?? null,
      support_email: updates?.supportEmail ?? null,
    })
    .select("id")
    .single();

  if (error || !created) {
    throw new Error(error?.message ?? "Could not create merchant.");
  }

  return created.id;
}

export async function getMerchant(
  supabase: SupabaseClient,
  merchantId: string
) {
  const { data, error } = await supabase
    .from("merchants")
    .select("id, name, cancellation_url, support_email")
    .eq("id", merchantId)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Merchant not found.");
  }

  return data;
}
