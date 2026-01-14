# Requirements Document: BACnet Manual Meter Reading Card

## Introduction

This feature adds a simple card to the sync home page with a button to manually trigger the BACnet meter reading agent for debugging purposes.

## Glossary

- **BACnet Agent**: The background service that collects meter readings from BACnet devices
- **Sync Home Page**: The main dashboard page in the sync frontend application
- **Card**: A Material-UI Card component that displays information and actions

## Requirements

### Requirement 1: Add Manual BACnet Trigger Card

**User Story:** As a developer, I want a button to manually start the BACnet meter reading agent, so that I can debug and test meter reading collection.

#### Acceptance Criteria

1. WHEN the sync home page loads THEN the system SHALL display a new card with a button to trigger the BACnet agent
2. WHEN the user clicks the button THEN the system SHALL send a request to the backend to start meter reading collection
3. WHEN the collection is triggered THEN the system SHALL display a loading indicator on the button
4. WHEN the collection completes THEN the system SHALL display a success or error message
