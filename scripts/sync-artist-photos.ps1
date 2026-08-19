# Sync artist photos from Suno folder, rename, optional deploy.
#   cd C:\Users\jaydh\jason-hackner-music
#   .\scripts\sync-artist-photos.ps1

param(
    [string]$Source = "C:\Users\jaydh\suno generate\Artist Identity - Jason H\images",
    [switch]$Deploy
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

$candidates = @{
    "artist-identity-06.png" = @(
        "portrait-performance-clean.png",
        "portrait-performance-clean.jpg",
        "Pic 6.png", "Pic 6.jpg", "pic6.png", "pic6.jpg"
    )
    "artist-identity-09.jpg" = @(
        "profile-headshot-suit-tie.jpg",
        "profile-headshot-suit-tie.jpeg",
        "Pic 9.jpg", "Pic 9.jpeg", "pic9.jpg"
    )
}

Write-Host "Source: $Source" -ForegroundColor Cyan
Write-Host "Site folder: $Root" -ForegroundColor Cyan

if (-not (Test-Path $Source)) {
    Write-Warning "Suno folder not found. Copy pics into $Root and run .\scripts\rename-photos.ps1"
} else {
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
            Write-Host "Skip $siteName (not in Suno folder)" -ForegroundColor DarkYellow
        }
    }
}

& "$PSScriptRoot\rename-photos.ps1"

if ($Deploy) {
    & "$PSScriptRoot\deploy.ps1" -Message "Sync and rename artist photos, deploy site"
} else {
    Write-Host ""
    Write-Host "Next: .\scripts\deploy.ps1" -ForegroundColor Cyan
}
