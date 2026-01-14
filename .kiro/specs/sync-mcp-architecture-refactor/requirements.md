# Requirements Document: Sync MCP Architecture Refactor

## Introduction

The sync MCP server currently has scattered type definitions, DTOs, and entity representations across multiple files without clear separation of concerns. This refactor aims to establish a modern, NestJS-inspired architecture with clear boundaries between:

- **Entities**: ORM/domain models representing database tables
- **DTOs**: API request/response shapes with validation
- **Types**: Pure TypeScript utility types, interfaces, and enums
- **Modules**: Business logic organized by feature/domain

This ensures consistency, maintainability, and scalability across the codebase.

## Glossary

- **Entity**: A class representing a database table with ORM decorators (e.g., TypeORM, Prisma)
- **DTO**: Data Transfer Object - a class defining API request/response shapes with validation rules
- **Type**: Pure TypeScript interface, enum, or utility type with no runtime behavior
- **Module**: A cohesive business domain containing controller, service, and related logic
- **Composite Key**: A primary key consisting of multiple columns (e.g., device_id + register_id)
- **Tenant Filtering**: Automatic filtering of queries by tenant_id for multi-tenant isolation
- **Sync Operation**: The process of synchronizing data between remote API and local database

## Requirements

### Requirement 1: Establish Entity Layer

**User Story:** As a developer, I want clear entity definitions representing database tables, so that I can understand the data model and maintain consistency across the codebase.

#### Acceptance Criteria

1. WHEN creating entity files THEN each entity SHALL represent a single database table with consistent naming
2. WHEN defining entities THEN each entity SHALL include all columns from its corresponding database table
3. WHEN defining entities THEN each entity SHALL clearly mark composite keys and tenant-filtered tables
4. WHEN defining entities THEN each entity SHALL include JSDoc comments explaining the entity's purpose
5. WHEN defining entities THEN each entity SHALL be exported from a centralized index file

### Requirement 2: Establish DTO Layer

**User Story:** As a developer, I want clear DTO definitions for API requests and responses, so that I can validate input and maintain consistent API contracts.

#### Acceptance Criteria

1. WHEN creating DTOs THEN each DTO SHALL be organized in a folder matching its entity name
2. WHEN creating DTOs THEN create-*.dto.ts files SHALL contain fields required for creation
3. WHEN creating DTOs THEN update-*.dto.ts files SHALL contain fields that can be updated
4. WHEN creating DTOs THEN response DTOs SHALL match the entity structure
5. WHEN creating DTOs THEN each DTO SHALL include validation decorators (class-validator)
6. WHEN creating DTOs THEN all DTOs SHALL be exported from a centralized index file

### Requirement 3: Establish Type Layer

**User Story:** As a developer, I want pure TypeScript types and interfaces separate from entities and DTOs, so that I can use them for internal logic without coupling to database or API shapes.

#### Acceptance Criteria

1. WHEN defining types THEN types SHALL include enums for fixed value sets (e.g., SyncOperation, CollectionError)
2. WHEN defining types THEN types SHALL include utility interfaces for internal logic (e.g., SyncResult, SyncStatus)
3. WHEN defining types THEN types SHALL NOT include validation decorators or ORM decorators
4. WHEN defining types THEN types SHALL be organized by domain (e.g., sync.types.ts, collection.types.ts)
5. WHEN defining types THEN all types SHALL be exported from a centralized index file

### Requirement 4: Organize Modules by Feature

**User Story:** As a developer, I want business logic organized into cohesive modules by feature/domain, so that I can understand and modify features independently.

#### Acceptance Criteria

1. WHEN organizing modules THEN each module SHALL have a clear domain (e.g., users, meters, sync)
2. WHEN organizing modules THEN each module SHALL contain controller, service, and module files
3. WHEN organizing modules THEN each module SHALL export a module class that bundles related services
4. WHEN organizing modules THEN module services SHALL use dependency injection for testability
5. WHEN organizing modules THEN module organization SHALL NOT duplicate logic across modules

### Requirement 5: Consolidate Type Definitions

**User Story:** As a developer, I want all type definitions consolidated in a single location, so that I can find and update types without searching multiple files.

#### Acceptance Criteria

1. WHEN consolidating types THEN all entity-related types SHALL be moved to entities/index.ts
2. WHEN consolidating types THEN all API-related types SHALL be moved to dtos/index.ts
3. WHEN consolidating types THEN all utility types SHALL be moved to types/index.ts
4. WHEN consolidating types THEN all module-specific types SHALL be moved to their respective modules
5. WHEN consolidating types THEN no type definitions SHALL remain scattered in service or helper files

### Requirement 6: Update Imports Across Codebase

**User Story:** As a developer, I want all imports updated to reference the new centralized locations, so that the codebase remains functional after refactoring.

#### Acceptance Criteria

1. WHEN updating imports THEN all imports of entities SHALL reference entities/index.ts
2. WHEN updating imports THEN all imports of DTOs SHALL reference dtos/index.ts
3. WHEN updating imports THEN all imports of types SHALL reference types/index.ts
4. WHEN updating imports THEN all imports SHALL use consistent path patterns (no relative paths beyond module boundaries)
5. WHEN updating imports THEN no broken imports SHALL remain after refactoring

### Requirement 7: Maintain Backward Compatibility

**User Story:** As a developer, I want the refactored code to maintain the same functionality as before, so that existing features continue to work without changes.

#### Acceptance Criteria

1. WHEN refactoring THEN all existing APIs SHALL continue to work without modification
2. WHEN refactoring THEN all database operations SHALL produce identical results
3. WHEN refactoring THEN all sync operations SHALL maintain the same behavior
4. WHEN refactoring THEN all error handling SHALL remain consistent
5. WHEN refactoring THEN all tests SHALL pass without modification
