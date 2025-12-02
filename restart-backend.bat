@echo off
echo Restarting backend server...
cd client\backend
echo.
echo Stopping any running Node processes on port 3001...
FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr :3001') DO TaskKill /PID %%P /F 2>nul
timeout /t 2 /nobreak >nul
echo.
echo Starting backend server...
start "Backend Server" cmd /k "npm run dev"
echo.
echo Backend server is starting...
echo Please wait a few seconds for it to fully start.
pause
