# Phase 3 — Card issuer evaluation checklist

Use this when evaluating Stripe Issuing, Lithic, Marqeta, or similar programs
for Subscription Guard virtual cards (Cloaked Pay–style privacy, but
**per-subscription** — see `docs/ULTIMATE_FEATURES_SCOPE.md` § Phase 3).

**Gate:** Do not write production issuing code until a human signs off on one
provider and sandbox credentials exist.

---

## Program fit

- [ ] US consumer virtual cards supported (initial market)
- [ ] **Merchant-locked** or MCC/descriptor-scoped spending controls available
- [ ] Per-card **amount caps** and **transaction count** limits
- [ ] **Freeze / unfreeze** (or equivalent) via API without closing the subscription workflow
- [ ] Real-time **authorization webhooks** (approve/decline) with idempotency keys
- [ ] Sandbox environment with test cards and simulated auths
- [ ] Clear path from sandbox → production (timeline and approval steps)

## Compliance & ops

- [ ] KYC/AML: who collects identity — us vs issuer vs embedded flow?
- [ ] User agreements: cardholder terms, privacy, dispute flow
- [ ] PCI scope: confirm we never store PAN/CVV (issuer hosts card UI)
- [ ] Fraud monitoring: issuer vs our rules for subscription renewals
- [ ] Support model: who handles declined auths and merchant mismatches?

## Economics

- [ ] Per-card monthly cost, per-auth cost, inactive card fees
- [ ] Minimum program commit or volume requirements
- [ ] Interchange / revenue share (if any) — affects pricing model
- [ ] Compare **one card per subscription** vs per-transaction cost at 10 / 50 / 200 subs per user

## Product alignment (non-negotiables)

- [ ] Declined/frozen auth must map to **`payment_blocked`** in app state — never **`cancellation_confirmed`**
- [ ] Issuing controls complement — do not replace — human-approved merchant cancellation
- [ ] Webhook handler can write `payment_events` and dedupe by `provider_event_id`

## Engineering spike (after provider selected)

- [ ] Create virtual card in sandbox tied to test subscription
- [ ] Receive authorization webhook; approve one auth, decline one (over cap / wrong merchant)
- [ ] Freeze card; confirm renewal auth declines
- [ ] Document webhook secrets as **server-only** env vars (never in repo)

## Questions to ask sales / solutions engineering

1. Can we restrict a virtual card to a single merchant descriptor or merchant ID?
2. Can we set a max charge equal to the subscription's expected renewal amount?
3. Can we limit to N successful charges per billing period?
4. What happens when the merchant changes billing descriptor (common with trials)?
5. Timeline and checklist for production program approval?

---

When complete, update `NEXT_STEPS.md` Phase 3 items and record chosen provider
in a `// TODO(human):` comment or internal runbook — not committed secrets.
