# Requirements Document: Device Register Upsert Syntax Error Fix

## Introduction

The sync MCP server is failing to upsert device_register entities with a PostgreSQL syntax error: "syntax error at or near RETURNING". The root cause is a duplicate column definition in the entity metadata that creates malformed SQL INSERT statements.

## Glossary

- **Entity Metadata**: Configuration object that defines how to sync a specific entity type (table name, primary keys, columns)
- **Upsert**: INSERT ... ON CONFLICT ... DO UPDATE operation that inserts or updates a record
- **Device Register**: Junction table that associates devices with registers (composite key: device_id, register_id)
- **Sync MCP**: Model Context Protocol server that synchronizes data between remote and local databases

## Requirements

### Requirement 1: Fix Device Register Column Metadata

**User Story:** As a sync administrator, I want the device_register entity metadata to be correct, so that upsert operations generate valid SQL.

#### Acceptance Criteria

1. WHEN the device_register entity metadata is defined, THE Entity_Metadata SHALL have exactly two columns: device_id and register_id
2. WHEN the upsert function builds an INSERT statement for device_register, THE generated SQL SHALL contain each column name exactly once
3. WHEN an upsert operation is executed for device_register, THE SQL query SHALL be syntactically valid and execute without "RETURNING" errors
4. WHEN device_register data is synced from remote to local database, THE upsert operation SHALL succeed and return the inserted/updated record

### Requirement 2: Validate Upsert Query Generation

**User Story:** As a developer, I want to ensure the upsert query generation is correct, so that all entity types produce valid SQL.

#### Acceptance Criteria

1. WHEN building an INSERT statement, THE query builder SHALL not include duplicate column names
2. WHEN the ON CONFLICT clause is generated, THE conflicting columns SHALL match the primary key definition
3. WHEN the UPDATE SET clause is generated, THE updated columns SHALL exclude primary key columns
4. WHEN the RETURNING clause is added, THE query SHALL be syntactically valid for PostgreSQL

### Requirement 3: Verify Device Register Sync Operations

**User Story:** As a sync operator, I want device_register associations to sync correctly, so that device-to-register mappings are maintained.

#### Acceptance Criteria

1. WHEN device_register associations are synced, THE upsert operation SHALL complete without errors
2. WHEN a device_register record is inserted, THE record SHALL be retrievable from the local database
3. WHEN a device_register record is updated, THE changes SHALL be reflected in the local database
4. WHEN device_register sync completes, THE sync result SHALL report accurate insert/update/delete counts
