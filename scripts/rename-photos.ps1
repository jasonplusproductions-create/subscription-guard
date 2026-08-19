# Rename photos in the site folder to the exact filenames index.html expects.
# Drop files with any common name — this script renames them before deploy.
#
#   cd C:\Users\jaydh\jason-hackner-music
#   .\scripts\rename-photos.ps1

param(
    [switch]$WhatIf
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

# Target filename => patterns matched against basename (case-insensitive regex)
# First matching file in the folder wins (newest modified if multiple).
$Rules = [ordered]@{
    "artist-identity-06.png" = @(
        "^pic[\s_-]*6\b",
        "^portrait-performance",
        "^artist[\s_-]*identity[\s_-]*0?6",
        "^identity[\s_-]*0?6",
        "leather.*jacket"
    )
    "artist-identity-09.jpg" = @(
        "^pic[\s_-]*9\b",
        "^profile-headshot",
        "^artist[\s_-]*identity[\s_-]*0?9",
        "^identity[\s_-]*0?9",
        "suit.*tie",
        "red.*tie"
    )
    "Jason_Plus_the_MLC_2021.JPG" = @(
        "^jason[\s_-]*plus.*2021",
        "^2021.*mlc",
        "^band.*2021",
        "2021\.(jpe?g|JPG)$"
    )
    "JASON_AND_THE_MLC_036.JPG" = @(
        "^jason.*036",
        "^036\b",
        "036\.(jpe?g|JPG)$",
        "^mlc.*036"
    )
    "tosco_2022_christmas_pic.JPG" = @(
        "^tosco.*christmas(?!.*me)",
        "^christmas.*tosco",
        "^tosco_2022(?!.*me)"
    )
    "jason-hackner-headshot.jpg" = @(
        "^jason-hackner-headshot",
        "^headshot",
        "^studio.*head",
        "^solo.*head"
    )
    "JASON_AND_THE_MLC_020.JPG" = @(
        "^jason.*020",
        "^020\b",
        "020\.(jpe?g|JPG)$"
    )
    "parker1.jpeg" = @(
        "^parker",
        "^bass"
    )
    "gman1.jpg" = @(
        "^gman",
        "^guitar"
    )
}

function Get-ImageFiles {
    Get-ChildItem -Path $Root -File | Where-Object {
        $_.Extension -match '^\.(jpe?g|png|webp|JPG|JPEG|PNG)$'
    }
}

function Test-RuleMatch {
    param([string]$BaseName, [string[]]$Patterns)
    foreach ($p in $Patterns) {
        if ($BaseName -match $p) { return $true }
    }
    return $false
}

Write-Host "Rename photos in: $Root" -ForegroundColor Cyan
if ($WhatIf) { Write-Host "(WhatIf — no files changed)" -ForegroundColor Yellow }

$images = Get-ImageFiles
$usedSources = @{}

foreach ($target in $Rules.Keys) {
    $targetPath = Join-Path $Root $target
    if ((Test-Path $targetPath) -and -not $WhatIf) {
        # Already have correct name; skip unless a better rename candidate exists from loose files
        continue
    }

    $patterns = $Rules[$target]
    $candidates = @($images | Where-Object {
        $_.Name -ne $target -and
        -not $usedSources.ContainsKey($_.FullName) -and
        (Test-RuleMatch -BaseName $_.BaseName -Patterns $patterns)
    } | Sort-Object LastWriteTime -Descending)

    if ($candidates.Count -eq 0) { continue }

    $src = $candidates[0]
    $usedSources[$src.FullName] = $true

    if ($WhatIf) {
        Write-Host "Would rename: $($src.Name) -> $target" -ForegroundColor Green
        continue
    }

    if (Test-Path $targetPath) {
        Remove-Item $targetPath -Force
    }
    Move-Item -LiteralPath $src.FullName -Destination $targetPath -Force
    Write-Host "Renamed: $($src.Name) -> $target" -ForegroundColor Green
}

# Warn about loose files that did not match any rule
$remaining = Get-ImageFiles | Where-Object {
    $_.Name -notin $Rules.Keys -and
    $_.Name -notmatch '^(merch-|logo\.|tosco_2022_christmas_pic_me)'
}
if ($remaining) {
    Write-Host ""
    Write-Host "Unmatched images (not renamed — add to folder with a name above or rename manually):" -ForegroundColor Yellow
    $remaining | ForEach-Object { Write-Host "  $($_.Name)" }
}

Write-Host ""
Write-Host "Site expects these names (gallery / footer / hero):" -ForegroundColor Cyan
@(
    "Jason_Plus_the_MLC_2021.JPG   — gallery 1, footer 1",
    "artist-identity-09.jpg        — gallery 2",
    "parker1.jpeg                  — gallery 3",
    "gman1.jpg                     — gallery 4",
    "tosco_2022_christmas_pic.JPG  — gallery 5",
    "JASON_AND_THE_MLC_036.JPG     — gallery 6",
    "artist-identity-06.png        — footer 3",
    "jason-hackner-headshot.jpg    — hero / footer 2"
) | ForEach-Object { Write-Host "  $_" }

Write-Host ""
Write-Host "Next: .\scripts\deploy.ps1" -ForegroundColor Cyan
