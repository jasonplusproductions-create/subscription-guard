# Fix corrupt JPG files on Windows (UTF-16 damage from "git show > file.jpg").
# Use Copy-Item or git checkout -- never redirect git show to image files.
#
#   cd C:\Users\jaydh\jason-hackner-music
#   .\scripts\fix-corrupt-images.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

function Test-ValidJpeg($path) {
    if (-not (Test-Path $path)) { return $false }
    $bytes = [System.IO.File]::ReadAllBytes($path)
    if ($bytes.Length -lt 4) { return $false }
    # JPEG starts with FF D8; UTF-16 corrupt starts with FF FE
    if ($bytes[0] -eq 0xFF -and $bytes[1] -eq 0xFE) { return $false }
    return ($bytes[0] -eq 0xFF -and $bytes[1] -eq 0xD8)
}

$fixes = @(
    @{
        Target = "Jason_Plus_the_MLC_2021.JPG"
        Nm     = "Jason_Plus_the_MLC_2021nm.JPG"
        Git    = "3d0aea1"
    },
    @{
        Target = "tosco_2022_christmas_pic.JPG"
        Nm     = "tosco_2022_christmas_picnm.JPG"
        Git    = "3d0aea1"
    },
    @{
        Target = "JASON_AND_THE_MLC_036.JPG"
        Nm     = "JASON_AND_THE_MLC_036nm.JPG"
        Git    = "3d0aea1"
    }
)

foreach ($f in $fixes) {
    $target = $f.Target
    if (Test-ValidJpeg $target) {
        Write-Host "OK (already valid): $target" -ForegroundColor Green
        continue
    }
    Write-Host "FIXING corrupt: $target" -ForegroundColor Yellow
    $nmPath = Join-Path $Root $f.Nm
    if (Test-Path $nmPath) {
        Copy-Item -LiteralPath $nmPath -Destination $target -Force
        Write-Host "  Copied from $($f.Nm)" -ForegroundColor Green
    } else {
        git checkout "$($f.Git)" -- $target
        Write-Host "  Restored from git commit $($f.Git)" -ForegroundColor Green
    }
    if (-not (Test-ValidJpeg $target)) {
        Write-Error "Still invalid after fix: $target"
    }
}

Write-Host ""
Write-Host "Valid JPEGs. Next:" -ForegroundColor Cyan
Write-Host "  git add Jason_Plus_the_MLC_2021.JPG tosco_2022_christmas_pic.JPG JASON_AND_THE_MLC_036.JPG"
Write-Host "  git commit -m `"Fix corrupt gallery/footer JPGs`""
Write-Host "  git push origin HEAD:main"
