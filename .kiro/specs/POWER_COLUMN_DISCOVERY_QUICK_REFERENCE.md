# Power Column Discovery - Quick Reference

## Endpoint Usage

### Discover Power Columns
```bash
curl -X GET http://localhost:3001/api/dashboard/power-columns \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Cache Statistics
```bash
curl -X GET http://localhost:3001/api/dashboard/power-columns/cache/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Invalidate Cache (Admin Only)
```bash
curl -X GET http://localhost:3001/api/dashboard/power-columns/cache/invalidate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": [
    {
      "name": "column_name",
      "type": "numeric",
      "label": "Column Label",
      "nullable": true,
      "hasDefault": false
    }
  ],
  "meta": {
    "count": 10,
    "cache": {
      "isCached": true,
      "columnCount": 10,
      "cacheAge": 5000,
      "cacheTTL": 3600000,
      "isValid": true
    }
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Failed to discover power columns",
  "error": "Database connection failed"
}
```

## Service Usage in Code

```javascript
const PowerColumnDiscoveryService = require('./services/PowerColumnDiscoveryService');

// Discover columns (uses cache if available)
const columns = await PowerColumnDiscoveryService.discoverColumns();

// Invalidate cache
PowerColumnDiscoveryService.invalidateCache();

// Get cache statistics
const stats = PowerColumnDiscoveryService.getCacheStats();
```

## Key Features

- **Automatic Caching:** 1-hour TTL for discovered columns
- **System Column Filtering:** Automatically excludes system columns
- **Numeric Type Filtering:** Only returns numeric data types
- **Human-Readable Labels:** Converts snake_case to Title Case
- **Cache Management:** Endpoints for invalidation and statistics
- **Error Handling:** Graceful error responses with debugging info

## Supported Numeric Types

- integer, bigint, smallint
- numeric, decimal
- real, double precision
- int2, int4, int8
- float4, float8

## Filtered System Columns

- id, created_at, updated_at
- tenant_id, meter_id, meter_element_id
- is_synchronized, retry_count, sync_status
- reading_date, device_ip, ip, port
- slave_id, source, unit_of_measurement
- data_quality, quality, final_value

## Permissions Required

- `dashboard:read` - For discovering columns and viewing cache stats
- `dashboard:admin` - For invalidating cache

## Performance

- **Query Time:** ~50-100ms (first call)
- **Cached Response:** <1ms
- **Cache TTL:** 1 hour
- **Memory Usage:** Minimal (only column metadata)

## Testing

Run tests:
```bash
npm test -- PowerColumnDiscoveryService.test.js --run
npm test -- dashboard.test.js --run
npm test -- dashboard.integration.test.js --run
```

## Integration Points

- **Server:** Mounted at `/api/dashboard` with authentication middleware
- **Authentication:** JWT token required
- **Tenant Context:** Applied via middleware
- **Database:** Queries PostgreSQL information_schema

## Troubleshooting

### No columns returned
- Check if meter_reading table exists
- Verify database connection
- Check for permission issues

### Cache not working
- Verify cache TTL hasn't expired (1 hour)
- Use `/cache/invalidate` endpoint to force refresh
- Check `/cache/stats` endpoint for cache status

### Permission denied
- Verify JWT token is valid
- Check user has `dashboard:read` permission
- For cache invalidation, user needs `dashboard:admin` permission
