# Requirements Document: Dashboard Meter Element Display Format

## Introduction

The dashboard card form's meter element field should display meter elements in a more readable format showing both the element letter and description, sorted alphabetically by element letter. Currently, it only shows the element name without the letter designation.

## Glossary

- **Meter Element**: A specific measurement point within a meter (e.g., Phase A, Phase B, Total)
- **Element Letter**: The single-letter designation for a meter element (A, B, C, etc.)
- **Element Description**: The human-readable name for a meter element (e.g., "Phase A", "Phase B", "Total")
- **Dashboard Card**: A visualization widget configured to display meter data
- **Tenant**: An isolated organizational unit with its own data and users

## Requirements

### Requirement 1: Display Meter Element with Letter and Description

**User Story:** As a user creating a dashboard card, I want to see meter elements displayed with both their letter designation and description, so that I can easily identify which element I'm selecting.

#### Acceptance Criteria

1. WHEN the meter element dropdown is displayed, THE system SHALL show each element in the format "LETTER - DESCRIPTION" (e.g., "A - Phase A", "B - Phase B")
2. WHEN the meter element dropdown is displayed, THE system SHALL sort the elements alphabetically by element letter (A, B, C, etc.)
3. WHEN a user selects a meter element, THE system SHALL store the correct meter element ID
4. WHEN the form is submitted, THE system SHALL validate the selected meter element correctly

### Requirement 2: Backend Returns Element Letter and Description

**User Story:** As a frontend developer, I want the backend API to return both the element letter and description for each meter element, so that I can display them in the desired format.

#### Acceptance Criteria

1. WHEN the frontend requests meter elements for a meter, THE backend SHALL return each element with both `element` (letter) and `name` (description) fields
2. WHEN the backend returns meter elements, THE system SHALL sort them by the `element` field in ascending order (A, B, C, etc.)
3. WHEN the backend returns meter elements, THE system SHALL include all necessary fields for display and validation

