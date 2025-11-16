# Requirements Document

## Introduction

This specification defines the requirements for creating a comprehensive shared UI framework by migrating reusable components from `client/frontend` to `framework/frontend`. The framework will include standardized patterns for lists, forms, dashboards, reports, and email templates. This migration will enable code reuse across multiple projects (client, sync, and future applications) while maintaining backward compatibility and ensuring the framework is project-agnostic.

## Glossary

- **Framework**: The shared component framework located at `framework/` with both frontend and backend modules
- **Client Project**: The existing application at `client/` that currently uses various UI patterns and MCP servers
- **List Framework**: Components, hooks, and utilities for standardized list/table functionality
- **Form Framework**: Components, hooks, and utilities for standardized form handling
- **Dashboard Framework**: Components and utilities for dashboard layouts and widgets
- **Report Framework**: Components and utilities for generating and displaying reports
- **Email Template Framework**: Components and utilities for email template management
- **MCP Server Framework**: Base classes and utilities for creating Model Context Protocol servers
- **MCP Tool**: A function exposed by an MCP server that can be called by AI assistants
- **MCP Resource**: Data or content exposed by an MCP server
- **API Framework**: Base classes and utilities for creating REST APIs with Express
- **API Route**: An HTTP endpoint that handles requests and returns responses
- **API Middleware**: Functions that process requests before they reach route handlers
- **Auth Context**: The authentication and authorization system used by the framework
- **Barrel Export**: An index.ts file that re-exports all public APIs from a module

## Requirements

### Requirement 1: Framework Structure

**User Story:** As a developer, I want the framework organized by feature domain in a clear directory structure, so that I can easily find and use framework components.

#### Acceptance Criteria

1. THE Framework SHALL be located at `framework/frontend` in the project root
2. THE Framework SHALL organize code by domain: `lists`, `forms`, `dashboards`, `reports`, `email-templates`, `shared`
3. EACH domain SHALL have subdirectories: `hooks`, `components`, `utils`, `config`, `types`
4. THE Framework SHALL have a `shared` directory for cross-domain utilities and types
5. THE Framework SHALL provide barrel exports at each domain level (e.g., `framework/frontend/lists/index.ts`)
6. THE Framework SHALL provide a root barrel export at `framework/frontend/index.ts`
7. THE Framework SHALL include documentation in a `docs` subdirectory at the root level

### Requirement 2: Type Definitions Migration

**User Story:** As a developer, I want all list-related type definitions in the framework, so that I have type safety when using framework components.

#### Acceptance Criteria

1. THE Framework SHALL include `types/list.ts` with all list-related type definitions
2. THE Framework SHALL include `types/ui.ts` with UI component type definitions
3. THE Framework SHALL include `types/auth.ts` as a placeholder for auth types
4. THE Framework types SHALL NOT depend on client-specific types
5. THE Client Project SHALL continue to use its existing type definitions without breaking changes

### Requirement 3: Component Migration

**User Story:** As a developer, I want core list components in the framework, so that I can use them across multiple projects.

#### Acceptance Criteria

1. THE Framework SHALL include `components/DataList.tsx` component
2. THE Framework SHALL include `components/DataTable.tsx` component
3. THE Framework SHALL include `components/DataTable.css` stylesheet
4. THE Framework SHALL include `components/ListFilters.css` stylesheet
5. THE Components SHALL import types from framework types, not client types

### Requirement 4: Hook Migration

**User Story:** As a developer, I want the useBaseList hook in the framework, so that I can use it in any project.

#### Acceptance Criteria

1. THE Framework SHALL include `hooks/useBaseList.tsx` hook
2. THE useBaseList hook SHALL accept an auth context provider as a configuration option
3. THE useBaseList hook SHALL NOT directly import from client-specific modules
4. THE useBaseList hook SHALL maintain all existing functionality
5. THE useBaseList hook SHALL be backward compatible with existing usage

### Requirement 5: Utility Functions Migration

**User Story:** As a developer, I want all list utility functions in the framework, so that I can reuse helper logic across projects.

#### Acceptance Criteria

1. THE Framework SHALL include `utils/listHelpers.ts` with list manipulation utilities
2. THE Framework SHALL include `utils/exportHelpers.ts` with CSV export utilities
3. THE Framework SHALL include `utils/importHelpers.ts` with CSV import utilities
4. THE Framework SHALL include `utils/renderHelpers.tsx` with rendering utilities
5. THE Utilities SHALL NOT depend on client-specific code

### Requirement 6: Configuration Builders Migration

**User Story:** As a developer, I want configuration builder functions in the framework, so that I can easily create columns, filters, and bulk actions.

#### Acceptance Criteria

1. THE Framework SHALL include `config/listColumns.ts` with column builder functions
2. THE Framework SHALL include `config/listFilters.ts` with filter builder functions
3. THE Framework SHALL include `config/listBulkActions.ts` with bulk action builder functions
4. THE Configuration builders SHALL be generic and reusable across projects

