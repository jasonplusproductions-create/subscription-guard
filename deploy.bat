@echo off
REM Double-click to deploy site from C:\Users\jaydh\jason-hackner-music
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File ".\scripts\deploy.ps1"
pause
