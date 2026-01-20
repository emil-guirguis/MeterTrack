# Dashboard Cards Not Displaying - Requirements

## Introduction

Dashboard records exist in the database but are not displaying when users log in. The dashboard page loads but shows no cards, even though records are confirmed to exist in the `dashboard` table.

## Glossary

- **Dashboard Card**: A user-configured card that displays aggregated meter reading data
- **Tenant**: An organization or account that owns dashboard cards and meter data
- **Tenant ID**: The unique identifier for a tenant, used for data isolation
- **API Endpoint**: `/api/dashboard/cards` - retrieves all dashboard cards for the authenticated user's tenant
- **Frontend Service**: `dashboardService` - TypeScript service that communicates with the API
- **BaseModel**: Framework base class that handles database queries with automatic tenant filtering

## Requirements

### Requirement 1: Dashboard Cards Retrieval

**User Story:** As a user, I want to see my dashboard cards when I log in, so that I can view my configured meter data visualizations.

#### Acceptance Criteria

1. WHEN a user logs in and navigates to the dashboard page, THE system SHALL retrieve all dashboard cards for that user's tenant
2. WHEN the API endpoint `/api/dashboard/cards` is called, THE system SHALL return a list of dashboard cards with pagination metadata
3. WHEN dashboard cards are retrieved, THE system SHALL filter results by the authenticated user's tenant_id
4. WHEN no dashboard cards exist for a tenant, THE system SHALL return an empty list with pagination metadata
5. WHEN dashboard cards are returned from the API, THE frontend SHALL display them on the dashboard page

### Requirement 2: Data Flow Verification

**User Story:** As a developer, I want to verify the complete data flow from database to frontend, so that I can identify where cards are being lost.

#### Acceptance Criteria

1. WHEN the database query is executed, THE system SHALL log the query parameters including tenant_id
2. WHEN dashboard cards are retrieved from the database, THE system SHALL log the number of rows returned
3. WHEN the API response is sent, THE system SHALL log the response data structure
4. WHEN the frontend receives the API response, THE system SHALL log the cards array

### Requirement 3: Tenant Filtering Validation

**User Story:** As a system administrator, I want to ensure tenant filtering is working correctly, so that users only see their own dashboard cards.

#### Acceptance Criteria

1. WHEN Dashboard.findAll() is called with tenant_id in options, THE system SHALL apply tenant filtering in the WHERE clause
2. WHEN the BaseModel applies tenant filtering, THE system SHALL log the tenant_id being applied
3. WHEN a query is executed, THE system SHALL verify that tenant_id is included in the WHERE clause
4. WHEN results are returned, THE system SHALL verify all results belong to the specified tenant

### Requirement 4: Permission Validation

**User Story:** As a security administrator, I want to ensure users have the correct permissions to view dashboard cards, so that unauthorized access is prevented.

#### Acceptance Criteria

1. WHEN a user calls the `/api/dashboard/cards` endpoint, THE system SHALL check for 'dashboard:read' permission
2. WHEN a user lacks the required permission, THE system SHALL return a 403 Forbidden response
3. WHEN an admin user calls the endpoint, THE system SHALL bypass permission checks
4. WHEN a user has the correct permission, THE system SHALL proceed with retrieving dashboard cards

### Requirement 5: Frontend Display Logic

**User Story:** As a frontend developer, I want to verify the dashboard display logic, so that cards are rendered correctly when data is available.

#### Acceptance Criteria

1. WHEN the DashboardPage component mounts, THE system SHALL call fetchCards() to retrieve dashboard cards
2. WHEN fetchCards() completes successfully, THE system SHALL update the cards state with the returned data
3. WHEN cards state is updated, THE system SHALL render each card using the ClientDashboardCard component
4. WHEN no cards are returned, THE system SHALL display an empty state message
5. WHEN an error occurs during fetch, THE system SHALL display an error message to the user
