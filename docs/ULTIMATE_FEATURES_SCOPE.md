# Subscription Guard — Ultimate Features Scope

This document catalogs the full long-term feature set for Subscription Guard,
beyond the Aug. 14 (Launch 1) and Aug. 18 (Launch 2) releases. It exists to
give every feature a home, a phase, and a dependency list — so nothing gets
built out of order or promised before its prerequisites exist.

**Non-negotiable across every phase:** the app never autonomously submits
merchant cancellation forms without explicit user approval, and payment
blocking is never treated as equivalent to merchant cancellation. Every phase
below inherits this rule with no exceptions.

See also `docs/PRODUCT_DOSSIER.md` (authoritative product spec) and
`NEXT_STEPS.md` (executable backlog for Launch 1 and Launch 2).

---

## How to Read This Document

Each feature has:

- **Phase** — when it becomes realistic to build
- **Depends on** — what has to exist first
- **Risk** — why it's not in the early releases

**Phases:**

| Phase | Target |
|-------|--------|
| Launch 1 (Aug. 14) | Manual tracking + human-approved cancellation |
| Launch 2 (Aug. 18) | Bank/card monitoring |
| Phase 3 | Payment protection (virtual cards) |
| Phase 4 | Browser automation |
| Ultimate | AI concierge layer and long-tail differentiators |

---

## Phase 3: Payment Protection

**Depends on:** a live issuer/program partner, Launch 2 shipped and stable.

| Feature | Description | Risk / Dependency |
|---------|-------------|-------------------|
| Virtual-card issuing | One merchant-specific virtual card per protected subscription | Requires regulated card-issuing partner (e.g., Stripe Issuing, US-only), KYC/AML review |
| Merchant/amount/frequency controls | Card usable only at one merchant, capped at expected renewal amount, limited number of payments | Depends on issuer's lifecycle/spending controls |
| Card freeze / unfreeze | Manual or scheduled freeze ahead of a renewal date | Distinct from cancellation — must be labeled "payment blocked," not "canceled" |
| Authorization webhooks | Real-time accept/decline decisions on incoming charges | Requires reliable, idempotent webhook handling |
| Payment reconciliation | Daily job matching payment events against subscription records | Needs `payment_events` table and dedupe logic |
| `PAYMENT_BLOCKED` as distinct state | Never merges with `CANCELLED` in the state machine | Core to the non-negotiable safety rule |

---

## Phase 4: Browser Automation (Trial Detection & Cancellation Assist)

**Depends on:** Phase 3 stable, strong merchant-cancellation-difficulty dataset
from real usage.

| Feature | Description | Risk / Dependency |
|---------|-------------|-------------------|
| Browser extension — trial detection | Recognizes trial signup flows, offers to log merchant, trial length, renewal price, cancellation URL | Must show an explicit confirmation panel before saving anything — never silent capture |
| Browser extension — never auto-submits | Extension reads and suggests; it does not fill or submit forms without a click | Same non-negotiable rule as merchant cancellation |
| Merchant-specific cancellation playbooks | Stored, crowdsourced steps for cancelling at frequently-seen merchants | Needs merchant intelligence data first (see Ultimate) |
| Isolated automation workers (e.g., Playwright) | Runs guided cancellation steps in a sandboxed session, screenshotting each step | High engineering cost; must have human approval gate before final submit, every time |
| Human approval for ambiguous screens | If the automation can't confidently identify the "Cancel" action, it stops and asks | Prevents wrong-button mistakes on unfamiliar merchant UIs |

---

## Ultimate: AI Concierge & Differentiation Layer

**Depends on:** real usage data from Launches 1–2 and Phase 3; not required for
product viability, but the long-term moat.

### 1. AI Subscription Concierge

Natural-language commands like "cancel everything I haven't used in 30 days,
but keep Spotify and Adobe." Produces a reviewable action plan; nothing
executes without approval.

**Depends on:** usage-signal data, cancellation-request infrastructure
already battle-tested.

### 2. Usage-Based Recommendations

Optional connections to app/browser/streaming activity to flag genuinely idle
subscriptions ("paid 3x, not opened in 47 days").

**Risk:** privacy-sensitive; opt-in only, never a default connection.

### 3. Smart Savings Engine

Monthly financial health report: total recurring spend, likely-unnecessary
charges, annual renewals, price increases, duplicate services, potential
savings.

