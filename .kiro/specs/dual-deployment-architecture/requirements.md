# Requirements Document

## Introduction

This document defines the requirements for restructuring the MeterIT application into a dual-deployment architecture. The system will consist of a centralized Client System with a shared API backend, and multiple Syncs that collect meter data on-site and communicate with the Client System over the internet.

## Glossary

- **Client System**: The centralized server deployment that hosts the Shared API, Client Database, and Client Frontend
- **Sync**: The edge deployment installed on-site that collects meter data and communicates with the Client System over the internet
- **Shared API**: The backend API hosted on the Client System that serves both Client Frontend and Sync requests
- **Client Database**: The PostgreSQL database hosted on the Client System server
- **Sync Database**: The PostgreSQL database running on the Sync for temporary storage and offline operation
- **Meter Collection Service**: The service that reads data from BACnet meters
- **Sync Service**: The service that uploads local meter readings to the Client Database
- **Client Frontend**: The web interface for the centralized Client System
- **Sync Frontend**: The web interface for the on-site Sync
- **Client MCP Server**: The Model Context Protocol server for the Client System
- **Sync MCP**: The Model Context Protocol server for the Sync

## Requirements

### Requirement 1: Dual Deployment Architecture

**User Story:** As a system architect, I want to deploy the application with a centralized Client System and distributed Syncs, so that I can support both centralized monitoring and on-site edge data collection.

#### Acceptance Criteria

1. THE Client System SHALL host the Shared API, Client Database, and Client Frontend on a single server
2. THE Sync SHALL provide a web interface accessible only from the local network
3. THE Client System SHALL serve API requests from both the Client Frontend and all Syncs
4. THE Sync SHALL communicate with the Shared API over the internet
5. WHERE the Sync is deployed, THE system SHALL operate independently when the Client System is unavailable

### Requirement 2: Centralized Shared API

**User Story:** As a developer, I want a single API hosted on the Client System that serves all clients, so that I can maintain one codebase and ensure data consistency.

#### Acceptance Criteria

1. THE Shared API SHALL be hosted exclusively on the Client System server
2. THE Shared API SHALL connect to the Client Database for all data operations
3. THE Shared API SHALL provide endpoints accessible to both Client Frontend and Syncs
4. THE Shared API SHALL authenticate and authorize requests from Syncs
5. THE Shared API SHALL provide endpoints for Syncs to upload meter readings

### Requirement 3: Sync Meter Data Collection

**User Story:** As a facility manager, I want the Sync to collect meter readings from all on-site BACnet meters, so that I can monitor energy consumption in real-time without depending on cloud connectivity.

#### Acceptance Criteria

1. THE Meter Collection Service SHALL connect to all configured BACnet meters on the local network
2. THE Meter Collection Service SHALL read meter data at configurable intervals
3. THE Meter Collection Service SHALL store collected readings in the Sync Database
4. WHEN a meter is unreachable, THE Meter Collection Service SHALL log the error and continue collecting from other meters
5. THE Meter Collection Service SHALL run only in the Sync deployment

### Requirement 4: Data Synchronization to Client

**User Story:** As a facility manager, I want the Sync to automatically upload collected meter readings to the Client System, so that centralized monitoring and reporting can access the data.

#### Acceptance Criteria

1. THE Sync Service SHALL batch upload meter readings from Sync Database to the Shared API at configurable intervals
2. WHEN upload succeeds, THE Sync Service SHALL delete the synchronized readings from the Sync Database
3. IF upload fails, THE Sync Service SHALL retry with exponential backoff up to a maximum of 5 attempts
4. WHILE the Client System is unreachable, THE Sync Service SHALL queue readings in the Sync Database
5. THE Sync Service SHALL download configuration data from the Shared API to the Sync Database
6. THE Sync Service SHALL run only in the Sync deployment

### Requirement 5: Separate Frontend Applications

**User Story:** As a user, I want distinct frontend interfaces for client and Sync access, so that each interface can be optimized for its specific use case.

#### Acceptance Criteria

1. THE Client Frontend SHALL be hosted on the Client System server
2. THE Client Frontend SHALL connect to the Shared API on the same server
3. THE Sync Frontend SHALL be hosted on the Sync
4. THE Sync Frontend SHALL connect to the Shared API over the internet
5. THE Client Frontend SHALL display data from all synchronized Syncs
6. THE Sync Frontend SHALL display only data from the local meters

### Requirement 6: Independent MCP Servers

**User Story:** As a developer, I want separate MCP servers for client and Sync deployments, so that each can provide context-appropriate AI assistance.

#### Acceptance Criteria

1. THE Client MCP Server SHALL be hosted on the Client System server
2. THE Client MCP Server SHALL provide tools for querying the Client Database through the Shared API
3. THE Sync MCP SHALL be hosted on the Sync
4. THE Sync MCP SHALL provide tools for controlling the Meter Collection Service and monitoring synchronization status
5. THE Sync MCP SHALL communicate with the Shared API over the internet for remote data operations

### Requirement 7: Configuration Management

**User Story:** As a DevOps engineer, I want clear configuration separation between client and Sync deployments, so that I can easily deploy and maintain both systems.

#### Acceptance Criteria

1. THE system SHALL use separate environment files for Client System and Sync configurations
2. THE system SHALL provide example configuration files for both deployment modes
3. THE Client System configuration SHALL include Client Database connection parameters and API server settings
4. THE Sync configuration SHALL include Sync Database connection parameters and Client System API endpoint
5. THE Sync configuration SHALL include BACnet meter connection parameters

### Requirement 8: Database Schema Compatibility

**User Story:** As a database administrator, I want the Sync Database to store meter readings in a format compatible with the Client Database, so that data synchronization works seamlessly.

#### Acceptance Criteria

1. THE Sync Database schema SHALL store meter readings in a format compatible with the Shared API upload format
2. THE Sync Database SHALL include tables for synchronization tracking and queue management
3. THE system SHALL provide migration scripts for the Sync Database
4. THE Shared API SHALL validate uploaded data format before storing in the Client Database
5. THE Sync Service SHALL transform local data to match the Shared API expected format

### Requirement 9: Offline Operation

**User Story:** As a facility manager, I want the Sync to continue collecting and storing meter data when the Client System is unavailable, so that no data is lost during network outages.

#### Acceptance Criteria

1. WHEN the Client System is unreachable, THE Sync SHALL continue normal meter collection operations
2. WHEN the Client System is unreachable, THE Sync Frontend SHALL remain fully functional for local data viewing
3. WHEN the Client System is unreachable, THE Sync Service SHALL queue all readings in the Sync Database
4. WHEN the Client System becomes reachable, THE Sync Service SHALL automatically resume synchronization
5. THE Sync SHALL provide status indicators for Client System connectivity

### Requirement 10: Project Structure Organization

**User Story:** As a developer, I want a clear project structure that separates client and Sync components, so that I can easily navigate and maintain the codebase.

#### Acceptance Criteria

1. THE project SHALL organize code into clearly named directories for client and Sync components
2. THE Shared API SHALL reside in the backend directory for Client System deployment
3. THE Client Frontend SHALL reside in a separate directory from the Sync Frontend
4. THE Client MCP Server SHALL reside in a separate directory from the Sync MCP
5. THE project SHALL provide separate startup scripts for Client System and Sync
6. THE Sync SHALL be packaged as a standalone application that can be deployed independently
