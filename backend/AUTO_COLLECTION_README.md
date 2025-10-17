# Auto Meter Collection Service

The Auto Meter Collection Service automatically collects meter data every 30 seconds using the MCP threaded system and saves it to the database.

## Features

- **Threaded Collection**: Uses MCP worker thread for isolated, high-performance data collection
- **Auto-Start**: Automatically starts collecting data when the server boots
- **Fixed 30-Second Interval**: Optimized for real-time meter monitoring
- **Batch Processing**: Processes multiple meters efficiently in batches
- **Error Handling**: Robust error handling with retry logic
- **Statistics Tracking**: Tracks collection success rates and performance
- **Health Monitoring**: Provides health status and statistics via API endpoints

## Configuration

The service uses minimal configuration via environment variables in `.env`:

```env
# Auto Meter Collection Configuration (Threaded Mode Only - Auto-starts at 30s intervals)
METER_COLLECTION_BATCH_SIZE=10
METER_COLLECTION_TIMEOUT=10000
METER_COLLECTION_RETRIES=2

# Default Meter Configuration
DEFAULT_METER_IP=10.10.10.11
DEFAULT_METER_PORT=502
DEFAULT_METER_SLAVE_ID=1

# Collection Logging
LOG_SUCCESSFUL_READS=false
LOG_FAILED_READS=true
LOG_STATS_INTERVAL=300000               # 5 minutes
```

## How It Works

The service automatically:
1. **Starts** when the server boots (no manual intervention needed)
2. **Collects** meter data every 30 seconds using the MCP threaded system
3. **Processes** meters in batches for optimal performance
4. **Saves** all readings to the database
5. **Tracks** statistics and handles errors gracefully

## API Endpoints

### Get Collection Status
```
GET /api/auto-collection/status
```
Returns the current status and statistics of the auto collection service.

### Start Collection
```
POST /api/auto-collection/start
```
Starts the automatic meter data collection.

### Stop Collection
```
POST /api/auto-collection/stop
```
Stops the automatic meter data collection.

### Update Collection Interval
```
POST /api/auto-collection/interval
Content-Type: application/json

{
  "interval": 30000
}
```
Updates the collection interval (minimum 5000ms = 5 seconds).

### Get Statistics
```
GET /api/auto-collection/stats
```
Returns detailed collection statistics.

### Manual Collection Trigger
```
POST /api/auto-collection/collect-now
```
Provides information about triggering manual collection.

## How It Works

1. **Service Initialization**: The service initializes when the server starts
2. **Meter Discovery**: Finds all active meters in the database
3. **Data Collection**: Every 30 seconds (configurable):
   - Connects to each meter via Modbus TCP
   - Reads configured registers (voltage, current, power, energy, etc.)
   - Creates meter reading records with all collected data
   - Saves readings to the database in batches
4. **Error Handling**: Failed readings are logged but don't stop the collection process
5. **Statistics**: Tracks success/failure rates and performance metrics

## Collected Data

For each meter, the service collects:

- **Primary Measurements**: Voltage, Current, Power, Energy, Frequency, Power Factor
- **Phase Measurements**: 3-phase voltage and current readings
- **Energy Totals**: Active, Reactive, and Apparent energy
- **Metadata**: Timestamp, device IP, connection details, data quality

## Database Schema

Readings are stored in the `meterreadings` table with these key fields:

- `meterid`: Meter identifier
- `reading_value`: Primary energy reading
- `reading_date`: Timestamp of the reading
- `voltage`, `current`, `power`, `energy`: Main electrical measurements
- `phase_a_voltage`, `phase_b_voltage`, `phase_c_voltage`: Phase voltages
- `device_ip`, `port`, `slave_id`: Connection details
- `source`: Set to 'modbus_auto_collection'
- `data_quality`: Set to 'good' for successful readings

## Monitoring and Troubleshooting

### Check Service Status
```bash
curl http://localhost:3001/api/auto-collection/status
```

### View Server Logs
The service logs collection cycles and any errors:
```
🔄 Starting meter data collection cycle...
📊 Found 5 active meters for collection
✅ Collected data from meter METER001
❌ Failed to collect data from meter METER002: Connection timeout
🔄 Collection cycle completed: 4/5 successful (2341ms)
```

### Health Check
The service status is included in the main health endpoint:
```bash
curl http://localhost:3001/api/health
```

### Test Script
Run the test script to verify functionality:
```bash
node scripts/test-auto-collection.js
```

## Performance Considerations

- **Batch Size**: Default 10 meters per batch to balance performance and resource usage
- **Connection Pooling**: Reuses Modbus connections for efficiency
- **Timeout Handling**: 10-second timeout per meter to prevent hanging
- **Database Batching**: Inserts multiple readings in single database transactions

## Troubleshooting

### Common Issues

1. **No Meters Found**: Check that meters exist in the database with `status != 'inactive'`
2. **Connection Failures**: Verify meter IP addresses and network connectivity
3. **Database Errors**: Check PostgreSQL connection and table schema
4. **High Failure Rate**: Review meter configurations and network stability

### Logs to Check

- Service initialization: Look for "Auto meter collection service initialized"
- Collection cycles: Look for "Collection cycle completed" messages
- Errors: Look for "Failed to collect data from meter" messages
- Statistics: Look for periodic stats logs every 5 minutes

## Integration

The service integrates with:

- **ModbusService**: For meter communication
- **MeterReading Model**: For database operations
- **Health Check System**: For monitoring
- **Server Startup**: Automatically starts with the server

## Future Enhancements

- Per-meter collection intervals
- Dynamic meter discovery
- Data validation and quality checks
- Historical data analysis
- Alert integration for collection failures
- Web dashboard for monitoring