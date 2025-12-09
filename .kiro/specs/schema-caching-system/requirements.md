# Requirements Document: Schema Caching System

## Introduction

The Schema Caching System ensures that all entity schemas are loaded once at application login and kept in memory for instant access by all modules. Currently, schemas are fetched on-demand when each module loads, causing noticeable delays and repeated backend calls. This feature implements a centralized schema cache that is populated at login and shared across the application, eliminating per-module schema loading delays and improving overall application responsiveness.

## Glossary

- **Entity Schema**: The definition of fields, types, and validation rules for a backend entity (Meter, Device, Contact, Location, User, etc.)
- **Schema Cache**: In-memory storage of all entity schemas loaded at application startup
- **Schema Provider**: A service that manages schema retrieval and caching
- **Module**: A feature area in the application (Meters, Devices, Contacts, Locations, Users)
- **Login**: The authentication event that occurs when a user successfully authenticates
- **Backend API**: The server endpoint that provides entity schema definitions

## Requirements

### Requirement 1

**User Story:** As a user, I want schemas to be loaded once at login and cached in memory, so that module navigation is instant without "loading schema" delays.

#### Acceptance Criteria

1. WHEN a user successfully logs in THEN the system SHALL fetch all entity schemas from the backend and store them in memory
2. WHEN a module requests a schema THEN the system SHALL return the cached schema immediately without making a backend call
3. WHEN a user navigates between modules THEN the system SHALL display the module instantly without waiting for schema loading
4. WHEN the application is running THEN the system SHALL maintain all schemas in memory for the duration of the session

### Requirement 2

**User Story:** As a developer, I want a centralized schema provider service, so that all modules can access schemas consistently through a single interface.

#### Acceptance Criteria

1. WHEN a module needs a schema THEN the system SHALL provide a schema provider service with a method to retrieve schemas by entity name
2. WHEN the schema provider is called THEN the system SHALL return the schema synchronously from the cache
3. WHEN multiple modules request the same schema THEN the system SHALL return the same cached instance without duplication
4. WHEN the schema cache is initialized THEN the system SHALL include all entity types (Meter, Device, Contact, Location, User, etc.)

### Requirement 3

**User Story:** As a system administrator, I want to ensure schemas are loaded before any module attempts to use them, so that the application state is consistent and predictable.

#### Acceptance Criteria

1. WHEN the application starts THEN the system SHALL not allow module navigation until schemas are fully loaded
2. WHEN schema loading completes THEN the system SHALL enable module navigation and display the application UI
3. WHEN schema loading fails THEN the system SHALL display an error message and prevent module navigation
4. WHEN a user logs out THEN the system SHALL clear the schema cache from memory

### Requirement 4

**User Story:** As a developer, I want to integrate the schema cache with existing form and list components, so that they automatically use cached schemas without code changes.

#### Acceptance Criteria

1. WHEN BaseForm or BaseList components initialize THEN the system SHALL retrieve their schema from the cache instead of making backend calls
2. WHEN a component requests a schema THEN the system SHALL use the schema provider to access the cache
3. WHEN the schema cache is available THEN the system SHALL eliminate the "loading schema" UI state from components
4. WHEN components are rendered THEN the system SHALL use the cached schema to populate fields and columns immediately

### Requirement 5

**User Story:** As a developer, I want to handle schema cache initialization errors gracefully, so that the application provides clear feedback if schema loading fails.

#### Acceptance Criteria

1. WHEN schema loading fails THEN the system SHALL log the error with details about which schemas failed to load
2. WHEN a schema is not found in the cache THEN the system SHALL provide a clear error message indicating the missing schema
3. WHEN the user encounters a schema error THEN the system SHALL display a user-friendly error message with recovery options
4. WHEN schema loading times out THEN the system SHALL display a timeout error and allow the user to retry
