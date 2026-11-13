/**
 * S5 duplicate / overlap detection. Pure functions over subscription rows so
 * the /dashboard/duplicates page can run them in a Server Component.
 *
 * Detection is advisory only: it never changes a subscription's status and
 * never contacts a merchant.
 */

export type DuplicateCandidate = {
  id: string;
  name: string;
  status: string;
  merchantId: string;
  merchantName: string;
  billingAmount: number | null;
  currency: string;
  nextRenewalAt: string | null;
};

export type DuplicateGroup = {
  kind: "same_merchant" | "renewal_overlap";
  key: string;
  reason: string;
  subscriptions: DuplicateCandidate[];
};

/** Renewals this many days apart (or closer) are treated as overlapping. */
export const OVERLAP_WINDOW_DAYS = 3;

const DAY_MS = 24 * 60 * 60 * 1000;

function merchantKey(s: DuplicateCandidate): string {
  return s.merchantId || s.merchantName.trim().toLowerCase();
}

function renewalTime(s: DuplicateCandidate): number | null {
  if (!s.nextRenewalAt) return null;
  const t = new Date(s.nextRenewalAt).getTime();
  return Number.isNaN(t) ? null : t;
}

function withinWindow(a: DuplicateCandidate, b: DuplicateCandidate): boolean {
  const ta = renewalTime(a);
  const tb = renewalTime(b);
  if (ta == null || tb == null) return false;
  return Math.abs(ta - tb) <= OVERLAP_WINDOW_DAYS * DAY_MS;
}

export function findDuplicateGroups(
  subscriptions: DuplicateCandidate[]
): DuplicateGroup[] {
  const live = subscriptions.filter((s) => s.status !== "archived");
  const groups: DuplicateGroup[] = [];

  // 1. Same merchant tracked more than once.
  const byMerchant = new Map<string, DuplicateCandidate[]>();
  for (const s of live) {
    const k = merchantKey(s);
    if (!k) continue;
    const list = byMerchant.get(k) ?? [];
    list.push(s);
    byMerchant.set(k, list);
  }

  const sameMerchantPairs = new Set<string>();
  for (const [k, list] of byMerchant) {
    if (list.length < 2) continue;
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        sameMerchantPairs.add(pairKey(list[i].id, list[j].id));
      }
    }
    groups.push({
      kind: "same_merchant",
      key: `merchant:${k}`,
      reason: `Same merchant tracked ${list.length} times.`,
      subscriptions: [...list].sort((a, b) => a.name.localeCompare(b.name)),
    });
  }

  // 2. Renewals within OVERLAP_WINDOW_DAYS of each other (connected clusters),
  //    skipping pairs already reported above as the same merchant.
  const parent = new Map<string, string>();
  const find = (id: string): string => {
    let root = id;
    while (parent.get(root) && parent.get(root) !== root) root = parent.get(root)!;
    return root;
  };
  const union = (a: string, b: string) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  };

  for (const s of live) parent.set(s.id, s.id);

  for (let i = 0; i < live.length; i++) {
    for (let j = i + 1; j < live.length; j++) {
      const a = live[i];
      const b = live[j];
      if (sameMerchantPairs.has(pairKey(a.id, b.id))) continue;
      if (withinWindow(a, b)) union(a.id, b.id);
    }
  }

  const clusters = new Map<string, DuplicateCandidate[]>();
  for (const s of live) {
    const root = find(s.id);
    const list = clusters.get(root) ?? [];
    list.push(s);
    clusters.set(root, list);
  }

  for (const [root, list] of clusters) {
    if (list.length < 2) continue;
    groups.push({
      kind: "renewal_overlap",
      key: `renewal:${root}`,
      reason: `Renewals fall within ${OVERLAP_WINDOW_DAYS} days of each other.`,
      subscriptions: [...list].sort((a, b) => {
        const ta = renewalTime(a) ?? 0;
        const tb = renewalTime(b) ?? 0;
        return ta - tb;
      }),
    });
  }

  return groups;
}

function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}
