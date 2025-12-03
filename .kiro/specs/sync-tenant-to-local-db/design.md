# Design Document: Sync Tenant to Local Database

## Overview

After a user logs into the remote server and receives a tenant ID, the sync system connects to the remote database and downloads the tenant record into the local sync database. This is a simple one-time synchronization that copies the tenant information from the remote database to the local sync database so the frontend can display the company information.

## Architecture

The synchronization is straightforward:

```
User logs in → Gets tenant ID
    ↓
Sync system connects to remote database
    ↓
Query remote tenant table for tenant record
    ↓
Insert/update tenant record in local sync database
    ↓
Frontend can now display tenant info
```

## Components and Interfaces

### Tenant Sync Method

Add a method to the `SyncDatabase` class to synchronize tenant data from remote to local:

**Method**: `syncTenantFromRemote(remotePool: Pool, tenantId: number): Promise<Tenant>`

**Responsibilities**:
- Query the remote database for the tenant record by ID
- Insert or update the tenant record in the local sync database
- Return the synchronized tenant record

**Implementation**:
1. Query remote database: `SELECT * FROM tenant WHERE id = $1`
2. If tenant exists, upsert to local database using existing `upsertTenant` method
3. Return the result

## Data Models

### Tenant Interface

```typescript
export interface Tenant {
  id: number;
  name: string;
  url?: string;
  address?: string;
  address2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  active?: boolean;
  created_at: Date;
  updated_at?: Date;
}
```

Both remote and local databases have the same tenant table structure with these fields.

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Tenant data round-trip consistency

*For any* tenant record in the remote database, after synchronization to the local database, querying the local database SHALL return a record with identical field values (name, url, address, address2, city, state, zip, country, active).

**Validates: Requirements 1.2**

### Property 2: Tenant ID preservation

*For any* tenant record synchronized from the remote database, the tenant ID in the local database SHALL match the original ID from the remote database.

**Validates: Requirements 1.3**

### Property 3: Idempotent synchronization

*For any* tenant record, synchronizing it multiple times in succession SHALL result in the same final state in the local database as synchronizing it once.

**Validates: Requirements 1.4**

## Error Handling

If the remote database connection fails or the tenant record is not found, the method logs an error and throws an exception. The calling code can handle the error appropriately.

</content>
</invoke>