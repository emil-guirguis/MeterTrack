# Migration 006: Add Relationship Indexes

## Purpose
This migration adds database indexes for foreign keys to optimize relationship queries and JOIN operations.

## Benefits
- Faster JOIN operations when loading relationships
- Improved query performance for filtered queries (e.g., by tenant and status)
- Better performance for meter readings queries by meter and date range

## How to Apply

### Option 1: Using the SQL file directly
```bash
psql -U your_user -d your_database -f 006_add_relationship_indexes.sql
```

### Option 2: Using the Node.js script
```bash
node run-006-indexes.js
```

### Option 3: Manual execution
Connect to your database and run the SQL commands from `006_add_relationship_indexes.sql`

## Indexes Created

### Foreign Key Indexes
- `idx_meters_device_id` - Optimize meter → device relationship
- `idx_meters_location_id` - Optimize meter → location relationship
- `idx_meters_tenant_id` - Optimize meter → tenant relationship
- `idx_devices_tenant_id` - Optimize device → tenant relationship
- `idx_locations_tenant_id` - Optimize location → tenant relationship
- `idx_contacts_tenant_id` - Optimize contact → tenant relationship
- `idx_users_tenant_id` - Optimize user → tenant relationship
- `idx_meter_readings_meter_id` - Optimize meter → readings relationship
- `idx_meter_maintenance_meter_id` - Optimize meter → maintenance relationship
- `idx_meter_status_log_meter_id` - Optimize meter → status logs relationship
- `idx_meter_triggers_meter_id` - Optimize meter → triggers relationship
- `idx_meter_usage_alerts_meter_id` - Optimize meter → usage alerts relationship
- `idx_meter_monitoring_alerts_meter_id` - Optimize meter → monitoring alerts relationship
- `idx_meter_maps_meter_id` - Optimize meter → maps relationship

### Composite Indexes (for common query patterns)
- `idx_meters_tenant_status` - Optimize filtered meter queries
- `idx_devices_tenant_status` - Optimize filtered device queries
- `idx_locations_tenant_status` - Optimize filtered location queries
- `idx_contacts_tenant_status` - Optimize filtered contact queries
- `idx_meter_readings_meter_timestamp` - Optimize meter readings by date range

## Performance Impact

### Before Indexes
- Relationship queries: Sequential scans on large tables
- Filtered queries: Full table scans

### After Indexes
- Relationship queries: Index scans (10-100x faster)
- Filtered queries: Index scans with early filtering

## Verification

After applying the migration, verify indexes were created:

```sql
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
```

## Rollback

To remove the indexes:

```sql
DROP INDEX IF EXISTS idx_meters_device_id;
DROP INDEX IF EXISTS idx_meters_location_id;
-- ... (drop all other indexes)
```

See `rollback/006_remove_indexes.sql` for the complete rollback script.
