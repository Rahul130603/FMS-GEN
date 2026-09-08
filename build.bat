@echo off
title Build PubVantage EPUB Production Studio
echo ========================================================
echo   Building PubVantage EPUB Studio for Production
echo ========================================================
echo.

cd /d "%~dp0"

echo Running TypeScript check and Vite build...
call npm run build

if %errorlevel% equ 0 (
    echo.
    echo ========================================================
    echo   [SUCCESS] Build completed! Output generated in dist/
    echo ========================================================
) else (
    echo.
    echo [ERROR] Build failed! Check output above for details.
)

pause
