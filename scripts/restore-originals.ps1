# Restore full-resolution band photos from git (safe for binary JPG on Windows).
# Do NOT use: git show commit:file.jpg > file.jpg  (corrupts images on Windows)
#
#   cd C:\Users\jaydh\jason-hackner-music
#   .\scripts\restore-originals.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

$Commit = "3d0aea1"
$Files = @(
    "Jason_Plus_the_MLC_2021.JPG",
    "tosco_2022_christmas_pic.JPG",
    "JASON_AND_THE_MLC_036.JPG"
)

Write-Host "Restoring originals from commit $Commit ..." -ForegroundColor Cyan
git checkout $Commit -- @Files

foreach ($f in $Files) {
    if (Test-Path $f) {
        $len = (Get-Item $f).Length
        Write-Host "  OK $f ($len bytes)" -ForegroundColor Green
    } else {
        Write-Warning "  Missing $f"
    }
}

Write-Host ""
Write-Host "Next: python scripts\crop-mark.py" -ForegroundColor Cyan
