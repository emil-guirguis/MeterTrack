# Design Document: Sync MCP Architecture Refactor

## Overview

This document details the refactoring of the sync MCP server to follow modern NestJS-inspired architecture with clear separation of concerns. The refactor establishes distinct layers for entities, DTOs, types, and modules while maintaining backward compatibility.

## Architecture Layers

### 1. Entity Layer (`src/entities/`)

**Purpose:** Represent database tables with ORM decorators and metadata.

**Structure:**
```
src/entities/
├── tenant.entity.ts
├── meter.entity.ts
├── register.entity.ts
├── device-register.entity.ts
├── meter-reading.entity.ts
└── index.ts
```

**Entity Definition Pattern:**
```typescript
/**
 * Tenant entity representing a tenant in the system
 * Database table: tenant
 * Primary key: tenant_id
 * Tenant filtered: Yes
 */
export interface TenantEntity {
  tenant_id: number;
  name: string;
  url: string;
  street?: string;
  street2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  api_key: string;
  download_batch_size?: number;
  upload_batch_size?: number;
}
```

**Key Characteristics:**
- Each entity represents a single database table
- Includes JSDoc comments with table name, primary key, and tenant filtering status
- Includes all columns from the database table
- Marks composite keys clearly
- Exported from centralized index file

### 2. DTO Layer (`src/dtos/`)

**Purpose:** Define API request/response shapes with validation.

**Structure:**
```
src/dtos/
├── tenants/
│   ├── create-tenant.dto.ts
│   ├── update-tenant.dto.ts
│   └── tenant-response.dto.ts
├── meters/
│   ├── create-meter.dto.ts
│   ├── update-meter.dto.ts
│   └── meter-response.dto.ts
├── registers/
│   ├── create-register.dto.ts
│   ├── update-register.dto.ts
│   └── register-response.dto.ts
├── device-registers/
│   ├── create-device-register.dto.ts
│   ├── device-register-response.dto.ts
│   └── device-register-batch.dto.ts
├── sync/
│   ├── batch-upload-request.dto.ts
│   ├── batch-upload-response.dto.ts
│   ├── sync-result.dto.ts
│   └── comprehensive-sync-result.dto.ts
└── index.ts
```

**DTO Definition Pattern:**
```typescript
import { IsNumber, IsString, IsOptional, IsBoolean } from 'class-validator';

/**
 * DTO for creating a new meter
 */
export class CreateMeterDto {
  @IsNumber()
  device_id: number;

  @IsString()
  name: string;

  @IsBoolean()
  active: boolean;

  @IsString()
  ip: string;

  @IsString()
  port: string;

  @IsNumber()
  meter_element_id: number;

  @IsString()
  element: string;
}
```

**Key Characteristics:**
- Organized by domain (tenants/, meters/, etc.)
- Create, update, and response DTOs for each entity
- Includes validation decorators (class-validator)
- Response DTOs match entity structure
- Exported from centralized index file

### 3. Type Layer (`src/types/`)

**Purpose:** Pure TypeScript types, interfaces, and enums for internal logic.

**Structure:**
```
src/types/
├── common.types.ts          # Shared types (pagination, responses)
├── sync.types.ts            # Sync operation types
├── collection.types.ts      # BACnet collection types
├── config.types.ts          # Configuration types
├── database.types.ts        # Database service interface
└── index.ts
```

**Type Definition Pattern:**
```typescript
/**
 * Result of a sync operation
 */
export interface SyncResult {
  success: boolean;
  inserted: number;
  updated: number;
  deleted: number;
  error?: string;
  timestamp: Date;
}

/**
 * Status of an ongoing sync operation
 */
export interface SyncStatus {
  isRunning: boolean;
  isSyncing: boolean;
  lastSyncTime?: Date;
  lastSyncSuccess?: boolean;
  lastSyncError?: string;
  lastInsertedCount: number;
  lastUpdatedCount: number;
  lastDeletedCount: number;
  count: number;
}

/**
 * Sync operation types
 */
export enum SyncOperationType {
  TENANT_SYNC = 'tenant_sync',
  METER_SYNC = 'meter_sync',
  REGISTER_SYNC = 'register_sync',
  DEVICE_REGISTER_SYNC = 'device_register_sync',
  READING_UPLOAD = 'reading_upload',
}
```

**Key Characteristics:**
- No validation decorators or ORM decorators
- Organized by domain (sync.types.ts, collection.types.ts, etc.)
- Includes enums for fixed value sets
- Includes utility interfaces for internal logic
- Exported from centralized index file

### 4. Module Layer (`src/modules/`)

**Purpose:** Organize business logic by feature/domain.

**Structure:**
```
src/modules/
├── tenants/
│   ├── tenants.service.ts
│   ├── tenants.module.ts
│   └── index.ts
├── meters/
│   ├── meters.service.ts
│   ├── meters.module.ts
│   └── index.ts
├── registers/
│   ├── registers.service.ts
│   ├── registers.module.ts
│   └── index.ts
├── device-registers/
│   ├── device-registers.service.ts
│   ├── device-registers.module.ts
│   └── index.ts
├── sync/
│   ├── sync.service.ts
│   ├── sync-manager.service.ts
│   ├── sync.module.ts
│   └── index.ts
└── collection/
    ├── collection.service.ts
    ├── collection-cycle-manager.service.ts
    ├── collection.module.ts
    └── index.ts
```

