# Design Document

## Overview

The current system has a dual-database architecture with both MongoDB (using Mongoose) and PostgreSQL implementations running in parallel. This creates confusion, maintenance overhead, and potential data inconsistency issues. The design focuses on completely removing all MongoDB dependencies and standardizing on PostgreSQL as the single database solution.

## Architecture

### Current State Analysis

The system currently has:
- **MongoDB Models**: Using Mongoose schemas (User.js, Building.js, Equipment.js, etc.)
- **PostgreSQL Models**: Parallel implementations with PG suffix (UserPG.js, BuildingPG.js, etc.)
- **Migration Scripts**: Tools to migrate data from MongoDB to PostgreSQL
- **Dual Dependencies**: Both mongoose and pg packages in package.json
- **Mixed Configuration**: Server.js has commented MongoDB connection code

### Target Architecture

The simplified architecture will have:
- **Single Database**: PostgreSQL only
- **Unified Models**: Remove PG suffix, keep only PostgreSQL implementations
- **Clean Dependencies**: Remove all MongoDB-related packages
- **Simplified Configuration**: Remove all MongoDB connection logic

## Components and Interfaces

### Database Layer

**Current Implementation:**
```
backend/src/config/database.js - PostgreSQL connection (✓ Keep)
```

**Models to Remove:**
- `backend/src/models/User.js` (MongoDB/Mongoose)
- `backend/src/models/Building.js` (MongoDB/Mongoose)
- `backend/src/models/Equipment.js` (MongoDB/Mongoose)
- `backend/src/models/Contact.js` (MongoDB/Mongoose)
- `backend/src/models/CompanySettings.js` (MongoDB/Mongoose)
- `backend/src/models/Meter.js` (MongoDB/Mongoose)
- `backend/src/models/MeterReading.js` (MongoDB/Mongoose)
- `backend/src/models/MeterData.js` (MongoDB/Mongoose)
- `backend/src/models/Devices.js` (MongoDB/Mongoose)

**Models to Rename and Keep:**
- `UserPG.js` → `User.js`
- `BuildingPG.js` → `Building.js`
- `EquipmentPG.js` → `Equipment.js`
- `ContactPG.js` → `Contact.js`
- `EmailTemplatePG.js` → `EmailTemplate.js`
- `MeterPG.js` → `Meter.js`
- `MeterReadingPG.js` → `MeterReading.js`

### Service Layer

**Services to Update:**
All services that import MongoDB models need to be updated to use PostgreSQL models:
- Update import statements from MongoDB models to PostgreSQL models
- Remove any mongoose-specific code patterns
- Ensure all database operations use PostgreSQL syntax

### Route Layer

**Routes to Update:**
All route files need to be updated to import the correct models:
- Update model imports to use renamed PostgreSQL models
- Remove any MongoDB-specific middleware or error handling
- Ensure consistent error handling for PostgreSQL operations

### Configuration and Dependencies

**Package.json Changes:**
- Remove `mongoose` dependency
- Remove `mongodb` from keywords
- Keep `pg` dependency
- Update description to reflect PostgreSQL-only architecture

**Environment Configuration:**
- Remove MongoDB connection string variables
- Keep only PostgreSQL configuration variables
- Update documentation to reflect single database setup

## Data Models

### PostgreSQL Schema Consistency

The existing PostgreSQL models already implement the correct schema structure:

**User Model:**
- Uses bcrypt for password hashing
- Implements proper JSON field handling for permissions
- Includes comprehensive CRUD operations
- Has proper error handling for unique constraints

**Building Model:**
- Handles nested address and contact information as JSON
- Implements proper foreign key relationships
- Includes validation and business logic

**Equipment Model:**
- References buildings via foreign keys
- Handles specifications as JSON fields
- Implements proper lifecycle management

**Meter Models:**
- Supports both meter configuration and readings
- Handles time-series data efficiently
- Implements proper indexing for performance

## Error Handling

### Database Error Patterns

**PostgreSQL Error Handling:**
- Unique constraint violations (code 23505)
- Foreign key constraint violations (code 23503)
- Connection pool exhaustion
- Query timeout handling
- Transaction rollback scenarios

**Removal of MongoDB Error Patterns:**
- Remove Mongoose validation error handling
- Remove MongoDB connection error patterns
- Remove ObjectId casting error handling
- Remove MongoDB duplicate key error patterns

### Consistent Error Response Format

