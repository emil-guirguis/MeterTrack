u# Implementation Plan: Schema System Migration

## Overview

This implementation plan outlines the step-by-step tasks to migrate the entire MeterItPro application to the single-source-of-truth schema system.

---

- [x] 1. Verify and enhance backend schema framework





  - Ensure SchemaDefinition.js has all required features
  - Test field types and validation
  - Test relationship definitions
  - Test auto-initialization
  - _Requirements: 1.1-1.10, 2.1-2.10_

- [x] 2. Verify and enhance schema API routes





  - Test GET /api/schema endpoint
  - Test GET /api/schema/:entity endpoint
  - Test POST /api/schema/:entity/validate endpoint
  - Verify error handling
  - _Requirements: 3.1-3.10_

- [x] 3. Verify and enhance frontend schema loader





  - Test fetchSchema() function
  - Test useSchema() hook
  - Test schema caching
  - Test error handling
  - _Requirements: 4.1-4.10_

- [x] 4. Migrate Contact model with relationships





  - [x] 4.1 Review generated ContactWithSchema.js


    - Verify all fields are present
    - Check field types and validation
    - _Requirements: 6.3, 6.4_
  
  - [x] 4.2 Add relationships to Contact model


    - Add tenant relationship (BELONGS_TO)
    - Add any other relevant relationships
    - _Requirements: 7.1, 7.2_
  
  - [x] 4.3 Copy Contact model to project


    - Backup original Contact.js
    - Copy ContactWithSchema.js to models directory
    - _Requirements: 8.1, 8.2_
  
  - [x] 4.4 Register Contact in schema routes


    - Add to models object in schema.js
    - Test /api/schema/contact endpoint
    - _Requirements: 3.2_
  
  - [x] 4.5 Create ContactFormDynamic component


    - Implement useSchema('contact')
    - Render fields dynamically
    - Implement validation
    - _Requirements: 5.1-5.10_
  
  - [x] 4.6 Test Contact migration


    - Test CRUD operations
    - Test form rendering
    - Test validation
    - _Requirements: 9.1-9.10_

- [ ] 5. Migrate Device model with relationships





  - [x] 5.1 Review generated DeviceWithSchema.js


    - Verify all fields are present
    - _Requirements: 6.3_
  
  - [x] 5.2 Add relationships to Device model


    - Add meters relationship (HAS_MANY)
    - Add tenant relationship (BELONGS_TO)
    - _Requirements: 7.2, 7.3_
  
  - [x] 5.3 Copy Device model to project


    - Backup original Device.js
    - Copy DeviceWithSchema.js
    - _Requirements: 8.3_
  
  - [x] 5.4 Register Device in schema routes


    - Add to schema.js
    - Test endpoint
    - _Requirements: 3.2_
  
  - [x] 5.5 Create DeviceFormDynamic component


    - Implement dynamic form
    - _Requirements: 5.1-5.10_
  
  - [x] 5.6 Test Device migration


    - Test CRUD and relationships
    - _Requirements: 9.1-9.10_

- [x] 6. Migrate Location model with relationships





  - [x] 6.1 Review generated LocationWithSchema.js


    - Verify all fields
    - _Requirements: 6.3_
  
  - [x] 6.2 Add relationships to Location model


    - Add meters relationship (HAS_MANY)
    - Add tenant relationship (BELONGS_TO)
    - _Requirements: 7.2_
  
  - [x] 6.3 Copy Location model to project


    - Backup and copy
    - _Requirements: 8.3_
  
  - [x] 6.4 Register Location in schema routes


    - Add to schema.js
    - _Requirements: 3.2_
  
  - [x] 6.5 Create LocationFormDynamic component


    - Implement dynamic form
    - _Requirements: 5.1-5.10_
  
  - [x] 6.6 Test Location migration


    - Test CRUD and relationships
    - _Requirements: 9.1-9.10_

