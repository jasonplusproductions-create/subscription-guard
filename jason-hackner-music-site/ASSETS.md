# Artist identity photos (pics 6 & 9)

Copy these two files from your local folder into this directory **before deploy**:

**Source folder (Windows):**
```
C:\Users\jaydh\suno generate\Artist Identity - Jason H
```

| Site filename | Which file | Used on site |
|---------------|------------|--------------|
| `artist-identity-06.jpg` | **Pic 6** — leather jacket, moody portrait | Footer row, 3rd thumbnail (above footer) |
| `artist-identity-09.jpg` | **Pic 9** — suit with red tie | Gallery, slide 2 (replaces Mark Larson shot) |

Rename on copy if your files have different names — the HTML expects exactly:
- `artist-identity-06.jpg`
- `artist-identity-09.jpg`

## Deploy

1. Copy all existing site assets from the live site (or your current deploy folder).
2. Add the two identity files above.
3. Replace `index.html` with this version.
4. Redeploy to Vercel (same project as `themlc.jasonplusproductions.com`).

Removed from the site: `20251215_153747.jpg` (Mark Larson) in footer and gallery.
