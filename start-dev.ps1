# MeterIt Pro Dual-Deployment Development Server Startup Script

Write-Host "🚀 Starting MeterIt Pro Development Servers (Dual-Deployment)..." -ForegroundColor Green
Write-Host ""

# Start Client Backend Server
Write-Host "📦 Starting Client Backend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd client\backend; npm start" -WindowStyle Normal

# Wait a bit for backend to start
Write-Host "⏳ Waiting for Client backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

# Start Client Frontend Server
Write-Host "🌐 Starting Client Frontend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd client\frontend; npm run dev" -WindowStyle Normal

Start-Sleep -Seconds 1

# Start Sync MCP Server
Write-Host "🔧 Starting Sync MCP Server..." -ForegroundColor Magenta
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd sync\mcp; npm run dev" -WindowStyle Normal

Start-Sleep -Seconds 1

# Start Sync Frontend Server
Write-Host "🌐 Starting Sync Frontend Server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd sync\frontend; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "✅ All servers are starting up!" -ForegroundColor Green
Write-Host ""
Write-Host "🔗 Server URLs:" -ForegroundColor Cyan
Write-Host "   Client Backend:   http://localhost:3001" -ForegroundColor White
Write-Host "   Client Frontend:  http://localhost:5173" -ForegroundColor White
Write-Host "   Sync MCP API:     http://localhost:3002" -ForegroundColor White
Write-Host "   Sync Frontend:    http://localhost:5174" -ForegroundColor White
Write-Host ""
Write-Host "💡 Tip: Keep this window open to see startup status" -ForegroundColor Gray
Write-Host "Press any key to exit this script (servers will continue running)..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")