- [x] 7. Migrate Meter model with relationships






  - [x] 7.1 Review generated MeterWithSchema.js

    - Verify all 20 fields
    - _Requirements: 6.3_
  

  - [x] 7.2 Add relationships to Meter model

    - Add device relationship (BELONGS_TO)
    - Add location relationship (BELONGS_TO)
    - Add readings relationship (HAS_MANY)
    - Add statusLogs relationship (HAS_MANY)
    - Add maintenanceRecords relationship (HAS_MANY)
    - Add triggers relationship (HAS_MANY)
    - Add usageAlerts relationship (HAS_MANY)
    - Add monitoringAlerts relationship (HAS_MANY)
    - _Requirements: 7.1-7.10_
  

  - [x] 7.3 Copy Meter model to project

    - Backup and copy
    - _Requirements: 8.3_
  

  - [x] 7.4 Register Meter in schema routes

    - Add to schema.js
    - _Requirements: 3.2_
  

  - [x] 7.5 Create MeterFormDynamic component

    - Implement dynamic form with all fields
    - _Requirements: 5.1-5.10_
  
  - [x] 7.6 Test Meter migration


    - Test CRUD operations
    - Test all relationships
    - _Requirements: 9.1-9.10_

- [x] 8. Migrate MeterReadings model






  - [x] 8.1 Review generated MeterReadingsWithSchema.js

    - Verify all 119 fields!
    - _Requirements: 6.3_
  
  - [x] 8.2 Add relationships to MeterReadings model


    - Add meter relationship (BELONGS_TO)
    - _Requirements: 7.1_
  
  - [x] 8.3 Copy and register MeterReadings model


    - Copy to project
    - Register in schema routes
    - _Requirements: 3.2, 8.3_
  
  - [x] 8.4 Test MeterReadings migration


    - Test queries with meter relationship
    - _Requirements: 9.7_

- [x] 9. Migrate Users model with relationships




  - [x] 9.1 Review generated UsersWithSchema.js


    - Verify all 46 fields
    - _Requirements: 6.3_
  
  - [x] 9.2 Add relationships to Users model


    - Add tenant relationship (BELONGS_TO)
    - _Requirements: 7.1_
  
  - [x] 9.3 Copy and register Users model


    - Copy to project
    - Register in schema routes
    - _Requirements: 3.2, 8.3_
  
  - [x] 9.4 Create UserFormDynamic component


    - Implement dynamic form
    - _Requirements: 5.1-5.10_
  
  - [x] 9.5 Test Users migration


    - Test authentication still works
    - Test CRUD operations
    - _Requirements: 9.1-9.10_

- [x] 10. Migrate Tenant model with relationships






  - [x] 10.1 Review and add relationships to Tenant model

    - Add users relationship (HAS_MANY)
    - Add meters relationship (HAS_MANY)
    - Add devices relationship (HAS_MANY)
    - Add locations relationship (HAS_MANY)
    - _Requirements: 7.2_
  
  - [x] 10.2 Copy and register Tenant model


    - Copy to project
    - Register in schema routes
    - _Requirements: 3.2, 8.3_
  
  - [x] 10.3 Test Tenant migration


    - Test multi-tenant isolation
    - _Requirements: 9.1-9.10_


- [x] 11. Migrate remaining models




  - [x] 11.1 Migrate EmailLogs model


    - Review, add relationships, copy, register
    - _Requirements: 6.1-6.10_
  
  - [x] 11.2 Migrate EmailTemplates model


    - Review, add relationships, copy, register
    - _Requirements: 6.1-6.10_
  
  - [x] 11.3 Migrate MeterMaintenance model


    - Add meter relationship (BELONGS_TO)
    - Copy and register
    - _Requirements: 7.1_
  
  - [x] 11.4 Migrate MeterMaps model


    - Add meter relationship (BELONGS_TO)
    - Copy and register
    - _Requirements: 7.1_
  
  - [x] 11.5 Migrate MeterMonitoringAlerts model


    - Add meter relationship (BELONGS_TO)
    - Copy and register
    - _Requirements: 7.1_
  
  - [x] 11.6 Migrate MeterStatusLog model


    - Add meter relationship (BELONGS_TO)
    - Copy and register
    - _Requirements: 7.1_
  
  - [x] 11.7 Migrate MeterTriggers model


    - Add meter relationship (BELONGS_TO)
    - Copy and register
    - _Requirements: 7.1_
  
  - [x] 11.8 Migrate MeterUsageAlerts model


    - Add meter relationship (BELONGS_TO)
    - Copy and register
    - _Requirements: 7.1_
  
  - [x] 11.9 Migrate NotificationLogs model


    - Review, add relationships, copy, register
    - _Requirements: 6.1-6.10_

