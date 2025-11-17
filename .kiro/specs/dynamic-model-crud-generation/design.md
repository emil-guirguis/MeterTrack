# Design Document: Dynamic Model CRUD Generation

## Overview

This design extends the existing backend API framework to provide a `BaseModel` class that automatically generates CRUD operations based on model field definitions. Client models will only need to define their structure through a constructor, while the framework handles all database operations dynamically.

The design leverages JavaScript's reflection capabilities to extract field definitions from model constructors and generate SQL statements at runtime, eliminating the need for repetitive CRUD method implementations.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Application                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  client/backend/src/models/Meter.js                  │   │
│  │  - Constructor with field definitions only           │   │
│  │  - Static tableName and primaryKey                   │   │
│  │  - Optional custom methods                           │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↓ extends                           │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│              Framework (framework/backend/)                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  api/base/BaseModel.js                               │   │
│  │  - Field extraction from constructor                 │   │
│  │  - Dynamic SQL generation                            │   │
│  │  - CRUD method generation                            │   │
│  │  - Relationship handling                             │   │
│  │  - Error handling                                    │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↓ uses                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  shared/utils/modelHelpers.js                        │   │
│  │  - Field extraction utilities                        │   │
│  │  - SQL builder utilities                             │   │
│  │  - Type mapping utilities                            │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                PostgreSQL Database                           │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

```
1. Model Definition (Client)
   ↓
2. BaseModel Constructor (Framework)
   ↓
3. Field Extraction (modelHelpers)
   ↓
4. Method Generation (BaseModel)
   ↓
5. SQL Execution (Database)
   ↓
6. Result Mapping (BaseModel)
   ↓
7. Return to Client
```

## Components and Interfaces

### 1. BaseModel Class

**Location:** `framework/backend/api/base/BaseModel.js`

**Purpose:** Core class that provides dynamic CRUD generation for all models

**Key Methods:**

```javascript
class BaseModel {
  constructor(data = {}) {
    // Initialize instance with data
    // Extract fields from constructor for metadata
  }

  // Static methods (class-level operations)
  static async create(data) { }
  static async findById(id, options = {}) { }
  static async findOne(where, options = {}) { }
  static async findAll(options = {}) { }
  static async count(where = {}) { }
  static async exists(where) { }
  
  // Instance methods (record-level operations)
  async update(data) { }
  async delete() { }
  async save() { }
  async reload() { }
  
  // Helper methods
  static _getFields() { }
  static _buildInsertQuery(data) { }
  static _buildSelectQuery(options) { }
  static _buildUpdateQuery(data, where) { }
  static _buildDeleteQuery(where) { }
  static _buildWhereClause(conditions) { }
  static _buildJoinClause(includes) { }
  static _mapResultToInstance(row) { }
  
  // Configuration (must be overridden by child classes)
  static get tableName() { throw new Error('tableName must be defined'); }
  static get primaryKey() { return 'id'; }
  static get relationships() { return {}; }
  static get timestamps() { return true; }
}
```

### 2. Model Helpers Utility

**Location:** `framework/backend/shared/utils/modelHelpers.js`

**Purpose:** Utility functions for field extraction and SQL generation

**Key Functions:**

```javascript
// Extract field definitions from constructor
function extractFields(ModelClass) {
  // Parse constructor to identify field assignments
  // Return array of field metadata
}

// Build SQL INSERT statement
function buildInsertSQL(tableName, fields, data) {
  // Generate INSERT INTO ... VALUES ... RETURNING *
}

// Build SQL SELECT statement
function buildSelectSQL(tableName, fields, options) {
  // Generate SELECT ... FROM ... WHERE ... ORDER BY ... LIMIT ...
}

// Build SQL UPDATE statement
function buildUpdateSQL(tableName, fields, data, where) {
  // Generate UPDATE ... SET ... WHERE ... RETURNING *
}

// Build SQL DELETE statement
function buildDeleteSQL(tableName, where) {
  // Generate DELETE FROM ... WHERE ... RETURNING *
}

// Build WHERE clause from conditions object
function buildWhereClause(conditions, paramOffset = 0) {
  // Support operators: eq, ne, gt, gte, lt, lte, like, in, between
  // Return { clause, values }
}

// Build JOIN clause for relationships
function buildJoinClause(relationships, includes) {
  // Generate LEFT JOIN ... ON ...
}

// Map database column names to JavaScript property names
function mapColumnToProperty(columnName) {
  // Handle snake_case to camelCase conversion
}

// Map JavaScript property names to database column names
function mapPropertyToColumn(propertyName) {
  // Handle camelCase to snake_case conversion
}

// Validate field data types
function validateFieldType(field, value) {
  // Check if value matches expected type
}

// Sanitize field values
function sanitizeValue(value) {
  // Prevent SQL injection
}
```

