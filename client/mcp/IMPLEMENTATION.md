# Client MCP Server Implementation

## Overview

The Client MCP Server has been successfully implemented for the MeterIT dual-deployment architecture. It provides AI-assisted tools for querying multi-site meter data, monitoring site connectivity, and generating reports.

## Implementation Status

✅ **Task 8.1: Create Client MCP Server foundation**
- TypeScript project setup with proper configuration
- Database client with connection pooling
- Configuration management with environment variables
- Winston logging with file rotation
- MCP server initialization with stdio transport

✅ **Task 8.2: Implement Client MCP tools**
- `query_meters` - Query meters across all sites with filters
- `query_readings` - Query readings with site, meter, date range filters
- `get_site_status` - Get Sync connectivity status with heartbeat monitoring
- `generate_report` - Generate summary, detailed, and comparison reports

## Project Structure

```
client/mcp/
├── src/
│   ├── index.ts                    # MCP server entry point
│   ├── config.ts                   # Configuration management
│   ├── database/
│   │   └── client.ts               # PostgreSQL database client
│   ├── tools/
│   │   ├── query-meters.ts         # Query meters tool
│   │   ├── query-readings.ts       # Query readings tool
│   │   ├── get-site-status.ts      # Site status tool
│   │   └── generate-report.ts      # Report generation tool
│   └── utils/
│       └── logger.ts               # Winston logger
├── dist/                           # Compiled JavaScript (generated)
├── .env.example                    # Environment template
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
# Database Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=meterit_client
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password_here

# Email Configuration (for future alert features)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@example.com
SMTP_PASSWORD=your_email_password
SMTP_FROM=alerts@meterit.com

# Logging
LOG_LEVEL=info
LOG_FILE=logs/client-mcp.log
```

## Usage

### Build and Start

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Start the server
npm start

# Development mode (build + start)
npm run dev
```

### MCP Tools

#### 1. query_meters

Query meter information across all sites.

**Parameters:**
- `site_id` (optional): Filter by specific site ID
- `external_id` (optional): Filter by meter external ID
- `is_active` (optional): Filter by active status (default: true)

**Returns:** Array of meters with site information, BACnet config, and last reading timestamp.

#### 2. query_readings

Query meter readings with filters.

**Parameters:**
- `site_id` (optional): Filter by site ID
- `meter_id` (optional): Filter by meter ID
- `external_id` (optional): Filter by meter external ID
- `data_point` (optional): Filter by data point type (e.g., total_kwh)
- `start_date` (optional): Start date (ISO 8601)
- `end_date` (optional): End date (ISO 8601)
- `limit` (optional): Max results (default: 1000)

**Returns:** Array of readings with meter and site information.

#### 3. get_site_status

Get connectivity status of Sync sites.

**Parameters:**
- `site_id` (optional): Get status for specific site
- `include_inactive` (optional): Include inactive sites (default: false)

**Returns:** Array of sites with connectivity status (online/offline/unknown), last heartbeat, and meter counts.

**Connectivity Logic:**
- `online`: Last heartbeat within 10 minutes
- `offline`: Last heartbeat > 10 minutes ago
- `unknown`: No heartbeat received

#### 4. generate_report

Generate multi-site reports with aggregated data.

**Parameters:**
- `report_type` (required): 'summary', 'detailed', or 'comparison'
- `site_ids` (optional): Array of site IDs to include
- `start_date` (required): Start date (ISO 8601)
- `end_date` (required): End date (ISO 8601)
- `data_point` (optional): Specific data point to report on

**Report Types:**
- **summary**: Aggregated statistics per site and data point
- **detailed**: Individual readings (limited to 10,000 rows)
- **comparison**: Side-by-side comparison of sites by data point

## Database Schema

The MCP server connects to the Client Database with the following schema:

### sites
- `id`: Primary key
- `name`: Site name
- `api_key`: API key for Sync authentication
- `last_heartbeat`: Last heartbeat timestamp
- `is_active`: Active status
- `created_at`: Creation timestamp

### meters
- `id`: Primary key
- `site_id`: Foreign key to sites
- `external_id`: External identifier (e.g., meter-001)
- `name`: Meter name
- `bacnet_device_id`: BACnet device ID
- `bacnet_ip`: BACnet IP address
- `created_at`: Creation timestamp

### meter_readings
- `id`: Primary key
- `meter_id`: Foreign key to meters
- `timestamp`: Reading timestamp
- `data_point`: Data point type (e.g., total_kwh, current_kw)
- `value`: Numeric value
- `unit`: Unit of measurement
- `created_at`: Creation timestamp

## Logging

Logs are written to:
- Console (colorized, simple format)
- File (JSON format with rotation)

Log levels: error, warn, info, debug

## Error Handling

All tools include comprehensive error handling:
- Database connection errors
- Query execution errors
- Invalid parameters
- Missing required fields

Errors are logged and returned to the MCP client with descriptive messages.

## Testing

To test the MCP server:

1. Ensure the Client Database is running and accessible
2. Configure `.env` with correct database credentials
3. Build and start the server: `npm run dev`
4. Use an MCP client to call the tools

## Future Enhancements

The following features are planned but not yet implemented:
- `send_alert_email` - Send alert emails for critical events
- `configure_alert_rules` - Configure alert thresholds
- Automated alert monitoring based on configurable rules
- Email notification system using nodemailer

## Requirements Satisfied

This implementation satisfies the following requirements from the design document:

- **Requirement 6.1**: Client MCP Server hosted on Client System
- **Requirement 6.2**: Tools for querying Client Database through direct connection
- Tools provide multi-site data access
- Site connectivity monitoring
- Report generation capabilities