Maintain consistent error response format across all endpoints:
```javascript
{
  success: false,
  message: "Error description",
  error: "Detailed error information",
  code: "ERROR_CODE"
}
```

## Testing Strategy

### Unit Testing

**Test Files to Update:**
- Update existing test files to use PostgreSQL models
- Remove any MongoDB-specific test setup
- Ensure test database uses PostgreSQL
- Update mock data to match PostgreSQL schema

**Test Database Setup:**
- Use PostgreSQL test database
- Implement proper test data seeding
- Ensure test isolation with transactions
- Clean up test data after each test

### Integration Testing

**API Endpoint Testing:**
- Test all CRUD operations with PostgreSQL
- Verify proper error handling
- Test foreign key relationships
- Validate JSON field operations

**Database Integration:**
- Test connection pool behavior
- Verify transaction handling
- Test concurrent operations
- Validate data consistency

### Migration Testing

**Data Integrity Verification:**
- Verify all data migrated correctly
- Test referential integrity
- Validate JSON field parsing
- Ensure no data loss during migration

## Migration Strategy

### Phase 1: Preparation
1. Ensure all data is migrated from MongoDB to PostgreSQL
2. Verify PostgreSQL models have feature parity with MongoDB models
3. Update all service and route imports to use PostgreSQL models
4. Run comprehensive tests to ensure functionality

### Phase 2: Code Cleanup
1. Remove all MongoDB model files
2. Rename PostgreSQL models (remove PG suffix)
3. Update all import statements throughout the codebase
4. Remove MongoDB dependencies from package.json

### Phase 3: Configuration Cleanup
1. Remove MongoDB connection logic from server.js
2. Clean up environment variables
3. Remove MongoDB-related scripts and files
4. Update documentation

### Phase 4: Verification
1. Run full test suite
2. Verify all API endpoints work correctly
3. Test application startup and shutdown
4. Validate production deployment readiness

## File Cleanup Plan

### Files to Delete
- All `.mongodb.js` files in root directory
- `migrate-mongo-to-postgres.js`
- `backend/src/models/User.js` (MongoDB version)
- `backend/src/models/Building.js` (MongoDB version)
- `backend/src/models/Equipment.js` (MongoDB version)
- `backend/src/models/Contact.js` (MongoDB version)
- `backend/src/models/CompanySettings.js` (MongoDB version)
- `backend/src/models/Meter.js` (MongoDB version)
- `backend/src/models/MeterReading.js` (MongoDB version)
- `backend/src/models/MeterData.js` (MongoDB version)
- `backend/src/models/Devices.js` (MongoDB version)

### Files to Rename
- `backend/src/models/UserPG.js` → `backend/src/models/User.js`
- `backend/src/models/BuildingPG.js` → `backend/src/models/Building.js`
- `backend/src/models/EquipmentPG.js` → `backend/src/models/Equipment.js`
- `backend/src/models/ContactPG.js` → `backend/src/models/Contact.js`
- `backend/src/models/EmailTemplatePG.js` → `backend/src/models/EmailTemplate.js`
- `backend/src/models/MeterPG.js` → `backend/src/models/Meter.js`
- `backend/src/models/MeterReadingPG.js` → `backend/src/models/MeterReading.js`

### Files to Update
- `package.json` - Remove mongoose dependency
- `backend/package.json` - Remove mongoose dependency
- `backend/src/server.js` - Remove MongoDB connection code
- All route files - Update model imports
- All service files - Update model imports
- All test files - Update model imports and setup

## Performance Considerations

### Database Optimization
- Maintain existing PostgreSQL indexes
- Optimize connection pool settings
- Implement proper query optimization
- Use prepared statements where appropriate

### Memory Usage
- Remove mongoose memory overhead
- Optimize PostgreSQL connection pooling
- Implement proper resource cleanup
- Monitor memory usage patterns

## Security Considerations

### Database Security
- Maintain PostgreSQL security best practices
- Use parameterized queries to prevent SQL injection
- Implement proper connection string security
- Maintain encrypted connections

### Authentication
- Keep existing bcrypt password hashing
- Maintain JWT token security
- Preserve role-based access control
- Ensure session management security

## Deployment Considerations

### Environment Variables
- Remove MongoDB-related environment variables
- Ensure PostgreSQL configuration is complete
- Update deployment scripts
- Verify production environment setup

### Backup and Recovery
- Implement PostgreSQL backup strategies
- Remove MongoDB backup procedures
- Update disaster recovery plans
- Test backup and restore procedures