# Copy Artist Identity pics from Suno folder into the site folder with correct names.
# Usage:
#   cd C:\Users\jaydh\jason-hackner-music
#   .\scripts\sync-artist-photos.ps1

param(
    [string]$Source = "C:\Users\jaydh\suno generate\Artist Identity - Jason H\images"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

if (-not (Test-Path $Source)) {
    Write-Error "Artist Identity folder not found: $Source`nEdit -Source if your path is different."
}

# Map: source filename pattern -> site filename (edit if your Pic files differ)
$map = @(
    @{ Site = "artist-identity-06.png"; Hint = "Pic 6 / leather jacket / portrait-performance" },
    @{ Site = "artist-identity-09.jpg"; Hint = "Pic 9 / suit / profile-headshot-suit-tie" }
)

Write-Host "Source: $Source" -ForegroundColor Cyan
Write-Host "Site folder: $Root" -ForegroundColor Cyan
Write-Host ""
Write-Host "Copy your identity photos manually if auto-detect fails:" -ForegroundColor Yellow
foreach ($m in $map) {
    Write-Host "  -> $($m.Site)  ($($m.Hint))"
}
Write-Host ""

# If standard Suno export names exist, copy them
$candidates = @{
    "artist-identity-06.png" = @("portrait-performance-clean.png", "Pic 6.png", "pic6.png")
    "artist-identity-09.jpg" = @("profile-headshot-suit-tie.jpg", "Pic 9.jpg", "pic9.jpg")
}

foreach ($siteName in $candidates.Keys) {
    $dest = Join-Path $Root $siteName
    $found = $false
    foreach ($name in $candidates[$siteName]) {
        $src = Join-Path $Source $name
        if (Test-Path $src) {
            Copy-Item -Path $src -Destination $dest -Force
            Write-Host "Copied $name -> $siteName" -ForegroundColor Green
            $found = $true
            break
        }
    }
    if (-not $found) {
        Write-Host "Skip $siteName (no matching file in source)" -ForegroundColor DarkYellow
    }
}

Write-Host ""
Write-Host "Next: .\scripts\deploy.ps1" -ForegroundColor Cyan
