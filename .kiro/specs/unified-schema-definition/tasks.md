# Implementation Plan

- [x] 1. Create enhanced schema definition utilities










  - Create `framework/frontend/forms/utils/entitySchema.ts` with `defineEntitySchema` function
  - Implement type inference utilities for form fields, entity fields, and legacy fields
  - Add schema validation function to catch configuration errors
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 2.5_


- [x] 1.1 Write unit tests for schema utilities



  - Test `defineEntitySchema` creates correct structure
  - Test type inference for various field types
  - Test schema validation catches errors
  - Test legacy field mapping functionality
  - _Requirements: 1.1, 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 2. Migrate Contact entity to unified schema







  - Update `client/frontend/src/features/contacts/contactConfig.ts` to use `defineEntitySchema`
  - Define `contactSchema` with formFields, entityFields, and legacyFields sections
  - Replace manual `Contact` interface with type derived from schema
  - Export `contactFormSchema` from `contactSchema.form` for backward compatibility
  - _Requirements: 1.1, 1.4, 2.1, 2.2, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 2.1 Test Contact entity migration


  - Verify ContactForm component works with migrated schema
  - Verify ContactList component works with migrated schema
  - Test API integration with toApi/fromApi transformations
  - Test legacy field compatibility (active, createdAt, updatedAt)
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 3. Create migration documentation
  - Write migration guide in `framework/frontend/forms/docs/entity-schema-migration.md`
  - Include before/after examples showing the migration pattern
  - Document the three-section structure (formFields, entityFields, legacyFields)
  - Provide troubleshooting tips for common migration issues
  - _Requirements: 4.4, 4.5_

- [x] 4. Migrate Location entity to unified schema



  - Update `client/frontend/src/features/locations/locationConfig.ts` to use `defineEntitySchema`
  - Define `locationSchema` with appropriate field sections
  - Replace manual `Location` interface with type derived from schema
  - Verify LocationForm and LocationList components work correctly
  - _Requirements: 1.1, 4.1, 4.2, 4.3_

- [x] 5. Migrate Meter entity to unified schema





  - Update `client/frontend/src/features/meters/meterConfig.ts` to use `defineEntitySchema`
  - Define `meterSchema` with appropriate field sections including complex MeterConfig type
  - Replace manual `Meter` interface with type derived from schema
  - Verify MeterForm and MeterList components work correctly
  - _Requirements: 1.1, 4.1, 4.2, 4.3_


- [x] 6. Migrate User entity to unified schema



  - Update `client/frontend/src/features/users/userConfig.ts` to use `defineEntitySchema`
  - Define `userSchema` with appropriate field sections including UserRole enum
  - Replace manual `User` interface with type derived from schema
  - Verify UserForm and UserList components work correctly
  - _Requirements: 1.1, 4.1, 4.2, 4.3_

- [x] 7. Migrate Device entity to unified schema



  - Update `client/frontend/src/features/devices/deviceConfig.ts` to use `defineEntitySchema`
  - Define `deviceSchema` with appropriate field sections
  - Replace manual `Device` interface with type derived from schema
  - Remove duplicate Device interface declaration
  - Clean up unused imports
  - Verify DeviceForm and DeviceList components work correctly
  - _Requirements: 1.1, 4.1, 4.2, 4.3_
