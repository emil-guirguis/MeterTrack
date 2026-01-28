# Requirements Document: Fix Meter Readings Datagrid Loading

## Introduction

The meter readings datagrid should display data when passed tenantId, meterId, and meterElementId. Currently, the grid renders but shows no data. This spec addresses the core issue: ensuring the grid reads these three values and displays the data correctly.

## Glossary

- **tenantId**: Unique identifier for the tenant
- **meterId**: Unique identifier for the meter device
- **meterElementId**: Unique identifier for the meter element
- **MeterReadingList**: The datagrid component that displays meter readings

## Requirements

### Requirement 1: Load Values from Favorite

**User Story:** As a user, I want to click on a favorite meter element and have the grid load with the correct tenantId, meterId, and meterElementId values from that favorite.

#### Acceptance Criteria

1. WHEN a user clicks on a favorite meter element, THE system SHALL extract tenantId, meterId, and meterElementId from the favorite data
2. WHEN the grid receives these values, THE MeterReadingList SHALL use them to fetch data
3. WHEN data is fetched successfully, THE MeterReadingList SHALL display the results in the datagrid body
4. WHEN the grid loads, THE data SHALL be visible and not empty
