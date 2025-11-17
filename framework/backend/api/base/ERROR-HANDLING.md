# Error Handling and Logging

This document describes the error handling and logging system implemented in the BaseModel framework.

## Overview

The BaseModel framework includes a comprehensive error handling system that:
- Parses PostgreSQL error codes and throws appropriate custom errors
- Provides detailed error messages with context for debugging
- Validates data before query execution
- Logs all database operations and errors with structured context
- Includes HTTP status codes for easy API integration

## Custom Error Classes

All custom errors extend the base `ModelError` class and include:
- Descriptive error messages
- Additional context in the `details` property
- HTTP status codes for API responses
- Proper stack traces

### Available Error Classes

#### ValidationError
Thrown when input validation fails before query execution.

**Status Code:** 400 (Bad Request)

**Example:**
```javascript
throw new ValidationError('Field "name" is required', { field: 'name' });
```

#### UniqueConstraintError
Thrown when a unique constraint is violated (PostgreSQL error code 23505).

**Status Code:** 409 (Conflict)

**Example:**
```javascript
throw new UniqueConstraintError(
  'Duplicate value: meterid with value "M001" already exists',
  { field: 'meterid', value: 'M001', constraint: 'meter_meterid_key' }
);
```

#### ForeignKeyError
Thrown when a foreign key constraint is violated (PostgreSQL error code 23503).

**Status Code:** 400 (Bad Request)

**Example:**
```javascript
throw new ForeignKeyError(
  'Invalid reference: device_id with value "999" does not exist in device',
  { field: 'device_id', value: 999, referencedTable: 'device' }
);
```

#### NotFoundError
Thrown when a requested record is not found.

**Status Code:** 404 (Not Found)

**Example:**
```javascript
throw new NotFoundError('Meter not found', { id: 5 });
```

#### NotNullError
Thrown when a NOT NULL constraint is violated (PostgreSQL error code 23502).

**Status Code:** 400 (Bad Request)

**Example:**
```javascript
throw new NotNullError('Required field missing: "name" cannot be null', { field: 'name' });
```

#### ConnectionError
Thrown when database connection fails.

**Status Code:** 503 (Service Unavailable)

**Example:**
```javascript
throw new ConnectionError('Failed to connect to database', { host: 'localhost', port: 5432 });
```

#### ConfigurationError
Thrown when model configuration is invalid (e.g., missing tableName or primaryKey).

**Status Code:** 500 (Internal Server Error)

**Example:**
```javascript
throw new ConfigurationError('tableName must be defined', { model: 'Meter' });
```

## Error Handler

The `errorHandler` module provides utilities for parsing PostgreSQL errors and validating data.

### handleDatabaseError(error, operation, modelName, tableName, sql, params)

Parses PostgreSQL error codes and throws appropriate custom errors.

**Supported PostgreSQL Error Codes:**
- `23505` - Unique constraint violation → UniqueConstraintError
- `23503` - Foreign key violation → ForeignKeyError
- `23502` - Not null violation → NotNullError
- `23514` - Check constraint violation → ValidationError
- `42P01` - Undefined table → ConfigurationError
- `42703` - Undefined column → ConfigurationError
- `22P02` - Invalid type conversion → ValidationError
- `08000`, `08003`, `08006` - Connection errors → ConnectionError

**Example:**
```javascript
try {
  await db.query(sql, values);
} catch (error) {
  handleDatabaseError(error, 'create', 'Meter', 'meter', sql, values);
}
```

### validateRequiredFields(data, requiredFields, modelName)

Validates that all required fields are present in the data object.

**Example:**
```javascript
const data = { name: 'Test Meter' };
const requiredFields = ['name', 'meterid'];
validateRequiredFields(data, requiredFields, 'Meter');
// Throws: ValidationError: Required fields missing: meterid
```

### validateFieldTypes(data, fields, modelName)

Validates that field values match their expected types.

**Supported Types:**
- `string` - JavaScript string
- `number` - JavaScript number (not NaN)
- `boolean` - JavaScript boolean
- `object` - JavaScript object (not null)
- `array` - JavaScript array
- `date` - Date object or valid date string

**Example:**
```javascript
const data = { name: 'Test Meter', port: 'invalid' };
const fields = [
  { name: 'name', type: 'string' },
  { name: 'port', type: 'number' }
];
validateFieldTypes(data, fields, 'Meter');
// Throws: ValidationError: Invalid field types: port
```

## Logger

The `logger` module provides structured logging for database operations and errors.

### Log Levels