### Requirement 7: Documentation Migration

**User Story:** As a developer, I want framework documentation accessible, so that I can learn how to use the framework effectively.

#### Acceptance Criteria

1. THE Framework SHALL include `docs/LIST_FRAMEWORK_DOCUMENTATION.md`
2. THE Framework SHALL include `docs/MIGRATION_GUIDE.md`
3. THE Framework SHALL include `docs/EXAMPLES.md`
4. THE Framework SHALL include `docs/PERFORMANCE_OPTIMIZATIONS.md`
5. THE Documentation SHALL be updated to reflect framework location and usage

### Requirement 8: Auth Context Injection

**User Story:** As a developer, I want to provide my own auth context to the framework, so that the framework works with different authentication systems.

#### Acceptance Criteria

1. THE useBaseList hook SHALL accept an optional `authContext` parameter
2. WHEN authContext is provided, THE hook SHALL use it for permission checks
3. WHEN authContext is not provided, THE hook SHALL use a default context from React Context
4. THE Framework SHALL define an AuthContext interface that projects must implement
5. THE Client Project SHALL provide its existing useAuth context to the framework

### Requirement 9: Import Path Updates

**User Story:** As a developer, I want clean import paths when using the framework, so that my code is readable and maintainable.

#### Acceptance Criteria

1. THE Client Project SHALL update all imports to reference framework location
2. THE Client Project SHALL use relative paths like `../../../framework/frontend` for framework imports
3. THE Framework barrel export SHALL allow importing multiple items from a single path
4. THE Import path updates SHALL NOT break any existing functionality
5. THE TypeScript compiler SHALL successfully compile after all import updates

### Requirement 10: Backward Compatibility

**User Story:** As a developer, I want existing list components to work without changes, so that the migration doesn't break my application.

#### Acceptance Criteria

1. THE Migration SHALL NOT require changes to entity-specific list components (ContactList, MeterList, etc.)
2. THE Migration SHALL NOT require changes to entity-specific configurations (contactConfig, meterConfig, etc.)
3. THE Existing list components SHALL continue to function identically after migration
4. THE Migration SHALL NOT introduce new bugs or regressions
5. THE Application SHALL pass all existing tests after migration

### Requirement 11: Testing and Validation

**User Story:** As a developer, I want to verify the migration was successful, so that I can be confident the framework works correctly.

#### Acceptance Criteria

1. THE Migration SHALL be tested by loading each list component in the application
2. THE Migration SHALL verify that all CRUD operations work correctly
3. THE Migration SHALL verify that filters, search, and pagination work correctly
4. THE Migration SHALL verify that bulk actions work correctly
5. THE Migration SHALL verify that export/import functionality works correctly

### Requirement 12: Form Framework Migration

**User Story:** As a developer, I want standardized form components and utilities in the framework, so that I can build consistent forms across projects.

#### Acceptance Criteria

1. THE Framework SHALL include `forms/components` with reusable form components
2. THE Framework SHALL include `forms/hooks/useBaseForm.tsx` for form state management
3. THE Framework SHALL include `forms/utils` with form validation and transformation utilities
4. THE Framework SHALL include `forms/types` with form-related type definitions
5. THE Form framework SHALL support field validation, error handling, and submission logic
6. THE Form framework SHALL integrate with the auth context for permission-based field visibility

### Requirement 13: Dashboard Framework Migration

**User Story:** As a developer, I want standardized dashboard components in the framework, so that I can create consistent dashboard layouts.

#### Acceptance Criteria

1. THE Framework SHALL include `dashboards/components` with dashboard layout components
2. THE Framework SHALL include `dashboards/components` with widget components (cards, charts, stats)
3. THE Framework SHALL include `dashboards/hooks` for dashboard state management
4. THE Framework SHALL include `dashboards/utils` with dashboard layout utilities
5. THE Dashboard framework SHALL support responsive grid layouts
6. THE Dashboard framework SHALL support widget configuration and customization

### Requirement 14: Report Framework Migration

**User Story:** As a developer, I want standardized report components in the framework, so that I can generate consistent reports across projects.

#### Acceptance Criteria

1. THE Framework SHALL include `reports/components` with report display components
2. THE Framework SHALL include `reports/utils` with report generation utilities
3. THE Framework SHALL include `reports/utils` with PDF and CSV export utilities
4. THE Framework SHALL include `reports/types` with report-related type definitions
5. THE Report framework SHALL support multiple output formats (PDF, CSV, Excel)
6. THE Report framework SHALL support report templates and customization

### Requirement 15: Email Template Framework Migration

**User Story:** As a developer, I want standardized email template components in the framework, so that I can manage email templates consistently.

#### Acceptance Criteria

1. THE Framework SHALL include `email-templates/components` with template editor components
2. THE Framework SHALL include `email-templates/components` with template preview components
3. THE Framework SHALL include `email-templates/utils` with template rendering utilities
4. THE Framework SHALL include `email-templates/utils` with variable substitution utilities
5. THE Framework SHALL include `email-templates/types` with template-related type definitions
6. THE Email template framework SHALL support template variables and placeholders
7. THE Email template framework SHALL support template validation

