@echo off
setlocal enabledelayedexpansion
title PubFlow FMS - Book Publishing Management System
color 0A

echo ======================================================================
echo             PubFlow FMS - Digital Publishing Management
echo ======================================================================
echo.

:: Ensure working directory is this script's directory
cd /d "%~dp0"

:: Set system PATH including Node.js and local binaries
set "PATH=C:\Program Files\nodejs;C:\Users\DeLL\AppData\Roaming\npm;%~dp0node_modules\.bin;%PATH%"

:: Check if Node exists
where node.exe >nul 2>nul
if %errorlevel% neq 0 (
    if exist "C:\Program Files\nodejs\node.exe" (
        set "PATH=C:\Program Files\nodejs;!PATH!"
    ) else (
        color 0C
        echo [ERROR] Node.js is not found on your system.
        echo Please install Node.js from https://nodejs.org/
        echo.
        pause
        exit /b 1
    )
)

:: Check if node_modules folder exists
if not exist "node_modules\vite\bin\vite.js" (
    echo [INFO] Installing required dependencies. Please wait...
    call npm install
    if %errorlevel% neq 0 (
        color 0C
        echo [ERROR] Failed to install dependencies.
        pause
        exit /b 1
    )
)

echo [INFO] Starting Dev Server...
echo [INFO] URL: http://localhost:3000/reports/my-report
echo [INFO] Press Ctrl+C in this window to stop the server.
echo.

:: Start Vite with auto browser open
if exist "node_modules\vite\bin\vite.js" (
    node "node_modules\vite\bin\vite.js" --host 0.0.0.0 --port 3000 --open /reports/my-report
) else (
    call npm run dev -- --host 0.0.0.0 --port 3000 --open /reports/my-report
)

if %errorlevel% neq 0 (
    echo.
    echo [INFO] Server stopped.
    pause
)
