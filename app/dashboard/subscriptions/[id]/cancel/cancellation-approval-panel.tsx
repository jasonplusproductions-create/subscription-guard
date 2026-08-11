"use client";

import { useState } from "react";
import { approveCancellationRequest } from "@/app/dashboard/subscriptions/[id]/cancel/actions";

type Props = {
  subscriptionId: string;
  messageDraft: string;
  approved: boolean;
};

export function CancellationApprovalPanel({
  subscriptionId,
  messageDraft,
  approved,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleApprove() {
    setPending(true);
    await approveCancellationRequest(subscriptionId, messageDraft);
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(messageDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (approved) {
    return (
      <div className="rounded-md border border-accent/30 bg-accent/10 p-4 text-sm">
        Cancellation request approved and prepared. You can copy the message
        below and send it yourself — the app will not send email on your
        behalf.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-ink/70">
        Review the draft below. Nothing is recorded until you click{" "}
        <span className="font-medium">Approve and prepare</span>.
      </p>
      <button
        type="button"
        onClick={handleApprove}
        disabled={pending}
        className="rounded-md bg-ink px-4 py-2 text-paper hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Preparing…" : "Approve and prepare"}
      </button>
      <button
        type="button"
        onClick={handleCopy}
        className="rounded-md border border-ink/20 px-4 py-2 text-sm hover:bg-ink/5"
      >
        {copied ? "Copied!" : "Copy message to clipboard"}
      </button>
    </div>
  );
}
