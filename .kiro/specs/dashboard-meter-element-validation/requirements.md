# Requirements Document: Dashboard Meter/Element Validation

## Introduction

The dashboard card form needs to add validation for meter and meter element selection. When a user selects a meter, the available meter elements should be filtered to show only elements belonging to that meter. This ensures dashboard configurations are logically consistent and prevents invalid selections.

## Glossary

- **Meter**: A physical or logical device that records energy consumption data
- **Meter Element**: A specific measurement point within a meter (e.g., Phase A, Phase B, Total)
- **Tenant**: An isolated organizational unit with its own data and users
- **Dashboard Card**: A visualization widget configured to display meter data

## Requirements

### Requirement 1: Add Meter Validation

**User Story:** As a user creating a dashboard card, I want to select a valid meter, so that my dashboard references a real data source.

#### Acceptance Criteria

1. WHEN the dashboard card form opens, THE system SHALL load and display all available meters for the user's tenant
2. WHEN a user selects a meter, THE system SHALL validate that the meter exists and belongs to the user's tenant
3. IF the selected meter is invalid, THE system SHALL display an error message
4. WHEN the form is submitted, THE system SHALL reject the submission if the meter is invalid

### Requirement 2: Add Meter Element Validation with Filtering

**User Story:** As a user creating a dashboard card, I want to select a meter element that belongs to my selected meter, so that my dashboard displays the correct measurement point.

#### Acceptance Criteria

1. WHEN a user selects a meter, THE system SHALL filter and display only meter elements that belong to that meter
2. WHEN a user selects a meter element, THE system SHALL validate that the element belongs to the selected meter
3. IF the selected meter element does not belong to the selected meter, THE system SHALL display an error message
4. WHEN the form is submitted, THE system SHALL reject the submission if the meter element is invalid or does not belong to the selected meter
