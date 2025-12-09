# Requirements Document: Form Cleanup Inheritance Standardization

## Introduction

Recently, cleanup inheritance logic was added to the MeterForm and ContactForm components to automatically remove system fields (like `id`, `active`, `status`, `createdat`, `updatedat`, `createdAt`, `updatedAt`, and `tags`) before sending form data to the API. This cleanup logic prevents these read-only or system-managed fields from being sent back to the server, which can cause validation errors or unintended side effects.

Currently, this cleanup logic is implemented inconsistently across the application:
- **MeterForm and ContactForm**: Use the `fieldsToClean` prop on BaseForm (declarative approach)
- **LocationForm, UserForm, DeviceForm**: Manually clean fields in `formDataToEntity` (imperative approach)
- **EmailConfigForm, CompanyInfoForm, ManagementForm**: No cleanup logic implemented

This inconsistency creates maintenance burden and potential bugs. The goal is to standardize the cleanup inheritance logic across all forms in the application.

## Glossary

- **System Fields**: Read-only or system-managed fields that should never be sent to the API (e.g., `id`, `createdat`, `updatedAt`, `tags`)
- **Cleanup Inheritance**: The process of automatically removing system fields from form data before submission
- **BaseForm**: The framework component that handles dynamic schema-based form rendering
- **fieldsToClean**: A prop on BaseForm that specifies which fields should be removed before API submission
- **formDataToEntity**: A function that transforms form data into the format expected by the API

## Requirements

### Requirement 1

**User Story:** As a developer, I want all forms to consistently remove system fields before API submission, so that I don't have to manually manage cleanup logic in each form.

#### Acceptance Criteria

1. WHEN a form using BaseForm is submitted THEN the system SHALL automatically remove all system fields specified in `fieldsToClean` before sending data to the API
2. WHEN a form using custom form management is submitted THEN the system SHALL remove the same set of system fields (id, active, status, createdat, updatedat, createdAt, updatedAt, tags) before sending data to the API
3. WHEN a new form is created THEN the system SHALL provide a consistent, reusable cleanup mechanism that requires minimal configuration

### Requirement 2

**User Story:** As a developer, I want to apply the cleanup inheritance pattern to all existing forms, so that the codebase is consistent and maintainable.

#### Acceptance Criteria

1. WHEN LocationForm is updated THEN the system SHALL use the `fieldsToClean` prop on BaseForm instead of manual cleanup in `formDataToEntity`
2. WHEN UserForm is updated THEN the system SHALL use the `fieldsToClean` prop on BaseForm instead of manual cleanup in `formDataToEntity`
3. WHEN DeviceForm is updated THEN the system SHALL use the `fieldsToClean` prop on BaseForm instead of manual cleanup in `formDataToEntity`
4. WHEN EmailConfigForm is reviewed THEN the system SHALL determine if cleanup logic is needed and apply it if appropriate
5. WHEN CompanyInfoForm is reviewed THEN the system SHALL determine if cleanup logic is needed and apply it if appropriate
6. WHEN ManagementForm is reviewed THEN the system SHALL determine if cleanup logic is needed and apply it if appropriate

### Requirement 3

**User Story:** As a developer, I want a centralized definition of system fields that should be cleaned, so that I don't have to duplicate the field list across multiple forms.

#### Acceptance Criteria

1. WHEN the system fields list needs to be updated THEN the system SHALL have a single source of truth for which fields should be cleaned
2. WHEN a form is created or updated THEN the system SHALL reference this centralized definition rather than duplicating the field list
3. WHEN the cleanup logic is applied THEN the system SHALL use the same set of fields across all forms for consistency

