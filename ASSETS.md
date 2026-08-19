# Artist identity photos

## Required (you supply from local folder)

**Source:** `C:\Users\jaydh\suno generate\Artist Identity - Jason H`

| Site filename | Your file | Used on site |
|---------------|-----------|--------------|
| `artist-identity-06.jpg` | **Pic 6** — leather jacket portrait | Footer row, 3rd thumbnail (above footer) |
| `artist-identity-09.jpg` | **Pic 9** — suit with red tie | Gallery, slide 2 |

Place both files in the **same folder as `index.html`** (site root), not in `artist-identity/`.

## Included in this branch (live site assets)

- `index.html` — patched for identity pics 6 & 9
- Performance photos: `Jason_Plus_the_MLC_2021.JPG`, `JASON_AND_THE_MLC_036.JPG`, `JASON_AND_THE_MLC_020.JPG`, `jason-hackner-headshot.jpg`
- Band strip: `gman1.jpg`, `parker1.jpeg`, `tosco_2022_christmas_pic*.JPG`
- Merch mockups: `merch-*.png`
- Audio: `higher-love.mp3`, `higher-ground.m4a`, `i-cant-make-you-love-me.m4a`
- `logo.png`

## Automated deploy (Windows)

From `C:\Users\jaydh\jason-hackner-music`:

| Command | What it does |
|---------|----------------|
| `.\scripts\deploy.ps1` | Commit all photo/html changes and push to GitHub |
| `.\scripts\sync-artist-photos.ps1` | Copy Pic 6/9 from Suno folder into site filenames |
| `.\scripts\deploy-all.ps1` | Sync + deploy |
| Double-click `deploy.bat` | Same as deploy.ps1 |

