# Requirements Document

## Introduction

The Settings > Company Info page needs to correctly load and save data from the tenant table in the PostgreSQL database. Currently, there is a field name mismatch between the actual tenant table schema and the backend service expectations, preventing proper data loading and saving.

## Glossary

- **Tenant Table**: The PostgreSQL database table that stores company/tenant information with fields: id, name, url, address, address2, city, state, zip, country, active, created_at, updated_at
- **Settings Service**: The backend service (settingsService.js) responsible for reading and writing company settings
- **Company Info Form**: The frontend React component (CompanyInfoForm.tsx) that displays and allows editing of company information
- **Settings Store**: The frontend Zustand store (settingsStore.ts) that manages company settings state and API calls

## Requirements

### Requirement 1

**User Story:** As a system administrator, I want the Company Info form to display the current tenant data from the database, so that I can view my company's information

#### Acceptance Criteria

1. WHEN THE Settings Store fetches company settings, THE Settings Service SHALL query the tenant table using the correct field names
2. WHEN THE Settings Service retrieves tenant data, THE Settings Service SHALL map database field names to the frontend expected format
3. WHEN THE Company Info Form loads, THE Company Info Form SHALL display the name field from the tenant table in the Company Name input
4. WHEN THE Company Info Form loads, THE Company Info Form SHALL display the address, address2, city, state, zip, and country fields in their respective inputs
5. WHEN THE Company Info Form loads, THE Company Info Form SHALL display the url field in the appropriate input

### Requirement 2

**User Story:** As a system administrator, I want to update company information through the Settings page, so that I can keep our company details current

#### Acceptance Criteria

1. WHEN THE user submits the Company Info form, THE Settings Service SHALL map the frontend field names to the correct tenant table column names
2. WHEN THE Settings Service updates tenant data, THE Settings Service SHALL use the actual tenant table field names (name, address, city, state, zip, country, url)
3. WHEN THE update is successful, THE Settings Store SHALL refresh the cached settings with the updated data
4. IF THE update fails, THEN THE Settings Store SHALL display an error message to the user
5. WHEN THE tenant record does not exist, THE Settings Service SHALL create a new tenant record with default values

### Requirement 3

**User Story:** As a system administrator, I want the Company Info form to include all relevant fields from the tenant table, so that I can manage complete company information

#### Acceptance Criteria

1. THE Company Info Form SHALL include an input field for the company name (mapped to tenant.name)
2. THE Company Info Form SHALL include an input field for the company website URL (mapped to tenant.url)
3. THE Company Info Form SHALL include an input field for address line 1 (mapped to tenant.address)
4. THE Company Info Form SHALL include an input field for address line 2 (mapped to tenant.address2)
5. THE Company Info Form SHALL include input fields for city, state, zip code, and country (mapped to tenant.city, tenant.state, tenant.zip, tenant.country)
6. THE Company Info Form SHALL remove any fields that do not exist in the tenant table schema (such as logo, contact phone, contact email)

### Requirement 4

**User Story:** As a developer, I want the Settings Service to handle missing tenant records gracefully, so that the application works correctly on first use

#### Acceptance Criteria

1. WHEN THE Settings Service queries for tenant data and no records exist, THE Settings Service SHALL create a default tenant record
2. WHEN THE Settings Service creates a default tenant record, THE Settings Service SHALL use sensible default values for all required fields
3. WHEN THE default tenant record is created, THE Settings Service SHALL return the newly created record to the frontend
4. THE Settings Service SHALL ensure the tenant table has exactly one record at all times
5. IF multiple tenant records exist, THEN THE Settings Service SHALL use the first record (LIMIT 1)
