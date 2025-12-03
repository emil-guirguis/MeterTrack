# Requirements Document: Sync Company Info Card

## Introduction

The Sync Company Info Card is a UI component on the SyncStatus dashboard that displays the currently connected tenant/company information. The card queries the local sync database on page load and displays tenant information if available, or shows a placeholder state if no tenant is configured.

## Glossary

- **Sync Frontend**: The React-based web application running on port 3003 for meter synchronization management
- **Sync Database**: Local SQLite database used by the sync MCP server to store tenant and meter data
- **Tenant Table**: Local database table storing tenant/company information
- **Tenant Record**: A row in the tenant table containing company/organization information
- **Company Info Card**: A Material-UI Card component on the SyncStatus page displaying tenant information

## Requirements

### Requirement 1

**User Story:** As a user, I want to see the company information associated with my sync account, so that I know which tenant/organization the sync system is connected to.

#### Acceptance Criteria

1. WHEN the SyncStatus page loads THEN the system SHALL query the local sync database tenant table for existing tenant records
2. WHEN tenant data exists in the local database THEN the system SHALL display the tenant information in the Company Info Card
3. WHEN no tenant data exists in the local database THEN the system SHALL display a "Connect" button in the Company Info Card
4. WHEN the page loads with existing tenant data THEN the system SHALL display the tenant name, ID, and any other relevant company information

### Requirement 2

**User Story:** As a user, I want to connect my sync account to a company, so that the sync system knows which organization's data to synchronize.

#### Acceptance Criteria

1. WHEN a user clicks the "Connect" button in the Company Info Card THEN the system SHALL display a login modal dialog
2. WHEN the login modal is displayed THEN the system SHALL show email and password input fields
3. WHEN a user enters valid credentials and submits the login modal THEN the system SHALL authenticate against the main API `/api/auth/login` endpoint
4. WHEN authentication succeeds THEN the system SHALL retrieve the authenticated user's tenant information from the API response

### Requirement 3

**User Story:** As a system, I want to persist the authenticated tenant information, so that the user remains connected across sessions.

#### Acceptance Criteria

1. WHEN a user successfully authenticates THEN the system SHALL update the local sync database tenant table with the user's tenant record
2. WHEN the tenant record is updated THEN the system SHALL refresh the Company Info Card to display the new tenant information
3. WHEN the tenant record is persisted THEN the system SHALL close the login modal
4. WHEN the page is reloaded THEN the system SHALL display the previously authenticated tenant information without requiring re-authentication

### Requirement 4

**User Story:** As a user, I want clear feedback when connecting my account, so that I understand the current state of the connection process.

#### Acceptance Criteria

1. WHEN the login modal is submitted THEN the system SHALL display a loading indicator and disable the submit button
2. WHEN authentication fails THEN the system SHALL display an error message in the login modal
3. WHEN authentication succeeds THEN the system SHALL display a success message and close the modal
4. WHEN a network error occurs during authentication THEN the system SHALL display an error message and allow the user to retry

### Requirement 5

**User Story:** As a user, I want to disconnect my company account, so that I can switch to a different organization.

#### Acceptance Criteria

1. WHEN a user clicks a "Disconnect" button on the Company Info Card THEN the system SHALL remove the tenant record from the local sync database
2. WHEN the tenant record is removed THEN the system SHALL display the "Connect" button again
3. WHEN the user disconnects THEN the system SHALL clear any cached tenant information from the UI

