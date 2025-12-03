# Restart all services script
# Usage: .\mip.ps1 or powershell -File .\mip.ps1

Write-Host "[STOP] Stopping all Node processes..." -ForegroundColor Red
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "[CHECK] Checking for processes on port 3002..." -ForegroundColor Yellow
$process = Get-NetTCPConnection -LocalPort 3002 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
if ($process) {
  Write-Host "[WARN] Found process on port 3002, killing it..." -ForegroundColor Yellow
  Stop-Process -Id $process -Force -ErrorAction SilentlyContinue
}

Write-Host "[WAIT] Waiting for processes to terminate..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "[START] Starting all services..." -ForegroundColor Green
npm run dev
