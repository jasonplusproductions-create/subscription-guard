"use client";

import { useActionState, useEffect, useState } from "react";
import {
  createSubscription,
  initialSubscriptionActionState,
  updateSubscription,
} from "./actions";
import {
  formatDate,
  formatPrice,
  formatStatus,
  statusTone,
  toDateInputValue,
} from "@/lib/subscription-display";
import { BILLING_INTERVALS, type Subscription } from "@/lib/types";

const fieldClassName =
  "h-12 rounded-xl border border-zinc-200 bg-white px-4 text-base font-normal text-black outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50";

type SubscriptionFormProps = {
  subscription?: Subscription;
  onDone: () => void;
};

export function SubscriptionForm({
  subscription,
  onDone,
}: SubscriptionFormProps) {
  const isEdit = Boolean(subscription);
  const [state, formAction, isPending] = useActionState(
    isEdit ? updateSubscription : createSubscription,
    initialSubscriptionActionState
  );

  useEffect(() => {
    if (state.ok) {
      onDone();
    }
  }, [state.ok, onDone]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {subscription ? (
        <input type="hidden" name="id" value={subscription.id} />
      ) : null}

      <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Name
        <input
          type="text"
          name="name"
          required
          maxLength={120}
          defaultValue={subscription?.name ?? ""}
          className={fieldClassName}
          placeholder="Netflix"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Amount
          <input
            type="text"
            name="billing_amount"
            inputMode="decimal"
            defaultValue={
              subscription?.billingAmount === null ||
              subscription?.billingAmount === undefined
                ? ""
                : String(subscription.billingAmount)
            }
            className={fieldClassName}
            placeholder="15.99"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Currency
          <input
            type="text"
            name="currency"
            maxLength={3}
            defaultValue={subscription?.currency ?? "USD"}
            className={`${fieldClassName} uppercase`}
            placeholder="USD"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Interval
          <select
            name="billing_interval"
            defaultValue={subscription?.billingInterval ?? ""}
            className={fieldClassName}
          >
            <option value="">Select interval</option>
            {BILLING_INTERVALS.map((interval) => (
              <option key={interval} value={interval}>
                {interval}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Next renewal
          <input
            type="date"
            name="next_renewal_at"
            defaultValue={toDateInputValue(subscription?.nextRenewalAt ?? null)}
            className={fieldClassName}
          />
        </label>
      </div>

      {state.error ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="flex h-12 items-center justify-center rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] disabled:opacity-60 dark:hover:bg-[#ccc]"
        >
          {isPending ? "Saving…" : isEdit ? "Save changes" : "Add subscription"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="h-12 rounded-full border border-zinc-200 px-5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export function AddSubscriptionButton() {
  const [open, setOpen] = useState(false);

  if (open) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white px-5 py-5 dark:border-zinc-800 dark:bg-black">
        <h2 className="mb-4 text-lg font-semibold text-black dark:text-zinc-50">
          Add subscription
        </h2>
        <SubscriptionForm onDone={() => setOpen(false)} />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="h-10 rounded-full bg-foreground px-4 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
    >
      Add subscription
    </button>
  );
}

export function SubscriptionRow({
  subscription,
}: {
  subscription: Subscription;
}) {
  const [open, setOpen] = useState(false);
  const tone = statusTone(subscription.status);

  return (
    <li className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black">
      <div className="flex items-center justify-between gap-4 px-5 py-4">
        <div className="flex items-center gap-4">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${
              tone === "positive"
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                : tone === "warning"
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                  : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
            }`}
          >
            {subscription.name.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-black dark:text-zinc-50">
              {subscription.name}
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {subscription.billingInterval ?? "interval unknown"}
              {subscription.nextRenewalAt
                ? ` · ${formatDate(subscription.nextRenewalAt)}`
                : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="font-semibold text-black dark:text-zinc-50">
              {subscription.billingAmount === null
                ? "—"
                : formatPrice(
                    subscription.billingAmount,
                    subscription.currency
                  )}
            </p>
            <p
              className={`text-xs font-medium capitalize ${
                tone === "positive"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : tone === "warning"
                    ? "text-amber-700 dark:text-amber-400"
                    : "text-zinc-400 dark:text-zinc-500"
              }`}
            >
              {formatStatus(subscription.status)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            className="h-10 rounded-full border border-zinc-200 px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            {open ? "Close" : "Edit"}
          </button>
        </div>
      </div>
      {open ? (
        <div className="border-t border-zinc-200 px-5 py-5 dark:border-zinc-800">
          <SubscriptionForm
            key={subscription.id}
            subscription={subscription}
            onDone={() => setOpen(false)}
          />
        </div>
      ) : null}
    </li>
  );
}
