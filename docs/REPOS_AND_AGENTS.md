# Repos, products, and which agent to use

Audit of **jasonplusproductions-create** projects: what belongs in
**subscription-guard**, what should live in its own repo, and whether work should
run in **Cline** (VS Code) vs **Cursor Cloud**.

Last reviewed: 2026-08-19

---

## Summary

| Project | Repo / branch | Move out of subscription-guard? | Use Cline locally? |
|---------|---------------|----------------------------------|--------------------|
| **Subscription Guard** (app) | `subscription-guard` → `main` | **No** — this is the home repo | **Yes** — `.clinerules` → `AGENTS.md` + `NEXT_STEPS.md` |
| **Jason Hackner Music** | `subscription-guard` → branch `jason-hackner-music` → own repo `jason-hackner-music` | **Yes** — already split | **Yes** — `.clinerules` on export branch |
| **Arrangements** (show timeline) | `arrangements-timeline` | **Already separate** | **Yes** — add `.clinerules` if you use agents there |
| **Buffer MCP server** | `buffer-mcp-server` | **Already separate** | Optional — small Node MCP; no product UI |
| **Interactive Theatre** | Hosted only (`theatre.jasonplusproductions.com`) | **Should get own repo** when you agent-build it | Cline on that repo |
| **Vocal Studio** | Hosted only (`vocalstudio.jasonplusproductions.com`) | **Should get own repo** when you agent-build it | Cline on that repo |
| **Jason Plus Productions hub** | Hosted only (`jasonplusproductions.com`) | **Should get own repo** when you agent-build it | Cline on that repo |

**Rule of thumb:** one static site or one app = one repo + **Cline** in VS Code.
Do not stack unrelated sites under `subscription-guard`.

---

## Subscription Guard — stays in this repo

These are **not** separate products; do **not** split them out:

- `app/dashboard/financial/` — Plaid / bank monitoring (Launch 2)
- `app/dashboard/phase3/` — virtual cards scaffold
- `app/dashboard/phase4/` — browser extension scaffold
- `app/dashboard/ultimate/` — ultimate roadmap placeholder
- `docs/FULL_APP_SCHEMA.md`, Phase 2/3 migrations, etc.

**Agent:** Cline only for ongoing work. Read `AGENTS.md` and `NEXT_STEPS.md`.

**Cursor Cloud:** OK for one-off environment setup or PRs — not for day-to-day backlog.

---

## Jason Hackner Music — moved

- **Export branch:** `jason-hackner-music` (site files at repo root, includes `.clinerules`)
- **Do not merge** PR #3 (`jason-hackner-music-site/` nested folder) — superseded
- **Merge** PR #4 (this doc + split instructions)
- **Next:** create GitHub repo `jason-hackner-music`, push export branch as `main`, point Vercel at it

See `docs/JASON_HACKNER_MUSIC_SITE.md`.

---

## Other GitHub repos (already separate)

### `arrangements-timeline`

- Vite/static show site — correct separate repo
- No `.clinerules` yet — add one if you use Cline on Arrangements work
- **Do not** copy into subscription-guard

### `buffer-mcp-server`

- MCP integration for Buffer API — correct separate repo
- Not a consumer website; no split needed from subscription-guard

---

## Hosted sites without a repo in org (future splits)

If you use agents to edit these, **clone/create a dedicated repo first** (same
pattern as Jason Hackner Music), then open in VS Code + Cline:

| Site | URL |
|------|-----|
| JPP hub | https://jasonplusproductions.com |
| Interactive Theatre | https://theatre.jasonplusproductions.com |
| Vocal Studio | https://vocalstudio.jasonplusproductions.com |

Until then, agents cannot reliably deploy — source isn’t in GitHub.

---

## Branches to clean up (subscription-guard)

| Branch | Action |
|--------|--------|
| `jason-hackner-music` | **Keep** until own repo exists; then optional delete |
| `cursor/split-mlc-site-708b` | **Merge** PR #4, then delete branch |
| `cursor/mlc-artist-identity-708b` | **Close** PR #3; delete branch (nested site superseded) |
| `cursor/implement-full-roadmap-708b` | **Merged** — safe to delete remote branch |
| `cursor/cloaked-pay-scope-708b` | **Merged** — safe to delete remote branch |
| `cursor/setup-dev-environment-708b` | **Stale** (pre–Launch 1) — delete |

---

## Cursor Cloud agents on this repo

Three cloud runs were tied to `subscription-guard` (dev setup, roadmap PRs).
None of them should own ongoing product work except Subscription Guard backlog
on `main`.

**Recommendation:** use **Cline locally** for Subscription Guard + all JPP static
sites. Reserve Cursor Cloud for rare full-repo setup or when you explicitly want
a cloud PR.

---

## Local junk — do not commit

- `subscription-guard-new/` — duplicate Day-1 clone on disk; delete locally, not part of any branch on `main`
