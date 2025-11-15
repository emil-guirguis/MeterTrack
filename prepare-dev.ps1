Write-Host "[prepare-dev] Stopping any running dev servers..." -ForegroundColor Cyan
& powershell -NoProfile -ExecutionPolicy Bypass -File "$PSScriptRoot\stop-dev.ps1"

# Ensure Client frontend deps exist
$clientFrontend = Join-Path $PSScriptRoot 'client\frontend'
if (Test-Path $clientFrontend) {
  if (-not (Test-Path (Join-Path $clientFrontend 'node_modules'))) {
    Write-Host "[prepare-dev] Installing Client frontend dependencies..." -ForegroundColor Yellow
    Push-Location $clientFrontend
    try {
      npm install --no-audit --no-fund
    } finally {
      Pop-Location
    }
  }
}

# Ensure Sync frontend deps exist
$syncFrontend = Join-Path $PSScriptRoot 'sync\frontend'
if (Test-Path $syncFrontend) {
  if (-not (Test-Path (Join-Path $syncFrontend 'node_modules'))) {
    Write-Host "[prepare-dev] Installing Sync frontend dependencies..." -ForegroundColor Yellow
    Push-Location $syncFrontend
    try {
      npm install --no-audit --no-fund
    } finally {
      Pop-Location
    }
  }
}

# Start MCP Modbus Agent (disabled temporarily for debugging - uses PostgreSQL when enabled)
Write-Host "[prepare-dev] Skipping MCP Modbus Agent (disabled for debugging)" -ForegroundColor DarkYellow
# Uncomment below to enable the MCP agent
# Write-Host "[prepare-dev] Starting MCP Modbus Agent..." -ForegroundColor Yellow
# $mcpAgent = Join-Path $PSScriptRoot 'mcp-modbus-agent'
# if (Test-Path $mcpAgent) {
#   Push-Location $mcpAgent
#   try {
#     # Build the agent first
#     npm run build
#     if ($LASTEXITCODE -eq 0) {
#       # Start the standalone collector in background
#       Start-Process -NoNewWindow -FilePath "node" -ArgumentList "standalone-collector.mjs" -WorkingDirectory $mcpAgent
#       Write-Host "[prepare-dev] MCP Modbus Agent started successfully (PostgreSQL mode)" -ForegroundColor Green
#     } else {
#       Write-Warning "[prepare-dev] Failed to build MCP Modbus Agent"
#     }
#   } finally {
#     Pop-Location
#   }
# } else {
#   Write-Warning "[prepare-dev] MCP Modbus Agent directory not found"
# }

Write-Host "[prepare-dev] Ready." -ForegroundColor Green
