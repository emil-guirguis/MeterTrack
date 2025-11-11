# Device Brand to Manufacturer Migration Instructions

## Current Situation

The code has been updated to use `manufacturer` instead of `brand`, but the database still has the `brand` column. This is causing the error:

```
Database error during device retrieval
```

## Solution: Run the Migration

You have two options:

### Option 1: Run Migration Script (Easiest)

1. Make sure your PostgreSQL database is running
2. Run the migration script:
   ```bash
   node run-device-migration.js
   ```

This will:
- Rename the `brand` column to `manufacturer` in the device table
- Update any related indexes
- Verify the migration was successful

### Option 2: Run SQL Directly

If you prefer to run the SQL directly:

1. Connect to your PostgreSQL database
2. Run the migration file:
   ```bash
   psql -U your_username -d facility_management -f migrations/rename-device-brand-to-manufacturer.sql
   ```

Or using a GUI tool like pgAdmin, DBeaver, or DataGrip:
- Open the file `migrations/rename-device-brand-to-manufacturer.sql`
- Execute the SQL

### Option 3: Manual SQL

If you want to run it manually, execute this SQL:

```sql
BEGIN;

-- Rename the column
ALTER TABLE device 
RENAME COLUMN brand TO manufacturer;

-- Update indexes
DROP INDEX IF EXISTS idx_device_brand;
CREATE INDEX IF NOT EXISTS idx_device_manufacturer ON device(manufacturer);

COMMIT;
```

## After Migration

1. **Restart the backend server** to ensure it picks up the changes
2. **Test the device endpoints**:
   - GET /api/device (should list all devices)
   - POST /api/device (should create a new device)
3. **Test the meter form** to ensure device selection works

## Verification

To verify the migration was successful, run:

```bash
node check-device-schema.js
```

This will show you the current schema and confirm whether the `manufacturer` column exists.

## Rollback (If Needed)

If you need to rollback the migration:

```sql
BEGIN;

ALTER TABLE device 
RENAME COLUMN manufacturer TO brand;

DROP INDEX IF EXISTS idx_device_manufacturer;
CREATE INDEX IF NOT EXISTS idx_device_brand ON device(brand);

COMMIT;
```

Then you'll need to revert all the code changes as well.

## Troubleshooting

### Database Connection Error

If you get a connection error:
1. Check that PostgreSQL is running
2. Verify your database credentials in `backend/.env`
3. Make sure the database name is correct

### Permission Error

If you get a permission error:
1. Make sure your database user has ALTER TABLE permissions
2. You may need to run as a superuser or database owner

### Column Already Exists

If you get an error that the column already exists:
1. Run `node check-device-schema.js` to see the current state
2. The migration may have already been run
3. Check if both `brand` and `manufacturer` columns exist (shouldn't happen)

## Need Help?

If you encounter any issues:
1. Check the backend server logs for detailed error messages
2. Run `node check-device-schema.js` to see the current database state
3. Check the browser console for frontend errors
