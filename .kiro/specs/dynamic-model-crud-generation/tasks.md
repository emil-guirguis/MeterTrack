# Implementation Plan

- [x] 1. Create model helpers utility module





  - Create `framework/backend/shared/utils/modelHelpers.js` with field extraction and SQL generation utilities
  - Implement `extractFields()` to parse constructor and identify field definitions
  - Implement `buildInsertSQL()` for INSERT statement generation
  - Implement `buildSelectSQL()` for SELECT statement generation with WHERE, JOIN, ORDER BY, LIMIT
  - Implement `buildUpdateSQL()` for UPDATE statement generation
  - Implement `buildDeleteSQL()` for DELETE statement generation
  - Implement `buildWhereClause()` to support operators (eq, ne, gt, gte, lt, lte, like, in, between)
  - Implement `buildJoinClause()` for relationship JOIN generation
  - Implement type mapping functions (`mapColumnToProperty`, `mapPropertyToColumn`)
  - Implement validation and sanitization functions
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.4, 5.1, 5.2, 5.3, 5.4_

- [x] 2. Create BaseModel class





  - Create `framework/backend/api/base/BaseModel.js` as the core model class
  - Implement constructor that accepts data object and initializes instance
  - Implement static `_getFields()` method to extract and cache field metadata from constructor
  - Implement static configuration getters (`tableName`, `primaryKey`, `relationships`, `timestamps`)
  - Add validation to ensure `tableName` and `primaryKey` are defined in child classes
  - _Requirements: 1.1, 3.1, 3.2, 3.5_


- [x] 3. Implement static CRUD methods in BaseModel





- [x] 3.1 Implement `create()` method

  - Build INSERT query using `buildInsertSQL()` from modelHelpers
  - Execute parameterized query with sanitized values
  - Handle timestamp fields (created_at, updated_at) automatically
  - Map result row to model instance
  - Handle unique constraint violations (error code 23505)
  - Handle foreign key violations (error code 23503)
  - _Requirements: 1.2, 2.1, 2.3, 2.4, 7.1, 7.2_


- [x] 3.2 Implement `findById()` method

  - Build SELECT query with WHERE clause for primary key
  - Support optional `include` parameter for relationship loading
  - Execute query and map result to model instance
  - Return null if record not found
  - _Requirements: 1.3, 2.1, 6.1, 6.3_


- [x] 3.3 Implement `findOne()` method

  - Build SELECT query with custom WHERE conditions
  - Support filter operators through `buildWhereClause()`
  - Support optional `include` parameter for relationships
  - Return first matching record or null
  - _Requirements: 1.3, 2.1, 5.1, 5.4_

- [x] 3.4 Implement `findAll()` method


  - Build SELECT query with optional WHERE, ORDER BY, LIMIT, OFFSET clauses
  - Support filtering through `where` parameter
  - Support pagination through `limit` and `offset` parameters
  - Support sorting through `order` parameter
  - Support relationship loading through `include` parameter
  - Return array of model instances
  - Calculate and return pagination metadata (total count, page info)
  - _Requirements: 1.4, 2.1, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.3, 6.4_

- [x] 3.5 Implement `count()` and `exists()` methods


  - Implement `count()` to return total records matching conditions
  - Implement `exists()` to check if any records match conditions
  - Use efficient COUNT queries with WHERE clauses
  - _Requirements: 5.1, 5.4_


- [x] 4. Implement instance CRUD methods in BaseModel




- [x] 4.1 Implement `update()` instance method


  - Build UPDATE query for current instance using primary key
  - Only include provided fields in SET clause
  - Automatically update `updated_at` timestamp
  - Execute query and update current instance properties
  - Handle constraint violations
  - Return updated instance
  - _Requirements: 1.5, 2.1, 2.3, 7.1, 7.2_


- [x] 4.2 Implement `delete()` instance method


  - Build DELETE query using primary key
  - Execute query and return deleted record data
  - Handle foreign key constraint violations
  - _Requirements: 2.1, 7.2_

- [x] 4.3 Implement `save()` and `reload()` helper methods

  - Implement `save()` to create or update based on primary key presence
  - Implement `reload()` to refresh instance from database
  - _Requirements: 1.1, 2.1_

- [x] 5. Implement relationship support





  - Parse `relationships` static property in BaseModel
  - Implement JOIN generation for `belongsTo` relationships
  - Implement JOIN generation for `hasMany` relationships
  - Implement JOIN generation for `hasOne` relationships
  - Map joined data to nested objects in result instances
  - Support multiple relationship includes in single query
  - Support nested relationship loading (includes within includes)
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_


- [x] 6. Implement error handling and logging




  - Create custom error classes (ValidationError, UniqueConstraintError, ForeignKeyError, NotFoundError, NotNullError)
  - Implement error parsing for PostgreSQL error codes
  - Add error logging with query context for debugging
  - Implement validation for required fields before query execution
  - Implement connection error handling with descriptive messages
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 7. Implement type handling and data conversion






  - Implement JavaScript to PostgreSQL type mapping
  - Implement PostgreSQL to JavaScript type mapping
  - Handle JSONB serialization (JSON.stringify) for objects and arrays
  - Handle JSONB deserialization (JSON.parse) from database results
  - Handle Date conversion to ISO strings for database
  - Handle Date parsing from database timestamps
  - Handle null and undefined values consistently
  - _Requirements: 2.2, 2.5_


- [x] 8. Add database connection integration




  - Import and use existing PostgreSQL connection from `client/backend/src/config/database.js`
  - Provide `getDb()` static method for custom queries in child classes
  - Implement transaction support through database connection
  - Handle connection errors gracefully
  - _Requirements: 4.4, 7.4_




- [x] 9. Update framework exports




  - Export BaseModel from `framework/backend/api/base/index.js`


  - Export modelHelpers from `framework/backend/shared/utils/index.js`
  - Update `framework/backend/index.js` to include new exports
  - _Requirements: 1.1_


- [x] 10. Migrate Meter model to use BaseModel














  - Update `client/backend/src/models/Meter.js` to extend BaseModel

  - Keep only constructor with field definitions

  - Add static `tableName`, `primaryKey`, and `relationships` properties

  - Keep custom methods (`findByMeterId`, `getStats`, `fullLocation` getter)
  - Remove all generated CRUD methods (create, findById, findAll, update, delete)
  - Test all existing functionality still works
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 4.4_
-


- [x] 11. Update routes to work with new Meter model







  - Update `client/backend/src/routes/meters.js` to use new model methods
  - Verify all endpoints still function correctly
  - Test error handling for constraint violations
  - Test relationship loading (device, location)
  - _Requirements: 1.1, 6.1, 7.1, 7.2_


