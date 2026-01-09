# Requirements: Sync Tenant Query Column Mismatch

## Introduction

The sync MCP service fails when querying the tenant table with error: `column "id" does not exist`. This occurs because the `getTenant()` method in the data-sync service uses a SQL query that attempts to select the `id` column, but the query structure causes a column reference error.

## Glossary

- **Sync Database**: Local PostgreSQL database used by the sync MCP service
- **Remote Database**: Client system PostgreSQL database
- **Tenant Entity**: The tenant record containing company information
- **Primary Key**: The unique identifier for a record in the database

## Requirements

### Requirement 1: Fix Tenant Query Column Reference

**User Story:** As a sync service, I want to correctly query the tenant table, so that I can retrieve tenant information without SQL errors.

#### Acceptance Criteria

1. WHEN the sync service calls getTenant(), THE system SHALL execute a valid SQL query that retrieves the tenant record
2. WHEN the query executes, THE system SHALL return the tenant record with all columns properly aliased
3. WHEN the tenant table has an `id` column as primary key, THE system SHALL correctly reference it in the SELECT clause
4. WHEN the query completes successfully, THE system SHALL return a TenantEntity object with tenant_id properly mapped

### Requirement 2: Align Schema Metadata with Database Schema

**User Story:** As a developer, I want the entity metadata to match the actual database schema, so that sync operations work correctly.

#### Acceptance Criteria

1. WHEN the ENTITY_METADATA defines tenant primaryKey as 'tenant_id', THE actual database table SHALL use 'tenant_id' as the primary key column name
2. WHEN the ENTITY_METADATA lists columns to sync, THE system SHALL only reference columns that exist in the database table
3. WHEN the sync database initializes, THE schema created SHALL match the metadata definitions
4. WHEN querying entities, THE column names used SHALL match the actual database schema

### Requirement 3: Validate Tenant Query Execution

**User Story:** As a sync service, I want to validate that tenant queries work correctly, so that I can detect schema mismatches early.

#### Acceptance Criteria

1. WHEN the sync service starts, THE system SHALL test the tenant query and log the result
2. WHEN the tenant query fails, THE system SHALL provide a clear error message indicating the column mismatch
3. WHEN the query succeeds, THE system SHALL log the tenant data retrieved
4. WHEN the tenant table is empty, THE system SHALL return null without throwing an error
