@echo off
REM MeterIT Pro - Restart all services
REM Usage: mip (from any directory)

echo.
echo 🛑 Stopping all Node processes...
taskkill /F /IM node.exe 2>nul

echo ⏳ Waiting for processes to terminate...
timeout /t 3 /nobreak

echo 🚀 Starting all services...
cd /d C:\Projects\MeterItPro
npm run dev

pause