- `ERROR` - Error messages with full context
- `WARN` - Warning messages
- `INFO` - Informational messages
- `DEBUG` - Debug messages (only when DEBUG env var is set)

### Logger Functions

#### logError(message, error, context)

Logs an error with full context including error message, code, and stack trace.

**Example:**
```javascript
logError('Database error during create', error, {
  operation: 'create',
  model: 'Meter',
  sql: 'INSERT INTO meter...',
  params: ['M001', 'Main Meter']
});
```

#### logWarn(message, context)

Logs a warning message with context.

**Example:**
```javascript
logWarn('Validation warning', { field: 'name', value: null });
```

#### logInfo(message, context)

Logs an informational message with context.

**Example:**
```javascript
logInfo('Record created successfully', { model: 'Meter', id: 5 });
```

#### logDebug(message, context)

Logs a debug message (only when `DEBUG` environment variable is set).

**Example:**
```javascript
logDebug('Field extraction completed', { model: 'Meter', fieldCount: 15 });
```

#### logQuery(operation, model, sql, params)

Logs a database query for debugging (only when `DEBUG_SQL` environment variable is set).

**Example:**
```javascript
logQuery('create', 'Meter', 'INSERT INTO meter...', ['M001', 'Main Meter']);
```

#### logDatabaseError(operation, model, error, sql, params)

Logs a database error with full query context.

**Example:**
```javascript
logDatabaseError('create', 'Meter', error, 'INSERT INTO meter...', ['M001']);
```

## Usage in BaseModel

The BaseModel automatically uses the error handling and logging system:

### Automatic Error Parsing

All database operations automatically parse PostgreSQL errors:

```javascript
try {
  const meter = await Meter.create({ meterid: 'M001', name: 'Main Meter' });
} catch (error) {
  // error is a custom error (e.g., UniqueConstraintError)
  console.log(error.message); // "Duplicate value: meterid with value 'M001' already exists"
  console.log(error.statusCode); // 409
  console.log(error.details); // { field: 'meterid', value: 'M001', ... }
}
```

### Automatic Validation

Field types are validated before query execution:

```javascript
try {
  const meter = await Meter.create({ meterid: 'M001', port: 'invalid' });
} catch (error) {
  // error is a ValidationError
  console.log(error.message); // "Invalid field types: port"
  console.log(error.details.invalidFields); // [{ field: 'port', expectedType: 'number', ... }]
}
```

### Automatic Logging

All database operations are logged with context:

```javascript
// Enable SQL query logging
process.env.DEBUG_SQL = 'true';

const meter = await Meter.create({ meterid: 'M001', name: 'Main Meter' });
// Logs: [DEBUG] Database query: create
//   Context: { model: 'Meter', sql: 'INSERT INTO meter...', params: [...] }
```

## Error Handling in Routes

Use the custom errors in your route handlers:

```javascript
const { NotFoundError, ValidationError } = require('../../../../framework/backend/api/base');

router.get('/:id', async (req, res) => {
  try {
    const meter = await Meter.findById(req.params.id);
    
    if (!meter) {
      throw new NotFoundError('Meter not found', { id: req.params.id });
    }
    
    res.json(meter);
  } catch (error) {
    // Use statusCode from custom errors
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      error: error.message,
      details: error.details
    });
  }
});
```

## Environment Variables

- `DEBUG` - Enable debug logging
- `DEBUG_SQL` - Enable SQL query logging

**Example:**
```bash
DEBUG=true DEBUG_SQL=true node server.js
```

## Testing

Run the error handling test suite:

```bash
node framework/backend/api/base/test-error-handling.js
```

This will test:
- All custom error classes
- PostgreSQL error parsing
- Validation functions
- Logger functions

## Best Practices

1. **Always catch errors in routes** - Use try-catch blocks and return appropriate HTTP status codes
2. **Use custom errors** - Throw custom errors instead of generic Error objects
3. **Include context** - Always include relevant context in error details
4. **Log errors** - The framework logs automatically, but you can add custom logging
5. **Validate early** - Validate input before database operations when possible
6. **Handle specific errors** - Catch specific error types for different handling logic

**Example:**
```javascript
try {
  const meter = await Meter.create(data);
  res.status(201).json(meter);
} catch (error) {
  if (error instanceof UniqueConstraintError) {
    // Handle duplicate records
    res.status(error.statusCode).json({ error: error.message });
  } else if (error instanceof ValidationError) {
    // Handle validation errors
    res.status(error.statusCode).json({ error: error.message, details: error.details });
  } else {
    // Handle other errors
    res.status(500).json({ error: 'Internal server error' });
  }
}
```
