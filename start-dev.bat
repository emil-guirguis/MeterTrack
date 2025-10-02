@echo off
echo Starting Facility Management Development Servers...
echo.

echo Starting Backend Server...
start "Backend Server" cmd /k "cd backend && npm start"

echo Waiting for backend to start...
timeout /t 3 /nobreak > nul

echo Starting Frontend Server...
start "Frontend Server" cmd /k "cd responsive-web-app && npm run dev"

echo.
echo Both servers are starting up!
echo Backend: http://localhost:3001
echo Frontend: http://localhost:5173 or http://localhost:5174
echo.
echo Press any key to exit this script (servers will continue running)
pause > nul