# Sync artist photos (if present) then deploy — one command from repo root.
#   cd C:\Users\jaydh\jason-hackner-music
#   .\scripts\deploy-all.ps1

$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $PSScriptRoot
Set-Location $here

& "$PSScriptRoot\sync-artist-photos.ps1"
& "$PSScriptRoot\deploy.ps1" -Message "Sync artist photos and deploy site"
