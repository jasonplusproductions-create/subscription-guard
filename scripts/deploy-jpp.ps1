# Deploy Never Ask homepage to jpp-landing (jasonplusproductions.com)
# Run from your jpp-landing repo folder — NOT jason-hackner-music

$ErrorActionPreference = "Stop"
$Branch = "jpp-landing"
$BaseUrl = "https://raw.githubusercontent.com/jasonplusproductions-create/subscription-guard/$Branch"

Write-Host "Downloading updated JPP homepage from subscription-guard/$Branch ..." -ForegroundColor Cyan

curl.exe -L "$BaseUrl/index.html" -o index.html
if ($LASTEXITCODE -ne 0) { throw "Failed to download index.html" }

# Optional: sync JS/CSS if you want full parity (index.html alone is usually enough)
# curl.exe -L "$BaseUrl/styles.css" -o styles.css
# curl.exe -L "$BaseUrl/landing.js" -o landing.js
# curl.exe -L "$BaseUrl/chatbot.js" -o chatbot.js

git add index.html
git status

$msg = "Feature Never Ask What Could've Been on JPP homepage"
git commit -m $msg 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Nothing to commit (already up to date?) or commit failed." -ForegroundColor Yellow
} else {
    git push
    Write-Host "Pushed. Vercel jpp-landing should redeploy in ~1 min." -ForegroundColor Green
    Write-Host "Check: https://www.jasonplusproductions.com/" -ForegroundColor Green
}
