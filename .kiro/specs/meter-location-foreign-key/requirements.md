# Requirements Document

## Introduction

This feature adds a proper foreign key relationship between the meters table and the locations table by introducing a `location_id` column in the meters table that references `locations.id`. This will replace the current text-based `location` field with a proper relational database constraint, ensuring data integrity and enabling efficient joins between meters and their associated locations.

## Glossary

- **Meters Table**: The database table storing meter information including serial numbers, types, and configuration data
- **Locations Table**: The database table storing location/building information including addresses and contact details
- **Foreign Key Constraint**: A database constraint that ensures referential integrity between two tables
- **Migration Script**: A SQL script that modifies the database schema in a controlled manner
- **Data Migration**: The process of transferring existing data from the old schema to the new schema

## Requirements

### Requirement 1

**User Story:** As a database administrator, I want meters to have a proper foreign key relationship to locations, so that data integrity is enforced at the database level

#### Acceptance Criteria

1. THE Meters Table SHALL include a column named `location_id` of type `uniqueidentifier`
2. THE Meters Table SHALL define a foreign key constraint on `location_id` that references `locations.id`
3. WHEN a location is deleted, THE Database SHALL prevent the deletion if any meters reference that location
4. THE Meters Table SHALL include an index on `location_id` for query performance
5. THE Migration Script SHALL preserve all existing meter data during the schema change

### Requirement 2

**User Story:** As a developer, I want the migration to handle existing data gracefully, so that no data is lost during the schema update

#### Acceptance Criteria

1. THE Migration Script SHALL create the new `location_id` column as nullable initially
2. IF the `buildingid` column contains valid location IDs, THEN THE Migration Script SHALL copy those values to `location_id`
3. THE Migration Script SHALL add the foreign key constraint after data migration is complete
4. THE Migration Script SHALL be idempotent and safe to run multiple times
5. THE Migration Script SHALL include rollback instructions in case of issues

### Requirement 3

**User Story:** As a backend developer, I want the API and data models updated to use the new foreign key, so that the application properly leverages the relational structure

#### Acceptance Criteria

1. THE Backend API SHALL update meter data models to include `location_id` as a UUID field
2. THE Backend API SHALL update meter creation endpoints to accept and validate `location_id`
3. THE Backend API SHALL update meter query endpoints to support filtering by `location_id`
4. WHEN retrieving meters, THE Backend API SHALL support joining with location data
5. THE Backend API SHALL validate that `location_id` references an existing location before creating or updating meters

### Requirement 4

**User Story:** As a frontend developer, I want the UI components updated to work with the new location relationship, so that users can properly associate meters with locations

#### Acceptance Criteria

1. THE Meter Form Component SHALL use `location_id` instead of text-based location field
2. THE Meter Form Component SHALL provide a dropdown or selector for choosing locations
3. THE Meter List Component SHALL display location names by joining with location data
4. THE Location Detail View SHALL show all meters associated with that location
5. THE Frontend SHALL handle validation errors when an invalid `location_id` is provided
