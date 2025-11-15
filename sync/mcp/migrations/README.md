# Sync Database Migrations

This directory contains SQL migration files for the Sync Database schema.

## Migration Files

1. **001_create_meters_table.sql** - Creates the meters table for storing local meter configuration
2. **002_create_meter_readings_table.sql** - Creates the meter_readings table with sync tracking
3. **003_create_sync_log_table.sql** - Creates the sync_log table for operation tracking

## Running Migrations

Migrations should be run in numerical order. You can run them manually using psql:

```bash
psql -U postgres -d meterit_sync -f migrations/001_create_meters_table.sql
psql -U postgres -d meterit_sync -f migrations/002_create_meter_readings_table.sql
psql -U postgres -d meterit_sync -f migrations/003_create_sync_log_table.sql
```

Or use the migration runner (to be implemented in the database client).

## Rollback Scripts

Rollback scripts are located in the `rollback/` directory. To rollback a migration, execute the corresponding rollback SQL file manually in reverse order:

```bash
# Rollback in reverse order
psql -U postgres -d meterit_sync -f migrations/rollback/003_drop_sync_log_table.sql
psql -U postgres -d meterit_sync -f migrations/rollback/002_drop_meter_readings_table.sql
psql -U postgres -d meterit_sync -f migrations/rollback/001_drop_meters_table.sql
```

**Note:** Always rollback migrations in reverse order to respect foreign key dependencies.

## Schema Overview

### meters
Stores local meter configuration cached from the Client System.
- Includes BACnet connection details
- Tracks last reading timestamp
- Stores full configuration as JSONB

### meter_readings
Temporary storage for collected readings before synchronization.
- Tracks sync status with `is_synchronized` flag
- Includes retry counter for failed sync attempts
- Optimized indexes for sync queries

### sync_log
Audit log of synchronization operations.
- Records batch size and success/failure
- Stores error messages for debugging
- Enables monitoring of sync health
