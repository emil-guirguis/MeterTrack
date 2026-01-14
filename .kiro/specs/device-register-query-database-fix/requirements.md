# Requirements: Device Register Query Database Fix

## Introduction

The sync system has a critical bug where device register data is being queried from the wrong database. The `getDeviceRegisters()` method in `data-sync.ts` queries the **local sync database** (using `this.pool`), but the system should be querying the **remote client database** to fetch device register associations that need to be synchronized.

Additionally, there is a **duplicate and unused private method** `getDeviceRegisters()` in `collection-cycle-manager.ts` that is never called and should be removed.

## Glossary

- **Sync Database**: Local PostgreSQL database that stores synchronized data (meters, readings, device registers)
- **Remote Database**: Client's PostgreSQL database that contains the source data (device_register table)
- **Device Register**: Association between a device and a register, defining which data points to read from a device
- **syncPool**: Connection pool to the local sync database
- **remotePool**: Connection pool to the remote client database

## Requirements

### Requirement 1: Fix getDeviceRegisters to Query Remote Database

**User Story:** As a sync system, I want to fetch device register associations from the remote client database, so that I can synchronize the correct device-register mappings to the local database.

#### Acceptance Criteria

1. WHEN the sync system needs to fetch device register associations, THE SyncDatabase.getDeviceRegisters() method SHALL query the remote database (remotePool) instead of the local sync database
2. WHEN querying the remote database, THE query SHALL join device_register and register tables to get complete register information
3. WHEN the remote database query succeeds, THE method SHALL return all device_register associations with their register details (register_id, register, field_name, unit)
4. WHEN the remote database query fails, THE method SHALL throw an error with a descriptive message indicating the remote database query failed
5. WHEN device_register associations are fetched from the remote database, THE data SHALL be used to populate the local sync database via upsertDeviceRegister()

### Requirement 2: Remove Unused Private Method

**User Story:** As a developer, I want to remove dead code, so that the codebase is cleaner and easier to maintain.

#### Acceptance Criteria

1. WHEN the collection-cycle-manager.ts file is reviewed, THE unused private method getDeviceRegisters() SHALL be identified as dead code (never called)
2. WHEN the dead code is identified, THE private getDeviceRegister() method SHALL be removed from collection-cycle-manager.ts
3. WHEN the method is removed, THE code should continue to function correctly because the cache-based approach (deviceRegisterCache.getDeviceRegisters()) is already being used

### Requirement 3: Verify Cache Loading Uses Correct Database

**User Story:** As a sync system, I want to ensure the device register cache is populated from the correct database, so that the system reads from the authoritative source.

#### Acceptance Criteria

1. WHEN the DeviceRegisterCache is initialized, THE cache.reload() method SHALL call syncDatabase.getDeviceRegisters() to fetch device register associations
2. WHEN syncDatabase.getDeviceRegisters() is called, IT SHALL query the remote database to fetch the source data
3. WHEN the cache is populated, THE device register mappings SHALL be available for the collection cycle to use
4. WHEN the collection cycle reads data points, THE deviceRegisterCache.getDeviceRegisters(deviceId) method SHALL return the cached register information for that device
