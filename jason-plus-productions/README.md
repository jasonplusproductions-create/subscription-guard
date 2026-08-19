# Jason Plus Productions — jasonplusproductions.com

Static hub site. Deploy this folder to Vercel (or any static host).

## Current feature

Hero **Now Featured** → **"Never Ask What Could've Been"** (Glam* / ARRANGEMENTS single).

## Deploy

### Option A — Replace files on your machine (if you already host from a local folder)

```powershell
cd C:\path\to\your\jpp-site
curl.exe -L "https://raw.githubusercontent.com/jasonplusproductions-create/subscription-guard/cursor/never-ask-press-708b/jason-plus-productions/index.html" -o index.html
git add index.html
git commit -m "Feature Never Ask What Could've Been on homepage"
git push
```

Vercel redeploys automatically if the project is Git-linked.

### Option B — One-line index only (keep existing CSS/JS on server)

```powershell
curl.exe -L "https://raw.githubusercontent.com/jasonplusproductions-create/subscription-guard/cursor/never-ask-press-708b/jason-plus-productions/index.html" -o index.html
```

Then upload `index.html` to your host or push to your JPP repo.

### Option C — Clone this folder

```powershell
git clone -b cursor/never-ask-press-708b --single-branch https://github.com/jasonplusproductions-create/subscription-guard.git jpp-temp
xcopy /E /I jpp-temp\jason-plus-productions C:\path\to\your\jpp-site
```

## Files

| File | Purpose |
|------|---------|
| `index.html` | Homepage (Never Ask feature) |
| `styles.css` | Styles (matches live site) |
| `landing.js` | Nav, reveal animations |
| `chatbot.js` | Site chatbot |
| `privacy.html`, `terms.html` | Legal pages |

Images load from Supabase storage URLs embedded in the HTML (no local image copies required).
