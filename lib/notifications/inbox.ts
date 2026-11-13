import { isPostCancelNotificationType, isPostCancelStatus } from "@/lib/notifications/post-cancel-followups";

export type InboxRow = {
  id: string;
  notification_type: string;
  scheduled_for: string;
  status: string;
  subscription: {
    id: string;
    name: string;
    status: string;
    next_renewal_at: string | null;
    reminders_muted: boolean;
    reminders_snoozed_until: string | null;
  } | null;
};

export type InboxItem = {
  id: string;
  subscriptionId: string;
  subscriptionName: string;
  notificationType: string;
  kind: "renewal" | "post_cancel";
  message: string;
  when: string;
  renewsAt: string | null;
  delivered: boolean;
};

const MESSAGES: Record<string, string> = {
  renewal_7_days: "renews in about 7 days",
  renewal_3_days: "renews in about 3 days",
  renewal_24_hours: "renews within 24 hours",
  post_cancel_check_7_days:
    "check your statement for a charge after you cancelled",
  post_cancel_check_30_days:
    "check your statement for a charge 30 days after you cancelled",
};

/** A reminder is hidden when the user muted, snoozed, or archived the subscription. */
export function isSuppressed(row: InboxRow, now: number): boolean {
  const s = row.subscription;
  if (!s) return true;
  if (s.status === "archived" || s.reminders_muted) return true;
  if (s.reminders_snoozed_until) {
    const until = new Date(s.reminders_snoozed_until).getTime();
    if (!Number.isNaN(until) && until > now) return true;
  }
  return false;
}

export function buildInbox(
  rows: InboxRow[],
  now: number = Date.now()
): { due: InboxItem[]; upcoming: InboxItem[] } {
  const due: InboxItem[] = [];
  const upcoming: InboxItem[] = [];

  for (const row of rows) {
    if (row.status === "skipped") continue;
    if (isSuppressed(row, now)) continue;
    const s = row.subscription!;
    const scheduled = new Date(row.scheduled_for).getTime();
    if (Number.isNaN(scheduled)) continue;

    const postCancel = isPostCancelNotificationType(row.notification_type);

    if (postCancel) {
      // Only while the cancellation is still out with the merchant. Once a
      // charge has been flagged, the detail page carries that state and the
      // "did they charge you" prompt has been answered.
      if (!isPostCancelStatus(s.status)) continue;
      if (s.status === "payment_detected_after_cancel") continue;
    }

    const item: InboxItem = {
      id: row.id,
      subscriptionId: s.id,
      subscriptionName: s.name,
      notificationType: row.notification_type,
      kind: postCancel ? "post_cancel" : "renewal",
      message: MESSAGES[row.notification_type] ?? "has an upcoming reminder",
      when: row.scheduled_for,
      renewsAt: postCancel ? null : s.next_renewal_at,
      delivered: row.status === "sent",
    };

    if (scheduled <= now) {
      // Already past its renewal? Nothing useful to say. (Post-cancel checks
      // stay due until the user answers them.)
      if (
        !postCancel &&
        s.next_renewal_at &&
        new Date(s.next_renewal_at).getTime() < now
      ) {
        continue;
      }
      due.push(item);
    } else {
      upcoming.push(item);
    }
  }

  due.sort((a, b) => (a.renewsAt ?? "").localeCompare(b.renewsAt ?? ""));
  upcoming.sort((a, b) => a.when.localeCompare(b.when));
  return { due, upcoming };
}
