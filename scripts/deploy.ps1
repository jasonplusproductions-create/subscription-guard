# Deploy Jason Hackner Music site from this folder to GitHub (Vercel auto-redeploys).
# Usage (PowerShell):
#   cd C:\Users\jaydh\jason-hackner-music
#   .\scripts\deploy.ps1
# Optional message:
#   .\scripts\deploy.ps1 -Message "Update gallery photos"

param(
    [string]$Message = "Update site photos and assets"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

if (-not (Test-Path "index.html")) {
    Write-Error "Run this from the site repo. index.html not found in $Root"
}

Write-Host "Deploying from: $Root" -ForegroundColor Cyan

# Stage site assets (images, html, press release)
$patterns = @(
    "*.html",
    "*.md",
    "*.JPG", "*.jpg", "*.jpeg",
    "*.png", "*.webp",
    "*.m4a", "*.mp3",
    "scripts/*.ps1",
    "scripts/*.py"
)
foreach ($p in $patterns) {
    git add -A $p 2>$null
}

git add index.html ASSETS.md press-release.md 2>$null

$staged = git diff --cached --name-only
if (-not $staged) {
    Write-Host "Nothing to deploy (no changes)." -ForegroundColor Yellow
    exit 0
}

Write-Host "Files to deploy:" -ForegroundColor Green
$staged | ForEach-Object { Write-Host "  $_" }

git commit -m $Message
git push origin HEAD:main

Write-Host ""
Write-Host "Pushed to GitHub. Vercel redeploys in about 1 minute." -ForegroundColor Green
Write-Host "  https://jason-hackner-music.vercel.app" -ForegroundColor Green
Write-Host "  https://themlc.jasonplusproductions.com" -ForegroundColor Green
