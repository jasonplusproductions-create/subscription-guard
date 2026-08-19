# fix-and-deploy.ps1 — run from C:\Users\jaydh\jpp-landing
# Downloads Never Ask homepage + assets, verifies, commits, force-pushes main.

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$Src = "https://raw.githubusercontent.com/jasonplusproductions-create/subscription-guard/jpp-landing"
$MinIndexBytes = 20000

Write-Host "`n=== JPP fix-and-deploy ===" -ForegroundColor Cyan

foreach ($f in @("index.html", "styles.css", "landing.js", "chatbot.js", "vercel.json")) {
    Write-Host "Downloading $f ..."
    curl.exe -fsSL "$Src/$f" -o $f
    if ($LASTEXITCODE -ne 0) { throw "Download failed: $f" }
}

$indexSize = (Get-Item index.html).Length
Write-Host "index.html size: $indexSize bytes" -ForegroundColor $(if ($indexSize -ge $MinIndexBytes) { "Green" } else { "Red" })
if ($indexSize -lt $MinIndexBytes) {
    throw "index.html too small ($indexSize). Expected >= $MinIndexBytes. Check network or URL."
}

if (-not (Select-String -Path index.html -Pattern "Never Ask What Could" -Quiet)) {
    throw "index.html missing Never Ask content."
}

git add index.html styles.css landing.js chatbot.js vercel.json
git status

$hasChanges = git diff --cached --quiet; $LASTEXITCODE -ne 0
if ($hasChanges) {
    git commit -m "Fix: deploy Never Ask What Could've Been homepage"
} else {
    Write-Host "No file changes (already correct locally)." -ForegroundColor Yellow
}

# Ensure branch is main
$branch = git branch --show-current
if ($branch -ne "main") {
    git branch -M main
}

Write-Host "Force-pushing main (overrides GitHub initial README commit) ..." -ForegroundColor Cyan
git push origin main --force

Write-Host "`nDone. In Vercel jpp-landing: Production Branch = main, then Redeploy if needed." -ForegroundColor Green
Write-Host "Check: https://www.jasonplusproductions.com/`n" -ForegroundColor Green
