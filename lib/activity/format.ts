/**
 * Presentation helpers for the activity log (S7).
 *
 * These only format the append-only `audit_events` history for display. They
 * must never be used to derive a subscription's current state — that always
 * comes from `subscriptions.status`.
 */

export type AuditEventRow = {
  id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: unknown;
  created_at: string;
};

const ACTION_LABELS: Record<string, string> = {
  subscription_created: "Subscription added",
  subscription_edited: "Subscription edited",
  subscription_price_changed: "Price changed",
  subscription_archived: "Subscription archived",
  subscription_deleted: "Subscription deleted",
  renewal_decision_set: "Renewal decision",
  cancellation_approved: "Cancellation approved",
  cancellation_marked_sent: "Cancellation marked sent",
  cancellation_status_updated: "Cancellation status updated",
  evidence_uploaded: "Evidence uploaded",
  payment_detected_after_cancel: "Payment detected after cancel",
};

export function actionLabel(action: string): string {
  const known = ACTION_LABELS[action];
  if (known) return known;
  const words = action.replace(/_/g, " ").trim();
  if (!words) return "Activity";
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function entityLabel(entityType: string | null): string {
  switch (entityType) {
    case "subscription":
      return "Subscription";
    case "cancellation_request":
      return "Cancellation request";
    case "evidence":
      return "Evidence";
    case null:
    case "":
      return "Account";
    default:
      return entityType.replace(/_/g, " ");
  }
}

function metadataObject(metadata: unknown): Record<string, unknown> {
  if (metadata && typeof metadata === "object" && !Array.isArray(metadata)) {
    return metadata as Record<string, unknown>;
  }
  return {};
}

function asText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function asAmount(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function amountText(value: number): string {
  return value.toFixed(2);
}

function priceMove(oldAmount: number | null, newAmount: number | null): string | null {
  if (oldAmount === null || newAmount === null) return null;
  return `Price moved from ${amountText(oldAmount)} to ${amountText(newAmount)}.`;
}

function decisionText(decision: string | null): string {
  switch (decision) {
    case "keep":
      return "You chose to keep this subscription.";
    case "cancel":
      return "You chose to cancel this subscription.";
    case "undecided":
      return "Decision reset to undecided.";
    default:
      return "Renewal decision updated.";
  }
}

function genericSummary(metadata: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(metadata)) {
    if (parts.length >= 3) break;
    if (value === null || value === undefined) continue;
    if (typeof value === "object") continue;
    const label = key.replace(/_/g, " ");
    parts.push(`${label}: ${String(value)}`);
  }
  return parts.length > 0 ? `${parts.join(". ")}.` : "";
}

/**
 * A short, human summary of one event, built from its metadata. Always returns
 * a displayable sentence.
 */
export function eventSummary(row: {
  action: string;
  metadata: unknown;
}): string {
  const m = metadataObject(row.metadata);
  const merchant = asText(m.merchant);
  const oldAmount = asAmount(m.old_amount);
  const newAmount = asAmount(m.new_amount);
  const status = asText(m.status);
  const decision = asText(m.decision);
  const via = asText(m.via);
  const viaCsv = via === "csv_import";

  switch (row.action) {
    case "subscription_created": {
      const parts = ["Added to your tracked subscriptions."];
      if (merchant) parts.push(`Merchant ${merchant}.`);
      if (viaCsv) parts.push("Imported from a CSV file.");
      return parts.join(" ");
    }
    case "subscription_edited": {
      const move = priceMove(oldAmount, newAmount);
      if (move) return move;
      return "Details updated.";
    }
    case "subscription_price_changed": {
      const move = priceMove(oldAmount, newAmount);
      const parts = [move ?? "Price updated."];
      if (viaCsv) parts.push("Found during a CSV import.");
      return parts.join(" ");
    }
    case "subscription_archived":
      return "Archived. It stays in your history but no longer counts as active.";
    case "subscription_deleted":
      return "Removed from your account. Past events for it stay in this log.";
    case "renewal_decision_set":
      return decisionText(decision);
    case "cancellation_approved":
      return "You approved this cancellation request in the app. Nothing is sent to the merchant for you.";
    case "cancellation_marked_sent":
      return "You marked this cancellation as sent.";
    case "cancellation_status_updated":
      return status ? `Cancellation status set to ${status}.` : "Cancellation status updated.";
    case "evidence_uploaded":
      return "Evidence added to this cancellation record.";
    case "payment_detected_after_cancel":
      return "A charge was detected after cancellation. This is not a confirmed cancellation.";
    default:
      return genericSummary(m);
  }
}
