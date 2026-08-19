# jpp-landing

Jason Plus Productions hub — **jasonplusproductions.com**

Vercel project: [jpp-landing](https://vercel.com/jason-plus-productions-s-projects/jpp-landing)

## Homepage

**Now Featured:** "Never Ask What Could've Been" — final single from Glam* / ARRANGEMENTS universe.

## Deploy

Push to `main` — Vercel redeploys automatically.

```powershell
git push origin main
```

## Source sync

If you need to refresh all files from the agent branch on subscription-guard:

```powershell
.\scripts\push-jpp-landing.ps1
```

Or download only `index.html`:

```powershell
curl.exe -L "https://raw.githubusercontent.com/jasonplusproductions-create/subscription-guard/jpp-landing/index.html" -o index.html
git add index.html && git commit -m "Update homepage" && git push
```
