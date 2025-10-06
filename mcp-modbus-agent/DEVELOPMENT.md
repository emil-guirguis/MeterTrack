# MCP Agent Development Guide

## Quick Start Commands

### Development Mode
```bash
npm run dev        # Build + watch TypeScript + auto-restart on changes
npm run dev:watch  # Direct TypeScript execution with hot reload
```

### Process Management
```bash
npm start          # Start the agent (production)
npm stop           # Stop the agent
npm restart        # Stop + rebuild + start
npm run status     # Check if agent is running
```

### Development Workflow
```bash
npm run build      # Build TypeScript to JavaScript
npm run watch      # Watch TypeScript files for changes
npm run type-check # Type checking without output
npm run clean      # Clean build directory
```

## Development Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

3. **Start development mode**:
   ```bash
   npm run dev
   ```

## Environment Configuration

### .env Variables
```env
# Modbus Configuration
MODBUS_IP=10.10.10.11          # Target Modbus device IP
MODBUS_PORT=502                # Modbus TCP port
MODBUS_SLAVE_ID=1              # Device slave ID
MODBUS_TIMEOUT=5000            # Connection timeout (ms)

# MongoDB Configuration
MONGODB_URI=mongodb://127.0.0.1:27017/meterdb
MONGODB_COLLECTION=meterreadings

# Collection Settings
COLLECTION_INTERVAL=900000      # 15 minutes (900000 ms)
AUTO_START_COLLECTION=false    # Auto-start data collection

# Logging
LOG_LEVEL=info                 # debug, info, warn, error

# MCP Server
MCP_SERVER_NAME=modbus-meter-agent
MCP_SERVER_VERSION=1.0.0
```

## Development Features

### Hot Reload
- **TypeScript Watch**: `npm run watch` compiles TypeScript on file changes
- **Nodemon**: `npm run start:dev` restarts the agent when built files change
- **Combined Dev Mode**: `npm run dev` runs both simultaneously

### Process Management
- **Windows PowerShell Script**: `manage-agent.ps1` handles process lifecycle
- **Cross-platform**: Works on Windows, with fallback commands for other platforms
- **Process Detection**: Identifies MCP agent processes accurately

### Logging
- **File Logging**: Logs to `logs/combined.log` and `logs/error.log`
- **Console Output**: Colored console output in development
- **Log Rotation**: Automatic log file rotation (5MB, 5 files)

## Development Workflow

### 1. Code Changes
```bash
# Make changes to TypeScript files in src/
# The watch process will automatically recompile
# Nodemon will restart the agent with new changes
```

### 2. Testing Changes
```bash
npm run status     # Check if agent is running
npm restart        # Force restart if needed
```

### 3. MCP Tool Testing
Use an MCP client to test the available tools:
- `start_data_collection`
- `stop_data_collection`
- `get_collection_status`
- `read_current_meter_data`
- `get_latest_reading`
- `get_meter_statistics`
- `test_connections`

### 4. Debugging
```bash
# Check logs
cat logs/combined.log | tail -20
cat logs/error.log | tail -20

# Check process status
npm run status

# Kill all processes if needed
npm run kill-all
```

## File Structure

```
mcp-modbus-agent/
├── src/                    # TypeScript source files
│   ├── index.ts           # Main MCP server
│   ├── modbus-client.ts   # Modbus TCP client
│   ├── database-manager.ts # MongoDB operations
│   ├── data-collector.ts  # Data collection orchestration
│   └── logger.ts          # Logging configuration
├── dist/                  # Compiled JavaScript
├── logs/                  # Log files
├── .env                   # Environment configuration
├── nodemon.json          # Nodemon configuration
├── manage-agent.ps1      # PowerShell process management
├── tsconfig.json         # TypeScript configuration
└── package.json          # Dependencies and scripts
```

## Troubleshooting

### Common Issues

1. **Port Already in Use**:
   ```bash
   npm run kill-all  # Kill all node processes
   npm restart       # Start fresh
   ```

2. **TypeScript Errors**:
   ```bash
   npm run type-check  # Check for type errors
   npm run clean       # Clean build directory
   npm run build       # Rebuild
   ```

3. **Process Won't Stop**:
   ```bash
   npm run kill-all              # Force kill all node processes
   taskkill /f /im node.exe      # Windows nuclear option
   ```

4. **Log Issues**:
   ```bash
   # Check if logs directory exists
   mkdir logs
   
   # Check log permissions
   ls -la logs/
   ```

### Development Tips

1. **Use TypeScript Watch**: Always run `npm run dev` for the best development experience
2. **Check Status Frequently**: Use `npm run status` to verify the agent state
3. **Monitor Logs**: Keep an eye on `logs/combined.log` for issues
4. **Test Connections**: Use the `test_connections` MCP tool to verify setup
5. **Environment Variables**: Double-check `.env` file for correct configuration

## Integration with Main Project

The MCP agent can be integrated with the facility management app's development workflow:

1. **Start the main app**: `npm run dev` (from project root)
2. **Start the MCP agent**: `npm run dev` (from mcp-modbus-agent directory)
3. **Both run simultaneously**: The agent collects data while the app serves the UI

This setup provides a complete development environment for both the web application and the IoT data collection system.