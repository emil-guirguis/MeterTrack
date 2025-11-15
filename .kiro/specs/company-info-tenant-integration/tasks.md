# Implementation Plan

- [ ] 1. Update Settings Service to use correct tenant table field names
  - Modify `settingsService.js` to query tenant table using actual field names: name, url, address, address2, city, state, zip, country
  - Update `formatSettings()` method to map tenant table fields to frontend format
  - Update `formatForDatabase()` method to map frontend format to tenant table fields
  - Remove references to non-existent fields (company_name, company_address_street, company_phone, company_email, etc.)
  - _Requirements: 1.1, 1.2, 2.1, 2.2_

- [ ] 2. Update default settings creation to match tenant schema
  - Modify `createDefaultSettings()` to use correct tenant table field names
  - Set appropriate default values for: name, url, address, address2, city, state, zip, country
  - Remove default values for fields that don't exist in tenant table
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 3. Update Company Info Form to match tenant table fields
  - Add Website URL input field (mapped to tenant.url)
  - Update Street Address field to map to tenant.address
  - Add Address Line 2 field (mapped to tenant.address2)
  - Update Zip Code field to map to tenant.zip (not zipCode)
  - Remove Logo URL field (not in tenant table)
  - Update field change handlers to use correct field paths
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [ ] 4. Update Settings Store to handle new field structure
  - Verify Settings Store correctly passes data to/from backend API
  - Update any field name references in the store if needed
  - Ensure optimistic updates use correct field names
  - _Requirements: 1.3, 2.3, 2.4_

- [ ] 5. Test the complete flow
  - Verify settings load correctly from tenant table on page load
  - Verify all form fields display correct data from database
  - Verify form submission updates tenant table with correct field names
  - Verify default tenant creation works when no record exists
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 4.1, 4.2, 4.3_
