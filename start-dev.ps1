# Facility Management Development Server Startup Script

Write-Host "🚀 Starting Facility Management Development Servers..." -ForegroundColor Green
Write-Host ""

# Start Backend Server
Write-Host "📦 Starting Backend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm start" -WindowStyle Normal

# Wait a bit for backend to start
Write-Host "⏳ Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Start Frontend Server
Write-Host "🌐 Starting Frontend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd responsive-web-app; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "✅ Both servers are starting up!" -ForegroundColor Green
Write-Host ""
Write-Host "🔗 Server URLs:" -ForegroundColor Cyan
Write-Host "   Backend:  http://localhost:3001" -ForegroundColor White
Write-Host "   Frontend: http://localhost:5173 or http://localhost:5174" -ForegroundColor White
Write-Host ""
Write-Host "💡 Tip: Keep this window open to see startup status" -ForegroundColor Gray
Write-Host "Press any key to exit this script (servers will continue running)..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")