**Module Definition Pattern:**
```typescript
/**
 * Meters module - handles meter-related operations
 */
export class MetersModule {
  // Module exports services and controllers
}

/**
 * Meters service - business logic for meter operations
 */
export class MetersService {
  constructor(
    private readonly syncDatabase: SyncDatabase,
    private readonly meterCache: MeterCache,
  ) {}

  async getMeters(activeOnly: boolean): Promise<MeterEntity[]> {
    // Implementation
  }

  async upsertMeter(meter: MeterEntity): Promise<void> {
    // Implementation
  }
}
```

**Key Characteristics:**
- Each module represents a business domain
- Services use dependency injection
- Modules export related services
- Clear separation of concerns
- No duplicate logic across modules

## File Organization

### Current Structure (Before Refactor)
```
src/
├── types/
│   └── entities.ts          # Mixed entities, DTOs, types
├── bacnet-collection/
│   └── types.ts             # Collection-specific types
├── helpers/
│   └── sync-functions.ts    # Scattered type definitions
└── ...
```

### Target Structure (After Refactor)
```
src/
├── entities/
│   ├── tenant.entity.ts
│   ├── meter.entity.ts
│   ├── register.entity.ts
│   ├── device-register.entity.ts
│   ├── meter-reading.entity.ts
│   └── index.ts
├── dtos/
│   ├── tenants/
│   ├── meters/
│   ├── registers/
│   ├── device-registers/
│   ├── sync/
│   └── index.ts
├── types/
│   ├── common.types.ts
│   ├── sync.types.ts
│   ├── collection.types.ts
│   ├── config.types.ts
│   ├── database.types.ts
│   └── index.ts
├── modules/
│   ├── tenants/
│   ├── meters/
│   ├── registers/
│   ├── device-registers/
│   ├── sync/
│   └── collection/
├── api/
├── cache/
├── helpers/
├── data-sync/
├── remote_to_local-sync/
├── bacnet-collection/
├── meter-collection/
└── index.ts
```

## Migration Strategy

### Phase 1: Create New Layer Structure
1. Create `src/entities/` directory with entity files
2. Create `src/dtos/` directory with DTO files
3. Create `src/types/` directory with type files
4. Create `src/modules/` directory with module files

### Phase 2: Move and Consolidate Types
1. Extract entity interfaces from `src/types/entities.ts` → `src/entities/`
2. Extract DTO interfaces from `src/types/entities.ts` → `src/dtos/`
3. Extract utility types from `src/types/entities.ts` → `src/types/`
4. Extract collection types from `src/bacnet-collection/types.ts` → `src/types/collection.types.ts`
5. Create centralized index files for each layer

### Phase 3: Update Imports
1. Update all imports in services to use new paths
2. Update all imports in helpers to use new paths
3. Update all imports in API handlers to use new paths
4. Update all imports in tests to use new paths

### Phase 4: Verify Functionality
1. Run type checking: `npm run type-check`
2. Run tests: `npm test`
3. Run build: `npm run build`
4. Verify no broken imports or type errors

## Import Consolidation

### Before Refactor
```typescript
import { TenantEntity, MeterEntity } from '../types/entities';
import { BACnetReadResult } from '../bacnet-collection/types';
import { SyncResult } from '../helpers/sync-functions';
```

### After Refactor
```typescript
import { TenantEntity, MeterEntity } from '../entities';
import { BACnetReadResult } from '../types';
import { SyncResult } from '../types';
```

## Dependency Injection Pattern

All services use constructor-based dependency injection:

```typescript
export class MetersService {
  constructor(
    private readonly syncDatabase: SyncDatabase,
    private readonly meterCache: MeterCache,
    private readonly logger: Logger,
  ) {}
}
```

## Backward Compatibility

- All existing APIs continue to work without modification
- All database operations produce identical results
- All sync operations maintain the same behavior
- All error handling remains consistent
- All tests pass without modification

## Implementation Order

1. **Create entity layer** - Define all entities
2. **Create DTO layer** - Define all DTOs with validation
3. **Create type layer** - Define all utility types and enums
4. **Create module layer** - Organize services into modules
5. **Update imports** - Update all imports across codebase
6. **Verify functionality** - Run tests and type checking

## Key Decisions

1. **No ORM Framework**: Using interfaces instead of decorators (no TypeORM/Prisma)
2. **Class-Validator**: Using for DTO validation
3. **Dependency Injection**: Constructor-based injection for testability
4. **Centralized Exports**: All layers export from index files for clean imports
5. **Domain-Based Organization**: Modules organized by business domain, not technical layer

## Success Criteria

- ✓ All entities consolidated in `src/entities/`
- ✓ All DTOs consolidated in `src/dtos/`
- ✓ All types consolidated in `src/types/`
- ✓ All modules organized in `src/modules/`
- ✓ All imports updated to use new paths
- ✓ All tests pass
- ✓ Type checking passes
- ✓ Build succeeds
- ✓ No broken imports
- ✓ Backward compatibility maintained
