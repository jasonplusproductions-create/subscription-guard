export type ReminderEmailPayload = {
  to: string;
  subscriptionName: string;
  merchantName: string;
  notificationType: string;
  renewalDate: string;
};

export type SendResult =
  | { mode: "sent"; provider: "resend" }
  | { mode: "stub"; reason: string };

function reminderSubject(notificationType: string, subscriptionName: string) {
  const labels: Record<string, string> = {
    renewal_7_days: "Renews in 7 days",
    renewal_3_days: "Renews in 3 days",
    renewal_24_hours: "Renews tomorrow",
  };
  const label = labels[notificationType] ?? "Renewal reminder";
  return `${label}: ${subscriptionName}`;
}

function reminderBody(payload: ReminderEmailPayload): string {
  return `Hi,

Your subscription "${payload.subscriptionName}" (${payload.merchantName}) is coming up for renewal on ${payload.renewalDate}.

Open Subscription Guard to review, cancel, or update reminders.

— Subscription Guard`;
}

export async function sendReminderEmail(
  payload: ReminderEmailPayload
): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.REMINDER_FROM_EMAIL;

  if (!apiKey || !from) {
    return {
      mode: "stub",
      reason: "RESEND_API_KEY or REMINDER_FROM_EMAIL not configured",
    };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [payload.to],
      subject: reminderSubject(payload.notificationType, payload.subscriptionName),
      text: reminderBody(payload),
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Resend API error (${response.status}): ${detail}`);
  }

  return { mode: "sent", provider: "resend" };
}
