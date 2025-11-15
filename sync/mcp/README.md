# Sync MCP Server

This is the Sync MCP (Model Context Protocol) Server for the MeterIT dual-deployment architecture. It runs on-site at each location and handles:

- BACnet meter data collection
- Local data storage in PostgreSQL
- Data synchronization with the Client System
- Local API for the Sync Frontend
- MCP tools for AI-assisted operations

## Directory Structure

```
sync/mcp/
├── src/
│   ├── index.ts                 # MCP server entry point
│   ├── sync-service/            # Synchronization service
│   ├── meter-collection/        # BACnet meter collection
│   ├── database/                # PostgreSQL database client
│   └── tools/                   # MCP tools
├── config/
│   └── meters.example.json      # Example meter configuration
├── .env.example                 # Environment configuration template
├── package.json
└── tsconfig.json
```

## Setup

1. Copy `.env.example` to `.env` and configure:
   - Client System API URL and API key
   - Local PostgreSQL database connection
   - BACnet network settings
   - Collection and sync intervals

2. Copy `config/meters.example.json` to `config/meters.json` and configure your BACnet meters

3. Install dependencies:
   ```bash
   npm install
   ```

4. Build the project:
   ```bash
   npm run build
   ```

5. Start the server:
   ```bash
   npm start
   ```

## Configuration

See `.env.example` for all available configuration options.

## MCP Tools

The Sync MCP provides the following tools:

- `start_collection` - Start meter collection service
- `stop_collection` - Stop meter collection service
- `get_sync_status` - Get synchronization status
- `trigger_sync` - Manually trigger sync
- `query_meter_readings` - Query local readings
- `get_meter_status` - Get BACnet meter connectivity status