### 3. Client Model Example

**Location:** `client/backend/src/models/Meter.js`

**Purpose:** Example of simplified model using BaseModel

```javascript
const BaseModel = require('../../../../framework/backend/api/base/BaseModel');

class Meter extends BaseModel {
  constructor(meterData = {}) {
    super(meterData);
    
    // Field definitions only
    this.id = meterData.id;
    this.meterid = meterData.meterid;
    this.name = meterData.name;
    this.type = meterData.type;
    this.port = meterData.port;
    this.protocal = meterData.protocal;
    this.device_id = meterData.device_id;
    this.serial_number = meterData.serial_number;
    this.installation_date = meterData.installation_date;
    this.last_reading_date = meterData.last_reading_date;
    this.status = meterData.status || 'online';
    this.location_id = meterData.location_id;
    this.unit_of_measurement = meterData.unit_of_measurement;
    this.notes = meterData.notes;
    this.register_map = meterData.register_map;
    this.created_at = meterData.created_at;
    this.updated_at = meterData.updated_at;
  }

  // Configuration
  static get tableName() {
    return 'meter';
  }

  static get primaryKey() {
    return 'id';
  }

  static get relationships() {
    return {
      device: {
        type: 'belongsTo',
        model: 'Device',
        foreignKey: 'device_id',
        targetKey: 'id'
      },
      location: {
        type: 'belongsTo',
        model: 'Location',
        foreignKey: 'location_id',
        targetKey: 'id'
      }
    };
  }

  // Optional custom methods
  static async findByMeterId(meterid) {
    return this.findOne({ meterid });
  }

  static async getStats() {
    const db = require('../config/database');
    const query = `
      SELECT
        COUNT(*) as total_meters,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_meters
      FROM ${this.tableName}
    `;
    const result = await db.query(query);
    return result.rows[0];
  }

  get fullLocation() {
    return [this.location_location, this.location_floor, this.location_room]
      .filter(Boolean)
      .join(', ');
  }
}

module.exports = Meter;
```

## Data Models

### Field Metadata Structure

```javascript
{
  name: 'meterid',           // JavaScript property name
  column: 'meterid',         // Database column name
  type: 'string',            // JavaScript type
  sqlType: 'VARCHAR',        // SQL type
  nullable: true,            // Can be null
  defaultValue: null,        // Default value
  isPrimaryKey: false,       // Is primary key
  isForeignKey: false,       // Is foreign key
  isTimestamp: false         // Is created_at/updated_at
}
```

### Relationship Configuration

```javascript
{
  device: {
    type: 'belongsTo',       // belongsTo, hasMany, hasOne
    model: 'Device',         // Related model name
    foreignKey: 'device_id', // Foreign key in this table
    targetKey: 'id',         // Primary key in related table
    as: 'device'             // Alias for joined data
  }
}
```

### Query Options Structure

```javascript
{
  where: {                   // Filter conditions
    status: 'active',
    type: { in: ['electric', 'gas'] },
    created_at: { gte: '2024-01-01' }
  },
  include: ['device', 'location'], // Relationships to join
  order: [['name', 'ASC']],  // Sort order
  limit: 10,                 // Page size
  offset: 0,                 // Skip records
  attributes: ['id', 'name'] // Select specific fields
}
```

## Implementation Details

### Field Extraction Strategy

