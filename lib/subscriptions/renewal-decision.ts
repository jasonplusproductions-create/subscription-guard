export type RenewalDecision = "undecided" | "keep" | "cancel";

export const RENEWAL_DECISIONS: {
  value: RenewalDecision;
  label: string;
}[] = [
  { value: "keep", label: "Keep it" },
  { value: "cancel", label: "Cancel it" },
  { value: "undecided", label: "Decide later" },
];

export function parseRenewalDecision(raw: unknown): RenewalDecision | null {
  return raw === "keep" || raw === "cancel" || raw === "undecided"
    ? raw
    : null;
}

export function renewalDecisionLabel(d: RenewalDecision | undefined): string {
  return (
    RENEWAL_DECISIONS.find((x) => x.value === (d ?? "undecided"))?.label ??
    "Decide later"
  );
}
