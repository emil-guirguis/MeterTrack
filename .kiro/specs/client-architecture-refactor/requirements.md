# Requirements Document: Client Architecture Refactor

## Introduction

The client project (frontend and backend) currently has scattered type definitions, DTOs, entity representations, and business logic without clear separation of concerns. This refactor aims to establish a modern, NestJS-inspired architecture across both frontend and backend with clear boundaries between:

- **Entities**: ORM/domain models representing database tables (backend only)
- **DTOs**: API request/response shapes with validation (backend) and API client types (frontend)
- **Types**: Pure TypeScript utility types, interfaces, and enums
- **Modules/Features**: Business logic organized by feature/domain
- **Components**: Reusable UI components with clear props interfaces (frontend only)

This ensures consistency, maintainability, and scalability across both client applications.

## Glossary

- **Entity**: A class representing a database table with ORM decorators (backend only)
- **DTO**: Data Transfer Object - a class defining API request/response shapes with validation rules
- **Type**: Pure TypeScript interface, enum, or utility type with no runtime behavior
- **Module/Feature**: A cohesive business domain containing services, controllers, and related logic
- **Component**: A reusable UI element with clearly defined props and behavior (frontend only)
- **Service**: Business logic layer handling API calls, data transformation, and state management
- **Composite Key**: A primary key consisting of multiple columns (e.g., device_id + register_id)
- **Tenant Filtering**: Automatic filtering of queries by tenant_id for multi-tenant isolation

## Requirements

### Requirement 1: Backend - Establish Entity Layer

**User Story:** As a backend developer, I want clear entity definitions representing database tables, so that I can understand the data model and maintain consistency across the codebase.

#### Acceptance Criteria

1. WHEN creating entity files THEN each entity SHALL represent a single database table with consistent naming
2. WHEN defining entities THEN each entity SHALL include all columns from its corresponding database table
3. WHEN defining entities THEN each entity SHALL clearly mark composite keys and tenant-filtered tables
4. WHEN defining entities THEN each entity SHALL include JSDoc comments explaining the entity's purpose
5. WHEN defining entities THEN each entity SHALL be exported from a centralized index file in src/entities/

### Requirement 2: Backend - Establish DTO Layer

**User Story:** As a backend developer, I want clear DTO definitions for API requests and responses, so that I can validate input and maintain consistent API contracts.

#### Acceptance Criteria

1. WHEN creating DTOs THEN each DTO SHALL be organized in a folder matching its entity name (e.g., dtos/users/, dtos/meters/)
2. WHEN creating DTOs THEN create-*.dto.ts files SHALL contain fields required for creation
3. WHEN creating DTOs THEN update-*.dto.ts files SHALL contain fields that can be updated
4. WHEN creating DTOs THEN response DTOs SHALL match the entity structure
5. WHEN creating DTOs THEN each DTO SHALL include validation decorators (class-validator)
6. WHEN creating DTOs THEN all DTOs SHALL be exported from a centralized index file in src/dtos/

### Requirement 3: Backend - Establish Type Layer

**User Story:** As a backend developer, I want pure TypeScript types and interfaces separate from entities and DTOs, so that I can use them for internal logic without coupling to database or API shapes.

#### Acceptance Criteria

1. WHEN defining types THEN types SHALL include enums for fixed value sets (e.g., UserRole, MeterStatus, SyncOperation)
2. WHEN defining types THEN types SHALL include utility interfaces for internal logic (e.g., SyncResult, PaginationMeta)
3. WHEN defining types THEN types SHALL NOT include validation decorators or ORM decorators
4. WHEN defining types THEN types SHALL be organized by domain (e.g., auth.types.ts, meter.types.ts, sync.types.ts)
5. WHEN defining types THEN all types SHALL be exported from a centralized index file in src/types/

### Requirement 4: Backend - Organize Modules by Feature

**User Story:** As a backend developer, I want business logic organized into cohesive modules by feature/domain, so that I can understand and modify features independently.

#### Acceptance Criteria

1. WHEN organizing modules THEN each module SHALL have a clear domain (e.g., users, meters, devices, sync)
2. WHEN organizing modules THEN each module SHALL contain controller, service, and module files
3. WHEN organizing modules THEN each module SHALL export a module class that bundles related services
4. WHEN organizing modules THEN module services SHALL use dependency injection for testability
5. WHEN organizing modules THEN module organization SHALL NOT duplicate logic across modules

### Requirement 5: Frontend - Establish Type Layer

**User Story:** As a frontend developer, I want pure TypeScript types and interfaces for API responses and domain models, so that I can maintain type safety across components and services.

#### Acceptance Criteria

1. WHEN defining frontend types THEN types SHALL include domain models (e.g., User, Meter, Device, Contact)
2. WHEN defining frontend types THEN types SHALL include API response shapes matching backend DTOs
3. WHEN defining frontend types THEN types SHALL include enums for fixed value sets (e.g., UserRole, MeterStatus)
4. WHEN defining frontend types THEN types SHALL be organized by domain (e.g., auth.types.ts, meter.types.ts)
5. WHEN defining frontend types THEN all types SHALL be exported from a centralized index file in src/types/

