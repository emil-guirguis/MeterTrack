# Implementation Plan: ORM Helper dbField Fix

## Overview

Fix the ORM helpers to use the `dbField` property when constructing SQL statements. This allows models to define a primary key field as `id` in the schema while mapping it to the actual database column (e.g., `contact_id`) via the `dbField` property. This is a minimal, non-breaking change that works across all models without requiring individual model updates.

## Tasks

- [x] 1. Update buildWhereClause Helper to Use dbField
  - Open `framework/backend/shared/utils/modelHelpers.js`
  - Modify `buildWhereClause()` to accept a fields parameter
  - When building WHERE conditions, look up each field in the fields array
  - Use the field's `dbField` property instead of the field name for the SQL column
  - _Requirements: 1.1_

- [ ]* 1.1 Write property test for WHERE clause dbField usage
  - **Property 1: WHERE Clause Uses dbField**
  - **Validates: Requirements 1.1**
  - Test that WHERE clauses use dbField for column names
  - Test with fields that have different names and dbField values

- [x] 2. Update buildUpdateSQL Helper to Use dbField
  - Open `framework/backend/shared/utils/modelHelpers.js`
  - Modify `buildUpdateSQL()` to use dbField when building the WHERE clause
  - Ensure the primary key WHERE condition uses the correct database column name
  - _Requirements: 1.2_

- [ ]* 2.1 Write property test for UPDATE WHERE clause
  - **Property 2: UPDATE Uses Correct Primary Key Column**
  - **Validates: Requirements 1.2**
  - Test that UPDATE statements use dbField for the primary key column
  - Test with Contact model (id → contact_id)

- [x] 3. Update buildDeleteSQL Helper to Use dbField
  - Open `framework/backend/shared/utils/modelHelpers.js`
  - Modify `buildDeleteSQL()` to use dbField when building the WHERE clause
  - Ensure the primary key WHERE condition uses the correct database column name
  - _Requirements: 1.2_

- [ ]* 3.1 Write property test for DELETE WHERE clause
  - **Property 3: DELETE Uses Correct Primary Key Column**
  - **Validates: Requirements 1.2**
  - Test that DELETE statements use dbField for the primary key column
  - Test with Contact model (id → contact_id)

- [ ] 4. Test Contact Update Operation
  - Create a test contact via POST /api/contacts
  - Update the contact via PUT /api/contacts/:id with modified data
  - Verify the update succeeds without "column contact.id does not exist" errors
  - Verify the updated data is persisted correctly
  - _Requirements: 1.4_

- [ ]* 4.1 Write property test for Contact update success
  - **Property 4: Contact Update Operation Success**
  - **Validates: Requirements 1.4**
  - Test that valid Contact updates succeed
  - Test that updated data is returned correctly

- [x] 5. Verify No Regressions in Other Models
  - Test that User model updates still work correctly
  - Test that Device model updates still work correctly
  - Test that Meter model updates still work correctly
  - Verify all models with renamed primary keys work correctly
  - _Requirements: 1.1_

- [ ]* 5.1 Write property test for multi-model compatibility
  - **Property 5: All Models Use dbField Correctly**
  - **Validates: Requirements 1.1**
  - Test that all models with dbField mappings work correctly
  - Test UPDATE, DELETE operations across multiple models

- [ ] 6. Checkpoint - Verify All Tests Pass
  - Run all unit tests for modelHelpers
  - Run all property-based tests
  - Verify no regressions in Contact, User, Device, Meter operations
  - Ensure the API endpoints work correctly

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- This fix is minimal and non-breaking—it only changes how helpers use field metadata
- No model changes are required; the schema definitions are already correct
- This approach works for all models across the system, not just Contact