The framework will extract fields from the constructor using the following approach:

1. **Parse Constructor Source:**
   - Use `Function.prototype.toString()` to get constructor source code
   - Parse assignments like `this.fieldName = data.fieldName`
   - Extract field names and default values

2. **Cache Field Metadata:**
   - Store extracted fields in a static property `_fields`
   - Only extract once per model class
   - Include type information inferred from default values

3. **Handle Special Fields:**
   - Automatically detect `id`, `created_at`, `updated_at`
   - Identify foreign keys by `_id` suffix
   - Recognize JSONB fields by naming convention

### SQL Generation Strategy

#### INSERT Statement

```javascript
// Input: { meterid: 'M001', name: 'Main Meter', type: 'electric' }
// Output:
INSERT INTO meter (meterid, name, type, created_at, updated_at)
VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
RETURNING *
// Params: ['M001', 'Main Meter', 'electric']
```

#### SELECT Statement

```javascript
// Input: { where: { status: 'active' }, include: ['device'], limit: 10 }
// Output:
SELECT m.*, d.manufacturer as device_name
FROM meter m
LEFT JOIN device d ON m.device_id = d.id
WHERE m.status = $1
ORDER BY m.created_at DESC
LIMIT $2
// Params: ['active', 10]
```

#### UPDATE Statement

```javascript
// Input: id=5, { name: 'Updated Name', status: 'inactive' }
// Output:
UPDATE meter
SET name = $1, status = $2, updated_at = CURRENT_TIMESTAMP
WHERE id = $3
RETURNING *
// Params: ['Updated Name', 'inactive', 5]
```

#### DELETE Statement

```javascript
// Input: id=5
// Output:
DELETE FROM meter
WHERE id = $1
RETURNING *
// Params: [5]
```

### Relationship Handling

The framework will support three relationship types:

1. **belongsTo:** Foreign key in current table
   ```javascript
   // Meter belongsTo Device
   LEFT JOIN device d ON m.device_id = d.id
   ```

2. **hasMany:** Foreign key in related table
   ```javascript
   // Device hasMany Meters
   LEFT JOIN meter m ON d.id = m.device_id
   ```

3. **hasOne:** Foreign key in related table (limit 1)
   ```javascript
   // User hasOne Profile
   LEFT JOIN profile p ON u.id = p.user_id
   ```

### Type Mapping

| JavaScript Type | PostgreSQL Type | Handling |
|----------------|-----------------|----------|
| string | VARCHAR/TEXT | Direct mapping |
| number | INTEGER/NUMERIC | Direct mapping |
| boolean | BOOLEAN | Direct mapping |
| Date | TIMESTAMP | Convert to ISO string |
| Object | JSONB | JSON.stringify/parse |
| Array | JSONB | JSON.stringify/parse |
| null | NULL | Direct mapping |
| undefined | NULL | Convert to null |

## Error Handling

### Error Types and Responses

1. **Configuration Errors:**
   ```javascript
   throw new Error('tableName must be defined in model class');
   throw new Error('primaryKey must be defined in model class');
   ```

2. **Validation Errors:**
   ```javascript
   throw new ValidationError('Field "meterid" is required');
   throw new ValidationError('Field "type" must be a string');
   ```

3. **Database Errors:**
   ```javascript
   // Unique constraint violation (code 23505)
   throw new UniqueConstraintError('Meter ID already exists');
   
   // Foreign key violation (code 23503)
   throw new ForeignKeyError('Referenced device does not exist');
   
   // Not null violation (code 23502)
   throw new NotNullError('Field "name" cannot be null');
   ```

4. **Not Found Errors:**
   ```javascript
   throw new NotFoundError('Meter with id 5 not found');
   ```

### Error Handling Flow

```
1. Validate input data
   ↓ (if invalid)
2. Throw ValidationError
   ↓ (if valid)
3. Build SQL query
   ↓
4. Execute query
   ↓ (if database error)
5. Parse error code
   ↓
6. Throw specific error type
   ↓
7. Log error with context
   ↓
8. Return error response
```

## Testing Strategy

### Unit Tests

