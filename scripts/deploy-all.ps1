# Rename loose photos, sync from Suno (if present), deploy — one command.
#   cd C:\Users\jaydh\jason-hackner-music
#   .\scripts\deploy-all.ps1

$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $PSScriptRoot
Set-Location $here

& "$PSScriptRoot\rename-photos.ps1"
& "$PSScriptRoot\sync-artist-photos.ps1"
& "$PSScriptRoot\deploy.ps1" -Message "Rename photos and deploy site"
