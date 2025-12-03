# Requirements Document: Sync Tenant to Local Database

## Introduction

After a user logs into the remote server and receives a tenant ID, the sync system needs to download the tenant record from the remote database and store it in the local sync database. This allows the frontend to display the company information without needing direct access to the remote database.

## Glossary

- **Remote Main Database**: The primary PostgreSQL database running on the client backend containing tenant information
- **Local Sync Database**: The local PostgreSQL database used by the sync MCP server to store tenant and meter data
- **Tenant Record**: A row in the tenant table containing company/organization information
- **Tenant ID**: The unique identifier for a tenant record

## Requirements

### Requirement 1

**User Story:** As a sync system, I want to download the tenant record from the remote database and store it locally, so that the frontend can display company information.

#### Acceptance Criteria

1. WHEN a tenant ID is provided THEN the system SHALL query the remote database for the tenant record with that ID
2. WHEN a tenant record exists in the remote database THEN the system SHALL copy all tenant fields (name, url, address, address2, city, state, zip, country, active) to the local sync database
3. WHEN the tenant record is copied to the local database THEN the system SHALL preserve the original tenant ID from the remote database
4. WHEN the same tenant is synchronized multiple times THEN the system SHALL update the existing record in the local database with the latest data

</content>
</invoke>