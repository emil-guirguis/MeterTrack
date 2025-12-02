# Requirements Document: Schema System Migration

## Introduction

This specification defines the complete migration of the MeterItPro application from duplicate schema definitions (backend + frontend) to a single-source-of-truth schema system where schemas are defined once in the backend and consumed by the frontend via API.

## Glossary

- **Schema System**: The framework for defining entity schemas with fields, validation, and relationships
- **Single Source of Truth (SSOT)**: Schema defined once in backend, used everywhere
- **Entity**: A data model representing a business object (e.g., Meter, Device, Contact)
- **Form Fields**: User-editable fields that appear in forms
- **Entity Fields**: System-managed, read-only fields (e.g., id, createdAt)
- **Relationship**: Connection between entities (belongsTo, hasMany, etc.)
- **Auto-Initialization**: Automatic population of model fields from schema definition
- **Schema API**: REST endpoints exposing schema definitions to frontend
- **Dynamic Form**: Frontend form that renders based on fetched schema

## Requirements

### Requirement 1: Backend Schema Definition System

**User Story:** As a backend developer, I want to define entity schemas once in the backend models, so that I don't have to duplicate field definitions.

#### Acceptance Criteria

1. WHEN a model extends BaseModel, THE system SHALL support a static `schema` getter that returns a schema definition
2. WHEN defining a schema, THE system SHALL support `formFields` for user-editable fields
3. WHEN defining a schema, THE system SHALL support `entityFields` for system-managed fields
4. WHEN defining a schema, THE system SHALL support field types (STRING, NUMBER, BOOLEAN, DATE, EMAIL, PHONE, URL, OBJECT, ARRAY)
5. WHEN defining a schema, THE system SHALL support field validation rules (required, minLength, maxLength, min, max, pattern)
6. WHEN defining a schema, THE system SHALL support database field mapping (dbField property)
7. WHEN defining a schema, THE system SHALL support enum values for dropdown fields
8. WHEN defining a schema, THE system SHALL support field descriptions and placeholders
9. WHEN a model constructor is called, THE system SHALL auto-initialize all fields from the schema definition
10. WHEN a schema is defined, THE system SHALL support entity-level validation rules

### Requirement 2: Relationship Definition System

**User Story:** As a backend developer, I want to define relationships between entities in the schema, so that related data can be automatically loaded and managed.

#### Acceptance Criteria

1. WHEN defining a schema, THE system SHALL support relationship definitions
2. WHEN defining a relationship, THE system SHALL support BELONGS_TO type (many-to-one)
3. WHEN defining a relationship, THE system SHALL support HAS_MANY type (one-to-many)
4. WHEN defining a relationship, THE system SHALL support HAS_ONE type (one-to-one)
5. WHEN defining a relationship, THE system SHALL support MANY_TO_MANY type (through junction table)
6. WHEN defining a relationship, THE system SHALL specify the related model name
7. WHEN defining a relationship, THE system SHALL specify the foreign key field
8. WHEN defining a relationship, THE system SHALL support optional auto-loading of related data
9. WHEN defining a relationship, THE system SHALL support selecting specific fields from related models
10. WHEN defining a relationship, THE system SHALL support aliasing the relationship name

### Requirement 3: Schema API Endpoints

**User Story:** As a frontend developer, I want to fetch entity schemas from the backend via API, so that forms can render dynamically without hardcoded field definitions.

#### Acceptance Criteria

1. WHEN a GET request is made to `/api/schema`, THE system SHALL return a list of all available schemas
2. WHEN a GET request is made to `/api/schema/:entity`, THE system SHALL return the complete schema for that entity
3. WHEN a schema is returned, THE system SHALL include entityName, tableName, and description
4. WHEN a schema is returned, THE system SHALL include all formFields with their properties
5. WHEN a schema is returned, THE system SHALL include all entityFields with their properties
6. WHEN a schema is returned, THE system SHALL include relationship definitions
7. WHEN a schema is returned, THE system SHALL exclude function references (serialize to JSON)
8. WHEN a POST request is made to `/api/schema/:entity/validate`, THE system SHALL validate the provided data against the schema
9. WHEN validation fails, THE system SHALL return specific error messages for each invalid field
10. WHEN an invalid entity name is requested, THE system SHALL return a 404 error with available entities

### Requirement 4: Frontend Schema Loader

**User Story:** As a frontend developer, I want to load schemas from the backend API, so that I can build dynamic forms without duplicating schema definitions.

#### Acceptance Criteria

1. WHEN `fetchSchema(entityName)` is called, THE system SHALL fetch the schema from `/api/schema/:entity`
2. WHEN a schema is fetched, THE system SHALL cache it to avoid repeated API calls
3. WHEN `clearSchemaCache()` is called, THE system SHALL clear cached schemas
4. WHEN `useSchema(entityName)` hook is used, THE system SHALL return schema, loading, and error states
5. WHEN a schema is loaded, THE system SHALL convert backend format to frontend-compatible format
6. WHEN `prefetchSchemas()` is called, THE system SHALL load multiple schemas in parallel
7. WHEN `getAvailableSchemas()` is called, THE system SHALL return list of all available schemas
8. WHEN a schema fetch fails, THE system SHALL provide error details
9. WHEN a schema is cached, THE system SHALL support cache invalidation
10. WHEN converting schema, THE system SHALL preserve all field properties and validation rules

### Requirement 5: Dynamic Form Rendering

**User Story:** As a frontend developer, I want forms to render dynamically based on fetched schemas, so that adding/changing fields only requires backend updates.

#### Acceptance Criteria

