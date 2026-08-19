import { createClient } from "./server";
import { isSuperuser } from "@/lib/superuser";
import type {
  BillingInterval,
  Subscription,
  SubscriptionStatus,
} from "@/lib/types";

type SubscriptionRow = {
  id: string;
  user_id: string;
  name: string;
  billing_amount: number | string | null;
  currency: string;
  billing_interval: string | null;
  next_renewal_at: string | null;
  status: string;
};

function toSubscription(row: SubscriptionRow): Subscription {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    billingAmount:
      row.billing_amount === null || row.billing_amount === undefined
        ? null
        : Number(row.billing_amount),
    currency: row.currency,
    billingInterval: row.billing_interval as BillingInterval | null,
    nextRenewalAt: row.next_renewal_at,
    status: row.status as SubscriptionStatus,
  };
}

export async function getSubscriptions() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { user: null, subscriptions: [], error: userError };
  }

  const isSuper = isSuperuser(user.email);

  let query = supabase
    .from("subscriptions")
    .select(
      "id, user_id, name, billing_amount, currency, billing_interval, next_renewal_at, status"
    )
    .order("name");

  if (!isSuper) {
    query = query.eq("user_id", user.id);
  }

  const { data, error } = await query;

  if (error) {
    return { user, subscriptions: [], error };
  }

  const subscriptions = (data as SubscriptionRow[]).map(toSubscription);

  return { user, subscriptions, error: null, isSuperuser: isSuper };
}
