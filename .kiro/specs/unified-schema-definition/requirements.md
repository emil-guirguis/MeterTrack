# Requirements Document

## Introduction

This feature establishes a unified schema definition system for the frontend application to eliminate duplication between form schemas and TypeScript interfaces. Currently, entity schemas are defined twice: once in `createFormSchema` for form handling and again as TypeScript interfaces for type safety. This creates maintenance overhead, potential inconsistencies, and violates the DRY (Don't Repeat Yourself) principle. The unified schema system will provide a single source of truth for entity definitions, automatically generating both TypeScript types and form configurations from one schema definition.

## Glossary

- **Schema Definition**: A declarative specification of an entity's structure, including field names, types, validation rules, and metadata
- **Form Schema**: Configuration used by form components to render fields, validate input, and transform data for API communication
- **TypeScript Interface**: Type definition that provides compile-time type checking and IDE autocomplete
- **Entity Config**: A centralized configuration file (e.g., `contactConfig.ts`) that defines all aspects of an entity including schema, list columns, filters, and actions
- **Field Definition**: Specification of a single field including its type, validation rules, default value, and UI metadata
- **API Mapping**: Configuration that maps frontend field names to backend API field names when they differ
- **Type Inference**: TypeScript's ability to automatically derive types from values and schemas
- **Schema Utility**: Helper functions that generate form utilities and TypeScript types from schema definitions

## Requirements

### Requirement 1

**User Story:** As a developer, I want to define entity schemas once in a single location, so that I can maintain consistency and reduce duplication across the codebase

#### Acceptance Criteria

1. WHEN THE Developer defines an entity schema, THE Schema Definition System SHALL generate both TypeScript types and form configuration from the single schema
2. THE Schema Definition System SHALL support all existing field types including string, number, boolean, date, email, phone, and url
3. THE Schema Definition System SHALL preserve all existing validation rules including required fields, field-specific validation, and custom validators
4. THE Schema Definition System SHALL maintain backward compatibility with existing `createFormSchema` and `field` helper functions
5. THE Schema Definition System SHALL support optional fields, required fields, and fields with default values

### Requirement 2

**User Story:** As a developer, I want TypeScript types to be automatically inferred from schema definitions, so that I have type safety without manual interface definitions

#### Acceptance Criteria

1. THE Schema Definition System SHALL automatically infer TypeScript types from schema field definitions
2. THE Schema Definition System SHALL generate types that include all schema fields with correct TypeScript types
3. THE Schema Definition System SHALL support optional fields using TypeScript's optional property syntax
4. THE Schema Definition System SHALL support union types for fields with enumerated values
5. THE Schema Definition System SHALL provide type inference that works with IDE autocomplete and type checking

### Requirement 3

**User Story:** As a developer, I want to extend schemas with additional fields not in forms, so that I can include database-only fields like id, timestamps, and computed properties

#### Acceptance Criteria

1. THE Schema Definition System SHALL support extending base schemas with additional fields
2. THE Schema Definition System SHALL allow defining read-only fields that exist in the entity but not in forms
3. THE Schema Definition System SHALL support computed fields that are derived from other fields
4. THE Schema Definition System SHALL maintain separation between form fields and entity fields
5. THE Schema Definition System SHALL support legacy field mappings for backward compatibility

### Requirement 4

**User Story:** As a developer, I want to migrate existing entity configs to the unified schema system, so that all entities use a consistent pattern

#### Acceptance Criteria

1. THE Schema Definition System SHALL provide a migration path from existing dual-definition pattern to unified schema
2. THE Schema Definition System SHALL maintain all existing functionality during migration
3. THE Schema Definition System SHALL support gradual migration without breaking existing code
4. THE Schema Definition System SHALL provide clear examples of migrated entity configs
5. THE Schema Definition System SHALL document the migration process with step-by-step instructions

### Requirement 5

**User Story:** As a developer, I want schema definitions to support API field mapping, so that frontend field names can differ from backend field names when necessary

#### Acceptance Criteria

1. THE Schema Definition System SHALL support `apiField` property for mapping frontend fields to different backend field names
2. THE Schema Definition System SHALL support `toApi` transformation functions for converting form values to API format
3. THE Schema Definition System SHALL support `fromApi` transformation functions for converting API values to form format
4. THE Schema Definition System SHALL maintain existing API mapping functionality from `createFormSchema`
5. THE Schema Definition System SHALL apply transformations automatically during form submission and data loading

### Requirement 6

**User Story:** As a developer, I want schema definitions to include UI metadata, so that forms can be rendered with appropriate labels, placeholders, and help text

#### Acceptance Criteria

1. THE Schema Definition System SHALL support field labels for form rendering
2. THE Schema Definition System SHALL support field descriptions for help text
3. THE Schema Definition System SHALL support placeholder text for input fields
4. THE Schema Definition System SHALL support field grouping and ordering metadata
5. THE Schema Definition System SHALL maintain all existing UI metadata from current form schemas