1. **Field Extraction Tests:**
   - Test extraction from simple constructors
   - Test extraction with default values
   - Test extraction with complex types (JSONB)
   - Test caching of extracted fields

2. **SQL Generation Tests:**
   - Test INSERT statement generation
   - Test SELECT statement generation with filters
   - Test UPDATE statement generation
   - Test DELETE statement generation
   - Test JOIN clause generation
   - Test WHERE clause generation with operators

3. **Type Mapping Tests:**
   - Test JavaScript to SQL type conversion
   - Test SQL to JavaScript type conversion
   - Test JSONB serialization/deserialization
   - Test Date handling

4. **Error Handling Tests:**
   - Test configuration error detection
   - Test validation error handling
   - Test database error parsing
   - Test error logging

### Integration Tests

1. **CRUD Operation Tests:**
   - Test create with valid data
   - Test create with invalid data
   - Test findById with existing record
   - Test findById with non-existent record
   - Test findAll with filters
   - Test findAll with pagination
   - Test update with valid data
   - Test delete operation

2. **Relationship Tests:**
   - Test belongsTo relationship loading
   - Test hasMany relationship loading
   - Test nested relationship loading
   - Test relationship filtering

3. **Custom Method Tests:**
   - Test custom static methods
   - Test custom instance methods
   - Test access to database connection

### Performance Tests

1. **Query Performance:**
   - Benchmark field extraction overhead
   - Benchmark SQL generation time
   - Compare with hand-written queries
   - Test with large datasets

2. **Memory Usage:**
   - Test field metadata caching
   - Test instance creation overhead
   - Test memory leaks

## Migration Strategy

### Phase 1: Framework Implementation
1. Create BaseModel class
2. Create modelHelpers utility
3. Add comprehensive tests
4. Document usage patterns

### Phase 2: Pilot Migration
1. Migrate one simple model (e.g., Location)
2. Verify functionality
3. Measure performance
4. Gather feedback

### Phase 3: Full Migration
1. Migrate remaining models (Meter, Device, Contact, User)
2. Update routes to use new models
3. Remove old CRUD methods
4. Update documentation

### Phase 4: Optimization
1. Profile performance
2. Optimize SQL generation
3. Add query caching if needed
4. Fine-tune error handling

## Security Considerations

1. **SQL Injection Prevention:**
   - Always use parameterized queries
   - Never concatenate user input into SQL
   - Sanitize all field values

2. **Input Validation:**
   - Validate field types before query execution
   - Check for required fields
   - Enforce field constraints

3. **Access Control:**
   - Integrate with existing authentication middleware
   - Support row-level security through WHERE clauses
   - Log all database operations

4. **Data Sanitization:**
   - Escape special characters in string fields
   - Validate JSONB structure
   - Prevent prototype pollution

## Performance Considerations

1. **Field Extraction Caching:**
   - Extract fields once per model class
   - Store in static property
   - Reuse across all instances

2. **Query Optimization:**
   - Use indexes for foreign keys
   - Limit SELECT fields when possible
   - Use EXPLAIN ANALYZE for complex queries

3. **Connection Pooling:**
   - Reuse existing PostgreSQL pool
   - Configure appropriate pool size
   - Handle connection errors gracefully

4. **Result Mapping:**
   - Minimize object creation overhead
   - Use efficient property assignment
   - Cache relationship mappings

## Future Enhancements

1. **Query Builder:**
   - Fluent API for complex queries
   - Support for subqueries
   - Support for aggregations

2. **Migrations:**
   - Auto-generate migrations from model changes
   - Schema synchronization
   - Version control for database schema

3. **Validation:**
   - Declarative validation rules
   - Custom validators
   - Async validation support

4. **Hooks:**
   - beforeCreate, afterCreate
   - beforeUpdate, afterUpdate
   - beforeDelete, afterDelete

5. **Soft Deletes:**
   - Automatic deleted_at timestamp
   - Filter out soft-deleted records
   - Restore functionality

6. **Caching:**
   - Query result caching
   - Model instance caching
   - Cache invalidation strategies
