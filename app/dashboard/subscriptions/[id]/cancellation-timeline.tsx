type TimelineEvent = {
  id: string;
  at: string;
  kind: string;
  label: string;
  detail?: string | null;
};

type Props = {
  requests: {
    id: string;
    status: string;
    user_approved_at: string | null;
    requested_at: string | null;
    completed_at: string | null;
    failure_reason: string | null;
    created_at: string;
  }[];
  attempts: {
    id: string;
    cancellation_request_id: string;
    method: string;
    result: string;
    attempted_at: string;
    response_notes: string | null;
  }[];
  evidence: {
    id: string;
    evidence_type: string;
    description: string | null;
    created_at: string;
  }[];
};

export function CancellationTimeline({ requests, attempts, evidence }: Props) {
  const events: TimelineEvent[] = [];

  for (const r of requests) {
    events.push({
      id: `req-${r.id}`,
      at: r.created_at,
      kind: "request",
      label: `Cancellation request · ${r.status.replace(/_/g, " ")}`,
      detail: r.failure_reason,
    });
    if (r.user_approved_at) {
      events.push({
        id: `req-approved-${r.id}`,
        at: r.user_approved_at,
        kind: "approval",
        label: "User approved cancellation message",
      });
    }
    if (r.completed_at) {
      events.push({
        id: `req-done-${r.id}`,
        at: r.completed_at,
        kind: "completed",
        label: "Cancellation workflow completed",
      });
    }
  }

  for (const a of attempts) {
    events.push({
      id: `attempt-${a.id}`,
      at: a.attempted_at,
      kind: "attempt",
      label: `${a.method} attempt · ${a.result}`,
      detail: a.response_notes,
    });
  }

  for (const e of evidence) {
    events.push({
      id: `evidence-${e.id}`,
      at: e.created_at,
      kind: "evidence",
      label: `Evidence uploaded · ${e.evidence_type}`,
      detail: e.description,
    });
  }

  events.sort(
    (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime()
  );

  if (events.length === 0) {
    return (
      <p className="text-sm text-ink/60">
        No cancellation activity recorded yet.
      </p>
    );
  }

  return (
    <ol className="relative border-l border-ink/20 pl-4">
      {events.map((event) => (
        <li key={event.id} className="mb-4 ml-2">
          <span className="absolute -left-[5px] mt-1.5 h-2 w-2 rounded-full bg-accent" />
          <p className="text-sm font-medium">{event.label}</p>
          <p className="text-xs text-ink/60">
            {new Date(event.at).toLocaleString()}
          </p>
          {event.detail && (
            <p className="mt-1 text-sm text-ink/70">{event.detail}</p>
          )}
        </li>
      ))}
    </ol>
  );
}
