Write-Host "[prepare-dev] Stopping any running dev servers..." -ForegroundColor Cyan
& powershell -NoProfile -ExecutionPolicy Bypass -File "$PSScriptRoot\stop-dev.ps1"

# Ensure frontend deps exist so 'vite' is available
$frontend = Join-Path $PSScriptRoot 'responsive-web-app'
if (-not (Test-Path (Join-Path $frontend 'node_modules'))) {
  Write-Host "[prepare-dev] Installing frontend dependencies..." -ForegroundColor Yellow
  Push-Location $frontend
  try {
    npm ci --no-audit --no-fund
  } finally {
    Pop-Location
  }
} else {
  # If vite isn't on PATH due to missing local install, run a lightweight check
  $vitePath = Join-Path $frontend 'node_modules/.bin/vite.cmd'
  if (-not (Test-Path $vitePath)) {
    Write-Host "[prepare-dev] 'vite' not found, (re)installing frontend deps..." -ForegroundColor Yellow
    Push-Location $frontend
    try {
      npm ci --no-audit --no-fund
    } finally {
      Pop-Location
    }
  }
}

# Start MCP Modbus Agent
Write-Host "[prepare-dev] Starting MCP Modbus Agent..." -ForegroundColor Yellow
$mcpAgent = Join-Path $PSScriptRoot 'mcp-modbus-agent'
if (Test-Path $mcpAgent) {
  Push-Location $mcpAgent
  try {
    # Build the agent first
    npm run build
    if ($LASTEXITCODE -eq 0) {
      # Start the standalone collector in background
      Start-Process -NoNewWindow -FilePath "node" -ArgumentList "standalone-collector.mjs" -WorkingDirectory $mcpAgent
      Write-Host "[prepare-dev] MCP Modbus Agent started successfully" -ForegroundColor Green
    } else {
      Write-Warning "[prepare-dev] Failed to build MCP Modbus Agent"
    }
  } finally {
    Pop-Location
  }
} else {
  Write-Warning "[prepare-dev] MCP Modbus Agent directory not found"
}

Write-Host "[prepare-dev] Ready." -ForegroundColor Green
