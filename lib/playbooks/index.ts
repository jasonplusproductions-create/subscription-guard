import { PLAYBOOKS } from "./data";
import type { Playbook } from "./types";

export type { Playbook };

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/** Exact-ish match on merchant name; returns null when nothing fits. */
export function findPlaybook(merchantName: string): Playbook | null {
  const n = norm(merchantName);
  if (!n) return null;
  return (
    PLAYBOOKS.find((p) => norm(p.merchant) === n) ??
    PLAYBOOKS.find((p) => {
      const m = norm(p.merchant);
      return n.includes(m) || m.includes(n);
    }) ??
    null
  );
}

export function searchPlaybooks(query: string): Playbook[] {
  const q = norm(query);
  if (!q) return PLAYBOOKS;
  return PLAYBOOKS.filter(
    (p) => norm(p.merchant).includes(q) || norm(p.category).includes(q),
  );
}
