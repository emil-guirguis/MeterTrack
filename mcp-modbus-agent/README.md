# Modbus MCP Agent

A Model Context Protocol (MCP) server agent that connects to Modbus TCP devices to retrieve meter data and store it in MongoDB.

## Features

- **Modbus TCP Communication**: Connects to energy meters via Modbus TCP protocol
- **Automated Data Collection**: Scheduled data collection with configurable intervals
- **MongoDB Integration**: Stores meter readings in MongoDB with comprehensive metadata
- **MCP Server Interface**: Provides tools for data collection, monitoring, and control
- **Error Handling**: Robust error handling with automatic reconnection
- **Logging**: Comprehensive logging with configurable levels
- **Statistics**: Real-time statistics and historical data analysis

## Installation

1. Install dependencies:
```bash
npm install
```

2. Build the TypeScript project:
```bash
npm run build
```

## Configuration

Copy `.env.example` to `.env` and configure your settings:

```env
# Modbus Configuration
MODBUS_IP=10.10.10.11
MODBUS_PORT=502
MODBUS_SLAVE_ID=1
MODBUS_TIMEOUT=5000

# MongoDB Configuration
MONGODB_URI=mongodb://127.0.0.1:27017/meterdb
MONGODB_COLLECTION=meterreadings

# Collection Settings
COLLECTION_INTERVAL=30000
AUTO_START_COLLECTION=true

# Logging
LOG_LEVEL=info

# MCP Server
MCP_SERVER_NAME=modbus-meter-agent
MCP_SERVER_VERSION=1.0.0
```

## Usage

### Development Mode (Recommended)

For active development with hot reload:

```bash
npm run dev
```

This will:
- Build the TypeScript project
- Start TypeScript compiler in watch mode
- Start the MCP server with auto-restart on changes
- Monitor both TypeScript and JavaScript files

### Production Mode

```bash
npm run build
npm start
```

### Process Management

```bash
npm run status    # Check if agent is running
npm stop          # Stop the agent
npm restart       # Stop, rebuild, and start
npm run kill-all  # Force stop all node processes (emergency)
```

### Available MCP Tools

The server provides the following tools that can be called via MCP:

1. **start_data_collection**: Start collecting data from the Modbus device
2. **stop_data_collection**: Stop data collection
3. **get_collection_status**: Get current status of data collection
4. **read_current_meter_data**: Read current meter data from device
5. **get_latest_reading**: Get latest reading from database
6. **get_meter_statistics**: Get statistical data over time period
7. **test_connections**: Test connections to Modbus device and MongoDB

### Example MCP Tool Calls

```json
{
  "method": "tools/call",
  "params": {
    "name": "start_data_collection"
  }
}
```

```json
{
  "method": "tools/call",
  "params": {
    "name": "get_meter_statistics",
    "arguments": {
      "hours": 24
    }
  }
}
```

## Data Structure

The meter readings are stored with the following structure:

```typescript
interface MeterReading {
  timestamp: Date;
  voltage: number;
  current: number;
  power: number;
  energy: number;
  frequency: number;
  powerFactor: number;
  quality: 'good' | 'estimated' | 'questionable';
  source: string;
  deviceIP: string;
  meterId: string;
}
```

## Development

### Build
```bash
npm run build
```

### Development Mode
```bash
npm run dev
```

### Type Checking
```bash
npm run type-check
```

## Architecture

- **ModbusClient**: Handles Modbus TCP communication
- **DatabaseManager**: Manages MongoDB operations
- **DataCollector**: Orchestrates data collection and storage
- **MCP Server**: Provides the Model Context Protocol interface

## Error Handling

The agent includes comprehensive error handling:
- Automatic reconnection to Modbus devices
- Circuit breaker pattern for repeated failures
- Graceful degradation during network issues
- Detailed logging for troubleshooting

## Monitoring

Monitor the agent through:
- Log files in the `logs/` directory
- MCP tool calls for real-time status
- MongoDB queries for historical data
- Error counts and connection status

## License

MIT License