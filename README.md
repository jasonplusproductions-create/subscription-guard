# Jason Hackner Music

Static site for **themlc.jasonplusproductions.com**.

This branch/repo is **split out** from [subscription-guard](https://github.com/jasonplusproductions-create/subscription-guard) — it contains only the music site, not the Subscription Guard app.

## Clone (export branch)

```bash
git clone -b jason-hackner-music --single-branch https://github.com/jasonplusproductions-create/subscription-guard.git jason-hackner-music
cd jason-hackner-music
```

## Own repo (recommended)

Create **`jason-hackner-music`** on GitHub, then:

```bash
git remote rename origin old-origin
git remote add origin https://github.com/jasonplusproductions-create/jason-hackner-music.git
git push -u origin main
```

## Artist identity photos

Add before deploy (from `Artist Identity - Jason H`):

| File | Source |
|------|--------|
| `artist-identity-06.jpg` | Pic 6 — footer |
| `artist-identity-09.jpg` | Pic 9 — gallery |

See `ASSETS.md`.

## Work with Cline (recommended)

1. Open this folder in **VS Code** with the **Cline** extension.
2. Cline reads `.clinerules` automatically — same idea as Cursor’s `.cursorrules`.
3. Example prompt:

   *"Read ASSETS.md and .clinerules. Confirm artist-identity-06 and 09 are wired in index.html. Help me deploy to Vercel."*

For **Subscription Guard** (the Next.js app), use the separate `subscription-guard` repo — its `.clinerules` points at `AGENTS.md` and `NEXT_STEPS.md`.

## Deploy (Vercel)

Vercel redeploys automatically when you **push to `main`** on GitHub (Git integration). No manual Vercel step needed.

### One-click deploy from your PC

Folder: **`C:\Users\jaydh\jason-hackner-music`**

1. Put or replace photos in that folder (same names as `index.html` — see `ASSETS.md`).
2. Run **one** of these:

```powershell
cd C:\Users\jaydh\jason-hackner-music
.\scripts\deploy.ps1
```

Or double-click **`deploy.bat`** in that folder.

Optional — copy Artist Identity pics from Suno folder, then deploy:

```powershell
.\scripts\deploy-all.ps1
```

That runs `git add` → `commit` → `push origin HEAD:main`. Live site updates in ~1 minute.

### First-time setup (once)

```powershell
cd C:\Users\jaydh\jason-hackner-music
git remote -v
# Should show jasonplusproductions-create/jason-hackner-music
git branch -M main
```

If PowerShell blocks scripts:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

### GitHub Action (optional)

`.github/workflows/deploy-vercel.yml` only runs if `VERCEL_TOKEN` secrets are set. **Git push → Vercel Git hook is enough** for most deploys.

- Root: `.` (this folder)
- No build command
