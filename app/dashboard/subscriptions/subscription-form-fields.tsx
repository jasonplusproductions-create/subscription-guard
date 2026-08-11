import {
  BILLING_INTERVALS,
  CURRENCIES,
  type SubscriptionStatus,
} from "@/lib/types/subscription";
import { toDateInputValue } from "@/lib/subscriptions/validation";

export type SubscriptionFormDefaults = {
  merchantName?: string;
  name?: string;
  billingAmount?: string;
  currency?: string;
  billingInterval?: string;
  trialStartAt?: string;
  trialEndAt?: string;
  nextRenewalAt?: string;
  cancellationUrl?: string;
  supportEmail?: string;
  notes?: string;
  status?: SubscriptionStatus;
};

type Props = {
  defaults?: SubscriptionFormDefaults;
  submitLabel: string;
  error?: string;
};

export function SubscriptionFormFields({
  defaults = {},
  submitLabel,
  error,
}: Props) {
  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Merchant name</span>
        <input
          name="merchantName"
          required
          defaultValue={defaults.merchantName ?? ""}
          placeholder="Netflix, Spotify, Adobe…"
          className="rounded-md border border-ink/20 bg-white px-3 py-2 outline-none focus:border-accent"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Subscription name</span>
        <input
          name="name"
          required
          defaultValue={defaults.name ?? ""}
          placeholder="Premium plan, Family tier…"
          className="rounded-md border border-ink/20 bg-white px-3 py-2 outline-none focus:border-accent"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Billing amount</span>
          <input
            name="billingAmount"
            type="number"
            min="0"
            step="0.01"
            required
            defaultValue={defaults.billingAmount ?? ""}
            className="rounded-md border border-ink/20 bg-white px-3 py-2 outline-none focus:border-accent"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Currency</span>
          <select
            name="currency"
            defaultValue={defaults.currency ?? "USD"}
            className="rounded-md border border-ink/20 bg-white px-3 py-2 outline-none focus:border-accent"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Billing interval</span>
          <select
            name="billingInterval"
            required
            defaultValue={defaults.billingInterval ?? "monthly"}
            className="rounded-md border border-ink/20 bg-white px-3 py-2 outline-none focus:border-accent"
          >
            {BILLING_INTERVALS.map((i) => (
              <option key={i.value} value={i.value}>
                {i.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Trial start (optional)</span>
          <input
            name="trialStartAt"
            type="date"
            defaultValue={toDateInputValue(defaults.trialStartAt ?? null)}
            className="rounded-md border border-ink/20 bg-white px-3 py-2 outline-none focus:border-accent"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Trial end (optional)</span>
          <input
            name="trialEndAt"
            type="date"
            defaultValue={toDateInputValue(defaults.trialEndAt ?? null)}
            className="rounded-md border border-ink/20 bg-white px-3 py-2 outline-none focus:border-accent"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">
          Next renewal date
          {defaults.status === "archived" ? " (optional when archived)" : ""}
        </span>
        <input
          name="nextRenewalAt"
          type="date"
          required={defaults.status !== "archived"}
          defaultValue={toDateInputValue(defaults.nextRenewalAt ?? null)}
          className="rounded-md border border-ink/20 bg-white px-3 py-2 outline-none focus:border-accent"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Cancellation URL (optional)</span>
        <input
          name="cancellationUrl"
          type="url"
          defaultValue={defaults.cancellationUrl ?? ""}
          placeholder="https://…"
          className="rounded-md border border-ink/20 bg-white px-3 py-2 outline-none focus:border-accent"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Merchant support email (optional)</span>
        <input
          name="supportEmail"
          type="email"
          defaultValue={defaults.supportEmail ?? ""}
          placeholder="support@merchant.com"
          className="rounded-md border border-ink/20 bg-white px-3 py-2 outline-none focus:border-accent"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Notes (optional)</span>
        <textarea
          name="notes"
          rows={3}
          defaultValue={defaults.notes ?? ""}
          className="rounded-md border border-ink/20 bg-white px-3 py-2 outline-none focus:border-accent"
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        className="rounded-md bg-ink px-4 py-2 text-paper transition hover:opacity-90"
      >
        {submitLabel}
      </button>
    </div>
  );
}
