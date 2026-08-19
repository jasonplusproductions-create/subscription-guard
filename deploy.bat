@echo off
REM Rename photos + deploy site from C:\Users\jaydh\jason-hackner-music
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File ".\scripts\deploy-all.ps1"
pause
