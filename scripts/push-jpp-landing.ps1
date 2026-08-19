# First-time push: populate jpp-landing repo + deploy Never Ask homepage
# Run in PowerShell from any folder (creates C:\Users\jaydh\jpp-landing)

$ErrorActionPreference = "Stop"
$RepoUrl = "https://github.com/jasonplusproductions-create/jpp-landing.git"
$Target = "C:\Users\jaydh\jpp-landing"
$Src = "https://raw.githubusercontent.com/jasonplusproductions-create/subscription-guard/jpp-landing"

if (-not (Test-Path $Target)) {
    Write-Host "Cloning $RepoUrl ..."
    git clone $RepoUrl $Target
} else {
    Write-Host "Using existing folder $Target"
    Set-Location $Target
    git pull origin main 2>$null
}

Set-Location $Target

$files = @("index.html", "styles.css", "landing.js", "chatbot.js", "vercel.json", "README.md", "DEPLOY.md")
foreach ($f in $files) {
    Write-Host "  $f"
    curl.exe -L "$Src/$f" -o $f
}

git add -A
git status

$msg = "Never Ask What Could've Been — JPP homepage feature"
git diff --cached --quiet
if ($LASTEXITCODE -eq 0) {
    Write-Host "Already up to date." -ForegroundColor Yellow
} else {
    git commit -m $msg
    git push origin main
    Write-Host "Pushed to jpp-landing. Vercel should redeploy in ~1 min." -ForegroundColor Green
}

Write-Host "Check: https://www.jasonplusproductions.com/" -ForegroundColor Cyan
