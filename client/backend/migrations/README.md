# Database Migrations

This directory contains SQL migration files for the Client System database schema.

## Migration Files

Migrations are numbered sequentially and should be executed in order:

1. `001_create_sites_table.sql` - Creates the sites table for Sync site information
2. `002_create_meters_table.sql` - Creates the meters table with site_id foreign key
3. `003_create_meter_readings_table.sql` - Creates the meter_readings table with meter_id foreign key

## Running Migrations

To run all migrations:

```bash
node migrations/run-migrations.js
```

Or add to package.json scripts:

```json
{
  "scripts": {
    "db:migrate": "node migrations/run-migrations.js"
  }
}
```

Then run:

```bash
npm run db:migrate
```

## Rollback Scripts

Rollback scripts are located in the `rollback/` directory. To rollback a migration, execute the corresponding rollback SQL file manually:

```bash
psql -U postgres -d meterit_client -f migrations/rollback/003_drop_meter_readings_table.sql
```

## Schema Overview

### sites
- Stores Sync site information
- Contains API keys for authentication
- Tracks last heartbeat timestamp

### meters
- Stores meter information for all sites
- Links to sites via site_id foreign key
- Contains BACnet configuration

### meter_readings
- Stores meter reading data from all sites
- Links to meters via meter_id foreign key
- Indexed for performance on meter_id and timestamp

## Notes

- All migrations use `IF NOT EXISTS` to allow safe re-execution
- Foreign keys use `ON DELETE CASCADE` for automatic cleanup
- Indexes are created for performance on frequently queried columns
- Comments are added to tables and columns for documentation
