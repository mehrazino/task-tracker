@echo off
echo Starting a simple HTTP server...
echo Open your browser and navigate to http://localhost:8000
echo Press Ctrl+C to stop the server

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% equ 0 (
    python -m http.server 8000
) else (
    python3 --version >nul 2>&1
    if %errorlevel% equ 0 (
        python3 -m http.server 8000
    ) else (
        echo Python is not installed. Please install Python or use another HTTP server.
        pause
    )
) 