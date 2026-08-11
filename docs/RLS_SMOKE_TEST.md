# RLS smoke test (two test accounts)

Run manually after creating two Magic Link test users (A and B).

## Prerequisites

- Two signed-in sessions (different browsers or incognito)
- Supabase SQL editor or `psql` with user JWTs (optional)

## Per-table checks

For each user-owned table (`profiles`, `subscriptions`, `cancellation_requests`,
`evidence`, `notifications`, `audit_events`, and Phase 2+ tables):

1. As user A, insert a row you own.
2. As user B, attempt `select` on A's row by ID — expect **empty**.
3. As user B, attempt `update`/`delete` on A's row — expect **RLS violation** or zero rows.

## Storage

1. User A uploads evidence to `{uid_a}/...`
2. User B requests signed URL for A's path — expect **denied**.

## Script outline (Supabase client)

```typescript
// Run locally with two .env sessions — not committed.
const clientA = createClient(url, anonKey, { global: { headers: { Authorization: `Bearer ${tokenA}` } } });
const clientB = createClient(url, anonKey, { global: { headers: { Authorization: `Bearer ${tokenB}` } } });
const { data: leak } = await clientB.from("subscriptions").select("*").eq("user_id", userAId);
console.assert(leak?.length === 0, "RLS leak on subscriptions");
```

Record results in your Day 7 test pass notes before beta ship.
