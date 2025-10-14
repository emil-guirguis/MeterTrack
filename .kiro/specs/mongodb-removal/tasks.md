# Implementation Plan

- [x] 1. Remove MongoDB model files and dependencies





  - Delete all MongoDB model files (User.js, Building.js, Equipment.js, Contact.js, CompanySettings.js, Meter.js, MeterReading.js, MeterData.js, Devices.js)
  - Remove mongoose and mongodb dependencies from package.json files
  - Clean up MongoDB-related keywords and descriptions
  - _Requirements: 1.1, 1.2, 1.4, 3.1, 3.2_

- [x] 2. Rename PostgreSQL models to standard names





  - Rename UserPG.js to User.js
  - Rename BuildingPG.js to Building.js (if exists)
  - Rename EquipmentPG.js to Equipment.js (if exists)
  - Rename ContactPG.js to Contact.js (if exists)
  - Rename EmailTemplatePG.js to EmailTemplate.js (if exists)
  - Rename MeterPG.js to Meter.js (if exists)
  - Rename MeterReadingPG.js to MeterReading.js (if exists)
  - _Requirements: 3.1, 3.2, 4.1_

- [x] 3. Update model imports in service files





  - Update deviceService.js to import renamed models
  - Update EmailService.js to import renamed models
  - Update settingsService.js to import renamed models
  - Update all other service files to use renamed model imports
  - Remove any mongoose-specific code patterns
  - _Requirements: 1.2, 3.3, 4.1, 4.2_

- [x] 4. Update model imports in route files





  - Update auth.js route to import renamed User model
  - Update users.js route to import renamed User model
  - Update buildings.js route to import renamed Building model
  - Update equipment.js route to import renamed Equipment model
  - Update contacts.js route to import renamed Contact model
  - Update meters.js route to import renamed Meter model
  - Update meterReadings.js route to import renamed MeterReading model
  - Update devices.js route to import renamed models
  - Update all other route files to use renamed model imports
  - _Requirements: 1.2, 3.3, 4.1, 4.2_
-

- [x] 5. Clean up server.js configuration




  - Remove commented MongoDB connection code
  - Remove MongoDB-related environment variable references
  - Remove any mongoose import statements
  - Clean up MongoDB-related comments and documentation
  - Ensure only PostgreSQL database connection is used
  - _Requirements: 1.1, 1.3, 2.1, 2.3, 5.3_

- [x] 6. Update test files to use PostgreSQL models




  - Update deviceService.test.js to import renamed models
  - Update test setup files to remove MongoDB configuration
  - Ensure all test files use PostgreSQL models and connections
  - Remove any mongoose-specific test utilities
  - _Requirements: 1.2, 3.3, 4.1, 4.3_
-

- [x] 7. Remove MongoDB migration and setup files




  - Delete migrate-mongo-to-postgres.js
  - Delete all .mongodb.js files in root directory (connect-to-meterdb.mongodb.js, meter-readings-setup.mongodb.js, etc.)
  - Delete run-migration.js and run-migration.ps1 files
  - Remove MongoDB-related migration scripts
  - _Requirements: 3.1, 5.1, 5.2_

- [x] 8. Update package.json dependencies




  - Remove mongoose dependency from root package.json
  - Remove mongoose dependency from backend/package.json
  - Remove mongodb from keywords array
  - Update project description to reflect PostgreSQL-only architecture
  - Run npm install to clean up node_modules
  - _Requirements: 1.4, 3.1, 5.1_

- [x] 9. Clean up environment configuration




  - Remove MongoDB connection string variables from .env files
  - Update environment documentation to remove MongoDB references
  - Ensure only PostgreSQL configuration variables remain
  - Update deployment scripts to remove MongoDB setup
  - _Requirements: 2.2, 2.3, 5.3, 5.4_

- [ ] 10. Verify system functionality and run tests









  - Run all existing tests to ensure they pass with PostgreSQL models
  - Test API endpoints to verify they work correctly
  - Verify application startup and shutdown processes
  - Test database operations and error handling
  - _Requirements: 4.1, 4.2, 4.3, 4.4_