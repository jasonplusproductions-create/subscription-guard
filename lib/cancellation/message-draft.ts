type DraftParams = {
  merchantName: string;
  subscriptionName: string;
  accountEmail: string;
};

export function buildCancellationMessageDraft({
  merchantName,
  subscriptionName,
  accountEmail,
}: DraftParams): string {
  return `Subject: Request to cancel my subscription

Hello ${merchantName} Support,

I am writing to request cancellation of my subscription.

Account email: ${accountEmail}
Subscription: ${subscriptionName}

Please confirm when my subscription has been canceled and when any recurring billing will stop. I would appreciate written confirmation for my records.

Thank you,
${accountEmail.split("@")[0]}`;
}
