# MCP Agent Process Management Script

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("start", "stop", "restart", "status")]
    [string]$Action
)

$ProcessName = "mcp-modbus-agent"
$LogFile = "logs\mcp-agent.log"

function Get-MCPProcess {
    # Look for node processes running MCP modbus agent
    $processes = Get-WmiObject Win32_Process | Where-Object { 
        $_.Name -eq "node.exe" -and 
        ($_.CommandLine -like "*mcp-modbus-agent*" -or 
         $_.CommandLine -like "*dist/index.js*" -or
         $_.CommandLine -like "*dist\\index.js*")
    }
    
    if ($processes) {
        return $processes
    }
    
    # Fallback: check for node processes in the current directory
    $currentDir = (Get-Location).Path
    return Get-WmiObject Win32_Process | Where-Object { 
        $_.Name -eq "node.exe" -and 
        $_.CommandLine -like "*$currentDir*"
    }
}

function Start-MCPAgent {
    Write-Host "Starting MCP Modbus Agent..." -ForegroundColor Green
    
    # Build first
    Write-Host "Building project..." -ForegroundColor Yellow
    npm run build
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Build failed!" -ForegroundColor Red
        exit 1
    }
    
    # Create logs directory if it doesn't exist
    if (!(Test-Path "logs")) {
        New-Item -ItemType Directory -Path "logs" -Force
    }
    
    # Start the agent
    Write-Host "Starting agent..." -ForegroundColor Yellow
    Start-Process -FilePath "node" -ArgumentList "dist/index.js" -NoNewWindow -RedirectStandardOutput $LogFile -RedirectStandardError "logs\error.log"
    
    Start-Sleep 2
    $process = Get-MCPProcess
    if ($process) {
        Write-Host "MCP Agent started successfully (PID: $($process.Id))" -ForegroundColor Green
    } else {
        Write-Host "Failed to start MCP Agent" -ForegroundColor Red
    }
}

function Stop-MCPAgent {
    Write-Host "Stopping MCP Modbus Agent..." -ForegroundColor Yellow
    
    $processes = Get-MCPProcess
    if ($processes) {
        foreach ($proc in $processes) {
            Write-Host "Stopping process $($proc.Id)..." -ForegroundColor Yellow
            Stop-Process -Id $proc.Id -Force
        }
        Write-Host "MCP Agent stopped" -ForegroundColor Green
    } else {
        Write-Host "No MCP Agent processes found" -ForegroundColor Yellow
    }
}

function Get-MCPStatus {
    Write-Host "Checking MCP Agent status..." -ForegroundColor Cyan
    
    $processes = Get-MCPProcess
    if ($processes) {
        Write-Host "MCP Agent is running:" -ForegroundColor Green
        foreach ($proc in $processes) {
            $startTime = (Get-Process -Id $proc.ProcessId -ErrorAction SilentlyContinue).StartTime
            Write-Host "  PID: $($proc.ProcessId), Command: $($proc.CommandLine)" -ForegroundColor White
            if ($startTime) {
                Write-Host "  Started: $startTime" -ForegroundColor White
            }
        }
    } else {
        Write-Host "MCP Agent is not running" -ForegroundColor Yellow
        
        # Check for any node processes for debugging
        $allNodeProcesses = Get-WmiObject Win32_Process | Where-Object { $_.Name -eq "node.exe" }
        if ($allNodeProcesses) {
            Write-Host "Found $($allNodeProcesses.Count) node.exe processes:" -ForegroundColor Yellow
            foreach ($proc in $allNodeProcesses) {
                Write-Host "  PID: $($proc.ProcessId), Command: $($proc.CommandLine)" -ForegroundColor Gray
            }
        }
    }
    
    # Check log file
    if (Test-Path $LogFile) {
        $logSize = (Get-Item $LogFile).Length
        Write-Host "Log file: $LogFile ($logSize bytes)" -ForegroundColor Cyan
    }
}

# Main execution
switch ($Action) {
    "start" { Start-MCPAgent }
    "stop" { Stop-MCPAgent }
    "restart" { 
        Stop-MCPAgent
        Start-Sleep 2
        Start-MCPAgent 
    }
    "status" { Get-MCPStatus }
}