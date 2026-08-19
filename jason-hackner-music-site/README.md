# Jason Hackner Music — site package

Complete static site for **themlc.jasonplusproductions.com**, including artist-identity photo updates (pics 6 & 9).

This folder lives on branch `cursor/mlc-artist-identity-708b` in the subscription-guard repo until the MLC site has its own Git remote.

## Pull this branch (Windows)

From any folder where you want the files:

```bash
git clone https://github.com/jasonplusproductions-create/subscription-guard.git
cd subscription-guard
git fetch origin cursor/mlc-artist-identity-708b
git checkout cursor/mlc-artist-identity-708b
```

Site files are in **`jason-hackner-music-site/`**.

If you already have the repo:

```bash
git fetch origin cursor/mlc-artist-identity-708b
git checkout cursor/mlc-artist-identity-708b
git pull origin cursor/mlc-artist-identity-708b
```

## Add your two identity photos (required)

From `C:\Users\jaydh\suno generate\Artist Identity - Jason H`, copy into **`jason-hackner-music-site/`**:

| Copy this | Save as |
|-----------|---------|
| Pic **6** (leather jacket) | `artist-identity-06.jpg` |
| Pic **9** (suit, red tie) | `artist-identity-09.jpg` |

See `ASSETS.md` for where each file appears on the page.

## Deploy to Vercel

1. Point your Vercel project root at **`jason-hackner-music-site/`** (or upload this folder’s contents as the deploy root).
2. Ensure `artist-identity-06.jpg` and `artist-identity-09.jpg` are in that root next to `index.html`.
3. Deploy.

## What changed vs live site

- **Footer** (3rd thumbnail): `artist-identity-06.jpg` instead of Mark Larson photo
- **Gallery** slide 2: `artist-identity-09.jpg` instead of Mark Larson photo
- Mark Larson file `20251215_153747.jpg` is not included or referenced