### Requirement 16: Shared Utilities

**User Story:** As a developer, I want common utilities available across all framework domains, so that I don't duplicate code.

#### Acceptance Criteria

1. THE Framework SHALL include `shared/utils` with common utility functions
2. THE Framework SHALL include `shared/types` with common type definitions
3. THE Framework SHALL include `shared/hooks` with common React hooks
4. THE Framework SHALL include `shared/components` with common UI components
5. THE Shared utilities SHALL be imported by domain-specific code as needed

### Requirement 17: MCP Server Framework Migration

**User Story:** As a developer, I want standardized base classes for MCP servers in the framework, so that I can create consistent MCP servers across projects.

#### Acceptance Criteria

1. THE Framework SHALL include `backend/mcp` directory for MCP server base classes
2. THE Framework SHALL include `backend/mcp/base/MCPServer.ts` base class
3. THE Framework SHALL include `backend/mcp/base/MCPTool.ts` base class for tool definitions
4. THE Framework SHALL include `backend/mcp/base/MCPResource.ts` base class for resource definitions
5. THE Framework SHALL include `backend/mcp/utils` with common MCP utilities
6. THE Framework SHALL include `backend/mcp/types` with MCP-related type definitions
7. THE MCP base classes SHALL handle server lifecycle, tool registration, and error handling
8. THE MCP base classes SHALL support both stdio and HTTP transports

### Requirement 18: MCP Server Utilities

**User Story:** As a developer, I want common MCP utilities in the framework, so that I can avoid duplicating server setup code.

#### Acceptance Criteria

1. THE Framework SHALL include utilities for database connection management
2. THE Framework SHALL include utilities for logging and error handling
3. THE Framework SHALL include utilities for tool validation and schema generation
4. THE Framework SHALL include utilities for resource caching
5. THE Utilities SHALL be reusable across different MCP server implementations

### Requirement 19: MCP Server Documentation

**User Story:** As a developer, I want comprehensive MCP server documentation, so that I can quickly create new MCP servers.

#### Acceptance Criteria

1. THE Framework SHALL include `backend/mcp/docs/MCP_SERVER_GUIDE.md`
2. THE Documentation SHALL include examples of creating custom MCP servers
3. THE Documentation SHALL include examples of defining tools and resources
4. THE Documentation SHALL include best practices for MCP server development
5. THE Documentation SHALL include migration guide for existing MCP servers

### Requirement 20: API Framework Migration

**User Story:** As a developer, I want standardized base classes for REST APIs in the framework, so that I can create consistent APIs across projects.

#### Acceptance Criteria

1. THE Framework SHALL include `backend/api` directory for API base classes
2. THE Framework SHALL include `backend/api/base/BaseRouter.ts` base class for route definitions
3. THE Framework SHALL include `backend/api/base/BaseController.ts` base class for controllers
4. THE Framework SHALL include `backend/api/base/BaseService.ts` base class for business logic
5. THE Framework SHALL include `backend/api/middleware` with common middleware functions
6. THE Framework SHALL include `backend/api/utils` with API utilities
7. THE Framework SHALL include `backend/api/types` with API-related type definitions
8. THE API base classes SHALL handle error handling, validation, and response formatting

### Requirement 21: API Middleware and Utilities

**User Story:** As a developer, I want common API middleware and utilities in the framework, so that I can avoid duplicating API setup code.

#### Acceptance Criteria

1. THE Framework SHALL include middleware for authentication and authorization
2. THE Framework SHALL include middleware for request validation
3. THE Framework SHALL include middleware for error handling
4. THE Framework SHALL include middleware for logging
5. THE Framework SHALL include utilities for pagination, filtering, and sorting
6. THE Framework SHALL include utilities for response formatting
7. THE Middleware and utilities SHALL be reusable across different API implementations

### Requirement 22: API Documentation

**User Story:** As a developer, I want comprehensive API framework documentation, so that I can quickly create new APIs.

#### Acceptance Criteria

1. THE Framework SHALL include `backend/api/docs/API_GUIDE.md`
2. THE Documentation SHALL include examples of creating routes and controllers
3. THE Documentation SHALL include examples of using middleware
4. THE Documentation SHALL include best practices for API development
5. THE Documentation SHALL include migration guide for existing APIs

### Requirement 23: Cleanup

**User Story:** As a developer, I want old framework files removed from client directories, so that there's no code duplication.

#### Acceptance Criteria

1. WHEN migration is complete and tested, THE old framework files SHALL be removed from `client/frontend` and `client/backend`
2. THE Removal SHALL only occur after successful testing
3. THE Removal SHALL be documented in the migration plan
4. THE Git history SHALL preserve the original file locations
5. THE README or documentation SHALL be updated to reference the new framework location
