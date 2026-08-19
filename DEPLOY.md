# Deploy jpp-landing (jasonplusproductions.com)

Updated homepage: **"Never Ask What Could've Been"** featured on hero, promo strip, Latest Release, and What's Coming.

## Vercel project

**Team:** jason-plus-productions-s-projects  
**Project:** jpp-landing  
**Dashboard:** https://vercel.com/jason-plus-productions-s-projects/jpp-landing

## Option 1 — Connect this branch (recommended if Git was never wired)

1. Vercel → **jpp-landing** → **Settings** → **Git**
2. Connect repository: `jasonplusproductions-create/subscription-guard`
3. **Production Branch:** `jpp-landing` (this branch)
4. **Root Directory:** leave empty
5. **Save** → **Redeploy** production

## Option 2 — You have a local `jpp-landing` repo on your PC

```powershell
cd C:\Users\jaydh\jpp-landing
curl.exe -L "https://raw.githubusercontent.com/jasonplusproductions-create/subscription-guard/jpp-landing/index.html" -o index.html
git add index.html
git commit -m "Feature Never Ask What Could've Been on homepage"
git push
```

Vercel redeploys automatically when that repo receives a push.

## Verify

After deploy, https://www.jasonplusproductions.com/ should show:

- Promo: **Out Now — "Never Ask What Could've Been"**
- Hero **Now Featured:** the single (not ARRANGEMENTS-only)

## Files on this branch

| File | Purpose |
|------|---------|
| `index.html` | Homepage with Never Ask feature |
| `styles.css` | Site styles |
| `landing.js` | Nav / reveal |
| `chatbot.js` | Chat widget |
| `vercel.json` | Static site config |
