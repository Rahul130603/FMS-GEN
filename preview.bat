@echo off
title Preview PubVantage EPUB Production Studio
echo ========================================================
echo   Launching Production Preview Server
echo ========================================================
echo.

cd /d "%~dp0"

if not exist "dist\" (
    echo Production build not found. Running build first...
    call npm run build
)

echo Starting preview server at http://localhost:4173 ...
start "" "http://localhost:4173"
call npm run preview -- --port 4173 --host

pause
