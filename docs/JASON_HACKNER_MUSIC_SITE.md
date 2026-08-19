# Jason Hackner Music site

The MLC static site is **split out** of the Subscription Guard app codebase.

## Use the dedicated branch (site at repo root)

```bash
git clone -b jason-hackner-music --single-branch https://github.com/jasonplusproductions-create/subscription-guard.git jason-hackner-music
cd jason-hackner-music
```

That branch contains **only** the music site (`index.html`, photos, audio, `vercel.json`) — no Next.js / Supabase code.

## Move to its own GitHub repo (recommended)

1. On GitHub, create an empty repo: **`jason-hackner-music`** under `jasonplusproductions-create`.
2. From the cloned folder above:

```bash
git remote rename origin old-origin
git remote add origin https://github.com/jasonplusproductions-create/jason-hackner-music.git
git push -u origin jason-hackner-music:main
```

3. In Vercel, connect the new repo (root = `.`, no build step).
4. Domain: `themlc.jasonplusproductions.com`.

## Artist identity photos (before deploy)

Copy from `C:\Users\jaydh\suno generate\Artist Identity - Jason H` into the site root:

- Pic **6** → `artist-identity-06.jpg` (footer)
- Pic **9** → `artist-identity-09.jpg` (gallery)

See `ASSETS.md` on the `jason-hackner-music` branch.

## Do not add site files back into Subscription Guard

Keep music site assets and deploy config out of `main` on this repo.
