@echo off
title PubVantage EPUB Production Studio
echo ========================================================
echo   PubVantage - Book Publishing & EPUB Production Suite
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/3] Checking Node.js environment...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js from https://nodejs.org/ and try again.
    pause
    exit /b 1
)

echo [2/3] Checking dependencies...
if not exist "node_modules\" (
    echo Dependencies not found. Running npm install...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] npm install failed!
        pause
        exit /b 1
    )
) else (
    echo Dependencies verified.
)

echo [3/3] Starting PubVantage EPUB Studio...
echo.
echo Application will be available at: http://localhost:5173
echo Press Ctrl+C in this window to stop the server.
echo.

start "" "http://localhost:5173"
call npm run dev

pause
