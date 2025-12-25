# Requirements Document

## Introduction

The FormField component should support a "country" field type that renders a country select dropdown. Currently, country selection logic exists as a separate CountrySelect component in the common folder. This feature consolidates that logic into FormField, allowing developers to use `type="country"` to render a country selector with built-in validation and error handling.

## Glossary

- **FormField**: A reusable form input component that supports multiple field types
- **Country Select**: A dropdown field that allows users to select from a predefined list of countries
- **Field Type**: The `type` prop that determines which input element is rendered (e.g., 'text', 'email', 'country')
- **Validation**: The process of checking that user input meets specified requirements

## Requirements

### Requirement 1

**User Story:** As a developer, I want to use FormField with `type="country"` to render a country selector, so that I can use a consistent field component across my forms without importing a separate CountrySelect component.

#### Acceptance Criteria

1. WHEN FormField is rendered with `type="country"` THEN the component SHALL render a select dropdown with country options
2. WHEN a user selects a country from the dropdown THEN the FormField SHALL call the onChange handler with the selected country name
3. WHEN FormField has `required={true}` and no country is selected THEN the component SHALL display an error message "Country is required"
4. WHEN a user selects a country THEN the FormField SHALL display the selected country name as the current value
5. WHEN FormField is disabled THEN the country select dropdown SHALL be disabled and prevent user interaction

### Requirement 2

**User Story:** As a developer, I want the country list to be consistent and comprehensive, so that users have access to a standard set of countries across the application.

#### Acceptance Criteria

1. THE FormField country type SHALL include a predefined list of at least 40 countries
2. WHEN the country list is rendered THEN countries SHALL be displayed with their full names (e.g., "United States", "Canada")
3. WHEN FormField is rendered with `placeholder` prop THEN the country select SHALL display the placeholder text as the default option

### Requirement 3

**User Story:** As a developer, I want country selection to integrate seamlessly with form validation, so that validation errors are displayed consistently with other field types.

#### Acceptance Criteria

1. WHEN FormField has `touched={true}` and an error exists THEN the country select SHALL display the error message below the field
2. WHEN FormField has `error` prop set THEN the country select input SHALL have error styling applied
3. WHEN a country is selected after an error THEN the error message SHALL be cleared by the parent form's validation logic