### Requirement 6: Frontend - Establish Component Props Layer

**User Story:** As a frontend developer, I want clear prop interfaces for all components, so that I can understand component contracts and maintain type safety.

#### Acceptance Criteria

1. WHEN creating components THEN each component SHALL have a clearly defined Props interface
2. WHEN creating components props THEN Props interfaces SHALL be co-located with their components
3. WHEN creating component props THEN Props interfaces SHALL include JSDoc comments for each prop
4. WHEN creating component props THEN Props interfaces SHALL use consistent naming (ComponentNameProps)
5. WHEN creating component props THEN Props interfaces SHALL be exported alongside their components

### Requirement 7: Frontend - Organize Features by Domain

**User Story:** As a frontend developer, I want features organized into cohesive domains with clear separation of concerns, so that I can understand and modify features independently.

#### Acceptance Criteria

1. WHEN organizing features THEN each feature SHALL have a clear domain (e.g., auth, users, meters, devices)
2. WHEN organizing features THEN each feature SHALL contain pages, components, hooks, and services
3. WHEN organizing features THEN feature services SHALL handle API calls and data transformation
4. WHEN organizing features THEN feature hooks SHALL encapsulate component logic and state management
5. WHEN organizing features THEN feature organization SHALL NOT duplicate logic across features

### Requirement 8: Frontend - Establish API Client Layer

**User Story:** As a frontend developer, I want a centralized API client with typed endpoints, so that I can make API calls safely and consistently.

#### Acceptance Criteria

1. WHEN creating API clients THEN each client SHALL be organized by domain (e.g., api/users.ts, api/meters.ts)
2. WHEN creating API clients THEN each client SHALL use typed request/response shapes from backend DTOs
3. WHEN creating API clients THEN each client SHALL include error handling and retry logic
4. WHEN creating API clients THEN all API clients SHALL be exported from a centralized index file in src/api/
5. WHEN creating API clients THEN API clients SHALL use consistent patterns for all endpoints

### Requirement 9: Consolidate Type Definitions Across Projects

**User Story:** As a developer, I want all type definitions consolidated in centralized locations, so that I can find and update types without searching multiple files.

#### Acceptance Criteria

1. WHEN consolidating backend types THEN all entity-related types SHALL be moved to src/entities/index.ts
2. WHEN consolidating backend types THEN all API-related types SHALL be moved to src/dtos/index.ts
3. WHEN consolidating backend types THEN all utility types SHALL be moved to src/types/index.ts
4. WHEN consolidating frontend types THEN all domain models SHALL be moved to src/types/index.ts
5. WHEN consolidating frontend types THEN all API response shapes SHALL be moved to src/types/index.ts
6. WHEN consolidating types THEN no type definitions SHALL remain scattered in service or component files

### Requirement 10: Update Imports Across Both Projects

**User Story:** As a developer, I want all imports updated to reference the new centralized locations, so that the codebase remains functional after refactoring.

#### Acceptance Criteria

1. WHEN updating backend imports THEN all imports of entities SHALL reference src/entities/index.ts
2. WHEN updating backend imports THEN all imports of DTOs SHALL reference src/dtos/index.ts
3. WHEN updating backend imports THEN all imports of types SHALL reference src/types/index.ts
4. WHEN updating frontend imports THEN all imports of types SHALL reference src/types/index.ts
5. WHEN updating frontend imports THEN all imports of API clients SHALL reference src/api/index.ts
6. WHEN updating imports THEN all imports SHALL use consistent path patterns (no relative paths beyond module boundaries)
7. WHEN updating imports THEN no broken imports SHALL remain after refactoring

### Requirement 11: Maintain Backward Compatibility

**User Story:** As a developer, I want the refactored code to maintain the same functionality as before, so that existing features continue to work without changes.

#### Acceptance Criteria

1. WHEN refactoring THEN all existing APIs SHALL continue to work without modification
2. WHEN refactoring THEN all database operations SHALL produce identical results
3. WHEN refactoring THEN all frontend features SHALL maintain the same user experience
4. WHEN refactoring THEN all error handling SHALL remain consistent
5. WHEN refactoring THEN all tests SHALL pass without modification

### Requirement 12: Establish Consistent Naming Conventions

**User Story:** As a developer, I want consistent naming conventions across both projects, so that I can quickly understand code structure and find related files.

#### Acceptance Criteria

1. WHEN naming files THEN entity files SHALL use singular names (e.g., user.entity.ts, meter.entity.ts)
2. WHEN naming files THEN DTO files SHALL use descriptive names (e.g., create-user.dto.ts, update-meter.dto.ts)
3. WHEN naming files THEN type files SHALL use domain names (e.g., auth.types.ts, meter.types.ts)
4. WHEN naming files THEN service files SHALL use domain names (e.g., users.service.ts, meters.service.ts)
5. WHEN naming files THEN component files SHALL use PascalCase (e.g., UserForm.tsx, MeterCard.tsx)
6. WHEN naming files THEN hook files SHALL use camelCase with 'use' prefix (e.g., useUserForm.ts, useMeterData.ts)
