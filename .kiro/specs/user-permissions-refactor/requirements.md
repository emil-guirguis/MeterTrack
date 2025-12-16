# Requirements Document: User Permissions Refactor

## Introduction

The current user creation and authentication system has hardcoded role-based permissions scattered across multiple endpoints in the auth route. This creates maintenance challenges, code duplication, and makes it difficult to manage permissions consistently. This feature refactors the permissions system into a centralized, modular architecture that auto-generates permissions JSON based on roles and provides sensible defaults for new users.

## Glossary

- **Permission**: A specific action a user can perform on a module (e.g., `create`, `read`, `update`, `delete`)
- **Module**: A resource category in the system (e.g., `user`, `meter`, `device`, `location`, `contact`, `template`, `settings`)
- **Role**: A predefined set of permissions assigned to a user (e.g., admin, manager, technician, viewer)
- **Permissions Service**: A centralized service that manages role-to-permission mappings and generates permission JSON objects
- **Permission Object**: A nested JSON structure mapping modules to actions with boolean values (e.g., `{ "user": { "create": true, "read": true, "update": true, "delete": true }, "meter": { "create": true, "read": true, "update": true, "delete": true } }`)
- **Default Permissions**: The standard permission object automatically assigned to a user based on their role
- **User Creation**: The process of adding a new user to the system with auto-generated permissions stored as JSON

## Requirements

### Requirement 1

**User Story:** As a developer, I want permissions to be centralized and auto-generated, so that I can maintain role-based access control in one place without duplication.

#### Acceptance Criteria

1. WHEN a permissions service is created THEN the system SHALL define all role-to-permission mappings as nested JSON objects with module and action keys
2. WHEN a user is created with a role THEN the system SHALL automatically generate a permissions JSON object based on that role
3. WHEN permissions are stored in the database THEN the system SHALL store them as a JSON string in the permissions column
4. WHEN a role is updated in the permissions service THEN the system SHALL apply the new permissions to all users with that role on next authentication

### Requirement 2

**User Story:** As an admin, I want to create users with default permissions, so that new users have appropriate access immediately upon creation.

#### Acceptance Criteria

1. WHEN a user is created without explicit permissions THEN the system SHALL assign default permissions based on their assigned role
2. WHEN a user is created with role 'admin' THEN the system SHALL grant create, read, update, delete permissions for user, meter, device, location, contact, template modules and read, update permissions for settings
3. WHEN a user is created with role 'viewer' THEN the system SHALL grant only read permissions for user, meter, device, location, contact, template modules and read permissions for settings
4. WHEN a user is created THEN the system SHALL store permissions as a JSON object with structure {module: {action: boolean}}

### Requirement 3

**User Story:** As a developer, I want to eliminate code duplication in authentication endpoints, so that permission logic is maintained in one place.

#### Acceptance Criteria

1. WHEN the login endpoint processes authentication THEN the system SHALL retrieve permissions from the centralized permissions service
2. WHEN the refresh token endpoint generates new tokens THEN the system SHALL retrieve permissions from the centralized permissions service
3. WHEN the verify token endpoint checks permissions THEN the system SHALL retrieve permissions from the centralized permissions service
4. WHEN the bootstrap endpoint creates the first admin user THEN the system SHALL use the centralized permissions service to generate and store permissions

### Requirement 4

**User Story:** As a developer, I want a clean module structure, so that permissions logic is organized and testable.

#### Acceptance Criteria

1. WHEN the permissions service is imported THEN the system SHALL export a function to get permissions object by role
2. WHEN the permissions service is imported THEN the system SHALL export a function to convert permissions object to flat array format
3. WHEN the permissions service is imported THEN the system SHALL export a function to validate permissions object structure
4. WHEN the permissions service is used in multiple endpoints THEN the system SHALL provide consistent permission objects across all endpoints