**Depends on:** recurring-detection data from Launch 2.

### 4. Bill Negotiation & Refund Recovery

AI drafts (never sends unsupervised) refund requests, rate-reduction asks,
and duplicate-charge disputes, backed by the evidence trail.

**Risk:** must stay in "draft assistant" mode — no unsupported claims, no
autonomous submission.

### 5. Subscription Firewall (config layer)

Per-subscription rules: merchant restriction, max charge, billing frequency,
trial expiration, allowed payment count, auto-expire, freeze window,
renewal-approval requirement.

**Depends on:** Phase 3 virtual cards.

### 6. Post-Cancellation Watchdog (enhanced)

Already partially in Launch 1/2 as a flag. Ultimate version escalates to:
descriptor-change detection, "final invoice" charge detection,
reinstated-subscription detection, and a formal **Cancellation Verified**
status.

**Depends on:** ongoing transaction sync from Launch 2.

### 7. Shared Household Mode

Multi-user workspace: shared subscriptions, individual ownership, household
spending limits, "who uses this" labels, private individual financial
accounts.

**Risk:** significant RLS/permissions redesign; explicitly deferred until core
product is stable.

### 8. Inbox & Receipt Intelligence

Forward-to or limited-permission inbox connection; extracts subscription terms
and detects phrases like "your trial ends soon" as a second discovery channel
alongside bank monitoring.

**Risk:** mailbox access is high-sensitivity; needs its own consent and
data-minimization design.

### 9. Universal Cancellation Passport

Exportable packet per subscription (merchant, account email, billing history,
cancellation URL, request, confirmation, evidence timeline) as PDF — useful
when no automated path exists.

**Depends on:** evidence infrastructure from Launch 1.

### 10. Emergency Financial Mode

One action ("pause all nonessential recurring spending") that lists every
recurring charge, freezes protected cards, and queues a cancellation review
list — every item still requires individual confirmation.

**Depends on:** Phase 3 virtual cards.

### 11. Privacy & Data Vault

Product-wide privacy posture: no raw card numbers or bank passwords stored,
granular permissions, separated financial/subscription data, auto-deletion
schedules, full activity log, "disconnect and purge" button, optional
local-only analysis.

This is a cross-cutting requirement, not a single feature — should be
enforced from Launch 1 onward, not bolted on later.

### 12. Merchant Intelligence Network

Aggregated (anonymized) data on cancellation difficulty, refund behavior,
response time, required contact method, virtual-card acceptance, known parent
companies/billing descriptors.

**Depends on:** sufficient scale of real cancellation attempts to be
statistically meaningful. Not viable pre-launch.

---

## Explicit Non-Goals (Not on Any Roadmap Without a Separate Decision)

- Fully autonomous cancellation with no human approval step, at any phase
- Treating a declined/frozen card as proof of cancellation
- Silent inbox scraping or silent activity tracking
- Storing raw card numbers, CVVs, or bank credentials directly
- Legal threats or formal complaints generated without an evidence-backed basis

---

## Feature-to-Phase Quick Reference

| Feature | Phase |
|---------|-------|
| Manual subscription tracking | Launch 1 |
| Renewal reminders | Launch 1 |
| Human-approved cancellation workflow | Launch 1 |
| Evidence & audit trail | Launch 1 |
| Bank/card monitoring | Launch 2 |
| Recurring-charge detection | Launch 2 |
| Price-change alerts | Launch 2 |
| Post-cancellation charge flag (basic) | Launch 2 |
| Virtual-card issuing | Phase 3 |
| Card freeze/controls | Phase 3 |
| Browser trial detection | Phase 4 |
| Guided cancellation automation | Phase 4 |
| AI concierge / natural-language commands | Ultimate |
| Usage-based recommendations | Ultimate |
| Smart savings engine | Ultimate |
| Bill negotiation / refund drafting | Ultimate |
| Subscription firewall rules | Ultimate |
| Watchdog "Cancellation Verified" status | Ultimate |
| Household mode | Ultimate |
| Inbox intelligence | Ultimate |
| Cancellation passport export | Ultimate |
| Emergency financial mode | Ultimate |
| Merchant intelligence network | Ultimate |

---

This scope is a **planning reference**, not a commitment to build every item.
Use it to classify new feature ideas by phase and dependency before adding
anything to `NEXT_STEPS.md`.