- [x] 12. Update all API routes to use new models




  - [x] 12.1 Update contact routes


    - Replace Contact with ContactWithSchema
    - Test all endpoints
    - _Requirements: 8.9_
  
  - [x] 12.2 Update device routes


    - Replace Device with DeviceWithSchema
    - Test all endpoints
    - _Requirements: 8.9_
  
  - [x] 12.3 Update location routes


    - Replace Location with LocationWithSchema
    - Test all endpoints
    - _Requirements: 8.9_
  
  - [x] 12.4 Update meter routes


    - Replace Meter with MeterWithSchema
    - Test all endpoints
    - _Requirements: 8.9_
  
  - [x] 12.5 Update remaining routes


    - Update all other entity routes
    - Test all endpoints
    - _Requirements: 8.9_

- [x] 13. Update all frontend components





  - [x] 13.1 Update Contact components


    - Replace ContactForm with ContactFormDynamic
    - Update ContactList to use schema
    - Test UI
    - _Requirements: 5.1-5.10_
  
  - [x] 13.2 Update Device components


    - Replace DeviceForm with DeviceFormDynamic
    - Update DeviceList
    - Test UI
    - _Requirements: 5.1-5.10_
  
  - [x] 13.3 Update Location components


    - Replace LocationForm with LocationFormDynamic
    - Update LocationList
    - Test UI
    - _Requirements: 5.1-5.10_
  
  - [x] 13.4 Update Meter components


    - Replace MeterForm with MeterFormDynamic
    - Update MeterList
    - Test UI
    - _Requirements: 5.1-5.10_
  
  - [x] 13.5 Update remaining components


    - Update all other entity forms
    - Test all UIs
    - _Requirements: 5.1-5.10_
-

- [x] 14. Implement relationship loading




  - [x] 14.1 Add relationship loading to BaseModel


    - Implement loadRelationship() method
    - Support autoLoad option
    - Support select fields
    - _Requirements: 7.5, 7.6, 7.7_
  
  - [x] 14.2 Test BELONGS_TO relationships


    - Test Meter → Device
    - Test Meter → Location
    - _Requirements: 7.2, 9.9_
  
  - [x] 14.3 Test HAS_MANY relationships


    - Test Device → Meters
    - Test Location → Meters
    - _Requirements: 7.3, 9.9_
  
  - [x] 14.4 Prevent circular dependencies


    - Implement cycle detection
    - Test with circular relationships
    - _Requirements: 7.8_


- [x] 15. Manual verification checkpoint




  - Manually test CRUD operations for all migrated entities
  - Verify all forms render correctly
  - Verify all relationships load correctly
  - Ask user if any issues arise
  - _Requirements: 9.1-9.10_

- [x] 16. Cleanup and optimization



  - [x] 16.1 Remove old model files


    - Backup old models
    - Remove from project
    - _Requirements: 8.1_
  
  - [x] 16.2 Remove duplicate frontend configs


    - Remove old schema definitions
    - Keep only dynamic forms
    - _Requirements: 8.2_
  


  - [x] 16.3 Optimize schema caching
    - Implement cache invalidation strategy
    - Prefetch schemas on app load

    - _Requirements: 4.2, 4.9_
  
  - [x] 16.4 Optimize relationship queries

    - Add database indexes
    - Implement query batching
    - _Requirements: 7.5_

- [x] 17. Final validation checkpoint





  - Ensure all tests pass
  - Verify all models migrated
  - Verify all forms working
  - Verify all relationships working
  - Deploy to staging
  - User acceptance testing
  - Deploy to production
  - Monitor for issues
  - _Requirements: 9.1-9.10_