1. WHEN a form component loads, THE system SHALL fetch the schema for its entity
2. WHEN a schema is loaded, THE system SHALL render input fields for all formFields
3. WHEN rendering a field, THE system SHALL use the correct input type based on field type
4. WHEN rendering a field, THE system SHALL display the field label
5. WHEN rendering a field, THE system SHALL show placeholder text if defined
6. WHEN rendering a field, THE system SHALL mark required fields visually
7. WHEN rendering a field with enum values, THE system SHALL render a select dropdown
8. WHEN rendering a field, THE system SHALL apply validation rules from schema
9. WHEN validation fails, THE system SHALL display field-specific error messages
10. WHEN form is submitted, THE system SHALL transform data using schema mappings (dbField)

### Requirement 6: Model Migration Tool

**User Story:** As a developer, I want an automated tool to migrate existing models to the schema system, so that I don't have to manually convert 16+ models.

#### Acceptance Criteria

1. WHEN the migration tool runs, THE system SHALL discover all tables in the database
2. WHEN a table is discovered, THE system SHALL query its complete schema (columns, types, constraints)
3. WHEN generating a model, THE system SHALL create a class extending BaseModel
4. WHEN generating a model, THE system SHALL use auto-initialization in the constructor
5. WHEN generating a model, THE system SHALL categorize fields as formFields or entityFields
6. WHEN generating a model, THE system SHALL map PostgreSQL types to FieldTypes
7. WHEN generating a model, THE system SHALL include field validation rules (required, maxLength)
8. WHEN generating a model, THE system SHALL include placeholder relationship definitions
9. WHEN generation completes, THE system SHALL output all models to a generated directory
10. WHEN generation completes, THE system SHALL provide code to register models in schema routes

### Requirement 7: Relationship Implementation

**User Story:** As a developer, I want to add relationships to migrated models, so that related data can be loaded and managed efficiently.

#### Acceptance Criteria

1. WHEN adding a BELONGS_TO relationship, THE system SHALL specify the parent model and foreign key
2. WHEN adding a HAS_MANY relationship, THE system SHALL specify the child model and foreign key
3. WHEN adding a HAS_ONE relationship, THE system SHALL specify the related model and foreign key
4. WHEN adding a MANY_TO_MANY relationship, THE system SHALL specify the junction table
5. WHEN a relationship has autoLoad: true, THE system SHALL automatically load related data in queries
6. WHEN a relationship specifies select fields, THE system SHALL only load those fields
7. WHEN a relationship has an alias, THE system SHALL use that alias in query results
8. WHEN querying with relationships, THE system SHALL prevent circular dependencies
9. WHEN querying with relationships, THE system SHALL support nested loading (relationship of relationship)
10. WHEN a relationship is defined, THE system SHALL validate that the related model exists

### Requirement 8: Backward Compatibility

**User Story:** As a developer, I want the migration to maintain backward compatibility, so that existing code continues to work during the transition.

#### Acceptance Criteria

1. WHEN old models exist, THE system SHALL continue to support them alongside new schema-based models
2. WHEN old frontend configs exist, THE system SHALL continue to work until replaced
3. WHEN migrating incrementally, THE system SHALL support mixed old/new models
4. WHEN a model is migrated, THE system SHALL maintain the same API interface
5. WHEN a model is migrated, THE system SHALL maintain the same field names
6. WHEN a model is migrated, THE system SHALL maintain the same validation behavior
7. WHEN a model is migrated, THE system SHALL support legacy field mappings
8. WHEN old code references fields, THE system SHALL continue to work with auto-initialized fields
9. WHEN routes use old models, THE system SHALL continue to function
10. WHEN frontend uses old configs, THE system SHALL continue to render forms correctly

### Requirement 9: Testing and Validation

**User Story:** As a developer, I want comprehensive testing of the schema system, so that I can be confident the migration is successful.

#### Acceptance Criteria

1. WHEN a schema is defined, THE system SHALL validate that all required properties are present
2. WHEN a model is instantiated, THE system SHALL verify all fields are initialized
3. WHEN a schema API endpoint is called, THE system SHALL return valid JSON
4. WHEN frontend fetches a schema, THE system SHALL successfully parse and use it
5. WHEN a dynamic form renders, THE system SHALL display all fields correctly
6. WHEN form validation runs, THE system SHALL apply all schema rules
7. WHEN data is submitted, THE system SHALL correctly transform field names (dbField mapping)
8. WHEN relationships are defined, THE system SHALL validate foreign key references
9. WHEN auto-loading relationships, THE system SHALL successfully load related data
10. WHEN running the migration tool, THE system SHALL generate valid, working models

### Requirement 10: Documentation and Training

**User Story:** As a developer, I want comprehensive documentation of the schema system, so that I can effectively use and maintain it.

#### Acceptance Criteria

1. WHEN documentation is provided, THE system SHALL include a complete overview of the schema system
2. WHEN documentation is provided, THE system SHALL include examples for each field type
3. WHEN documentation is provided, THE system SHALL include examples for each relationship type
4. WHEN documentation is provided, THE system SHALL include migration guide with step-by-step instructions
5. WHEN documentation is provided, THE system SHALL include API endpoint reference
6. WHEN documentation is provided, THE system SHALL include frontend integration examples
7. WHEN documentation is provided, THE system SHALL include troubleshooting guide
8. WHEN documentation is provided, THE system SHALL include comparison of before/after migration
9. WHEN documentation is provided, THE system SHALL include best practices and patterns
10. WHEN documentation is provided, THE system SHALL include quick reference for common tasks
