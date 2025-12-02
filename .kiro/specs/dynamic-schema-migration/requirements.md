# Requirements Document

## Introduction

This specification covers the migration of frontend entity forms from static schema definitions to dynamic schema loading from the backend API. Currently, only the User entity uses dynamic schema loading via `UserFormDynamic.tsx`. All other entities (Location, Meter, Contact, Device, etc.) still have duplicate schema definitions in the frontend that need to be eliminated.

## Glossary

- **Entity**: A data model representing a business object (e.g., User, Location, Meter)
- **Schema**: The definition of an entity's structure, including fields, types, validation rules
- **Dynamic Schema Loading**: Fetching schema definitions from the backend API at runtime instead of hardcoding them in the frontend
- **Single Source of Truth**: Having schema defined only once in the backend, eliminating duplication
- **Static Schema**: Schema definitions hardcoded in frontend configuration files (e.g., `locationConfig.ts`)

## Requirements

### Requirement 1

**User Story:** As a developer, I want all entity forms to load their schemas dynamically from the backend, so that I don't have to maintain duplicate schema definitions in both frontend and backend.

#### Acceptance Criteria

1. WHEN a Location form is rendered THEN the system SHALL load the schema from `/api/schema/location` endpoint
2. WHEN a Meter form is rendered THEN the system SHALL load the schema from `/api/schema/meter` endpoint
3. WHEN a Contact form is rendered THEN the system SHALL load the schema from `/api/schema/contact` endpoint
4. WHEN a Device form is rendered THEN the system SHALL load the schema from `/api/schema/device` endpoint
5. WHEN any entity form loads its schema THEN the system SHALL cache the schema for 5 minutes to avoid repeated API calls

### Requirement 2

**User Story:** As a developer, I want to remove static schema definitions from frontend config files, so that there is only one source of truth for entity schemas.

#### Acceptance Criteria

1. WHEN the migration is complete THEN the system SHALL NOT have schema field definitions in `locationConfig.ts`
2. WHEN the migration is complete THEN the system SHALL NOT have schema field definitions in `meterConfig.ts`
3. WHEN the migration is complete THEN the system SHALL NOT have schema field definitions in `contactConfig.ts`
4. WHEN the migration is complete THEN the system SHALL NOT have schema field definitions in `deviceConfig.ts`
5. WHEN config files are updated THEN the system SHALL retain list configuration (columns, filters, stats, bulk actions, export config)

### Requirement 3

**User Story:** As a developer, I want dynamic forms to follow the same pattern as `UserFormDynamic.tsx`, so that the codebase is consistent and maintainable.

#### Acceptance Criteria

1. WHEN creating a dynamic form THEN the system SHALL use the `useSchema()` hook to load schema
2. WHEN creating a dynamic form THEN the system SHALL use the `useEntityFormWithStore()` hook for form management
3. WHEN creating a dynamic form THEN the system SHALL handle loading, error, and success states
4. WHEN creating a dynamic form THEN the system SHALL render fields dynamically based on the loaded schema
5. WHEN creating a dynamic form THEN the system SHALL support both create and edit modes

### Requirement 4

**User Story:** As a user, I want forms to display loading states while schemas are being fetched, so that I know the system is working.

#### Acceptance Criteria

1. WHEN a form is loading its schema THEN the system SHALL display a loading spinner with "Loading form schema..." message
2. WHEN a schema fails to load THEN the system SHALL display an error message with the failure reason
3. WHEN a schema loads successfully THEN the system SHALL render the form fields immediately
4. WHEN a schema is cached THEN the system SHALL render the form without showing a loading state
5. WHEN a form is submitting data THEN the system SHALL display a loading state on the submit button

### Requirement 5

**User Story:** As a developer, I want to ensure backward compatibility during migration, so that existing functionality continues to work.

#### Acceptance Criteria

1. WHEN a dynamic form is created THEN the system SHALL maintain the same props interface as the old static form
2. WHEN a dynamic form is used THEN the system SHALL work with existing store hooks (e.g., `useLocationsEnhanced()`)
3. WHEN a dynamic form submits data THEN the system SHALL call the same API endpoints as before
4. WHEN a dynamic form is rendered THEN the system SHALL apply the same CSS classes and styling
5. WHEN migration is complete THEN the system SHALL pass all existing tests without modification

### Requirement 6

**User Story:** As a developer, I want clear documentation on how to create dynamic forms, so that future entities can easily adopt this pattern.

#### Acceptance Criteria

1. WHEN documentation is created THEN the system SHALL include a step-by-step guide for creating dynamic forms
2. WHEN documentation is created THEN the system SHALL include code examples for common scenarios
3. WHEN documentation is created THEN the system SHALL explain the benefits of dynamic schema loading
4. WHEN documentation is created THEN the system SHALL document the schema API endpoints
5. WHEN documentation is created THEN the system SHALL include troubleshooting tips for common issues
