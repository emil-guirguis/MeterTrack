# SQL Server DDL

This folder contains SQL Server scripts for setting up the data model mirrored from the MongoDB MeterReading.

## Files
- `meterreadings_table.sql` – creates the `dbo.meterreadings` table (all lowercase), constraints, indexes, and an update trigger.

## Apply
Run in SQL Server Management Studio or sqlcmd:

```sql
:r .\meterreadings_table.sql
```

Or copy-paste into an SSMS query window and execute.

### Using migrations (recommended)
This repo includes a simple PowerShell migration runner that applies SQL files in `migrations/` once.

1) Ensure sqlcmd is available on your system
2) Place new migration files in `database/sqlserver/migrations/` named with sortable prefixes (e.g. `20251007_002_add_new_columns.sql`)
3) Run the migration runner:

```powershell
pwsh -File .\database\sqlserver\apply-migrations.ps1 -Server "<server>" -Database "<db>" -User "<user>" -Password "<pass>" -TrustServerCertificate
```

The runner tracks applied migrations in `dbo.schema_migrations`, so each file is executed only once.

## Maintain
- When you add fields to `backend/src/models/MeterReading.js`, update this script accordingly.
- Keep names lowercase for consistency; prefer adding new columns at the end.
- If you need arrays beyond `rawbasic`/`rawextended`, consider using JSON (nvarchar(max)) or a child table.
