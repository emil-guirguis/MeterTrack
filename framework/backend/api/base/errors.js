/**
 * Custom Error Classes for BaseModel
 * 
 * Provides specific error types for different database and validation scenarios.
 * These errors include additional context and are easier to handle in application code.
 */

/**
 * Base class for all model-related errors
 * Extends the native Error class with additional properties
 */
class ModelError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * ValidationError - Thrown when input validation fails
 * 
 * @example
 * throw new ValidationError('Field "name" is required', { field: 'name' });
 */
class ValidationError extends ModelError {
  constructor(message, details = {}) {
    super(message, details);
    this.statusCode = 400; // Bad Request
  }
}

/**
 * UniqueConstraintError - Thrown when a unique constraint is violated
 * 
 * @example
 * throw new UniqueConstraintError(
 *   'Meter ID already exists',
 *   { field: 'meterid', value: 'M001', constraint: 'meter_meterid_key' }
 * );
 */
class UniqueConstraintError extends ModelError {
  constructor(message, details = {}) {
    super(message, details);
    this.statusCode = 409; // Conflict
  }
}

/**
 * ForeignKeyError - Thrown when a foreign key constraint is violated
 * 
 * @example
 * throw new ForeignKeyError(
 *   'Referenced device does not exist',
 *   { field: 'device_id', value: 999, referencedTable: 'device' }
 * );
 */
class ForeignKeyError extends ModelError {
  constructor(message, details = {}) {
    super(message, details);
    this.statusCode = 400; // Bad Request
  }
}

/**
 * NotFoundError - Thrown when a requested record is not found
 * 
 * @example
 * throw new NotFoundError('Meter not found', { id: 5 });
 */
class NotFoundError extends ModelError {
  constructor(message, details = {}) {
    super(message, details);
    this.statusCode = 404; // Not Found
  }
}

/**
 * NotNullError - Thrown when a NOT NULL constraint is violated
 * 
 * @example
 * throw new NotNullError('Field "name" cannot be null', { field: 'name' });
 */
class NotNullError extends ModelError {
  constructor(message, details = {}) {
    super(message, details);
    this.statusCode = 400; // Bad Request
  }
}

/**
 * ConnectionError - Thrown when database connection fails
 * 
 * @example
 * throw new ConnectionError('Failed to connect to database', { host: 'localhost', port: 5432 });
 */
class ConnectionError extends ModelError {
  constructor(message, details = {}) {
    super(message, details);
    this.statusCode = 503; // Service Unavailable
  }
}

/**
 * ConfigurationError - Thrown when model configuration is invalid
 * 
 * @example
 * throw new ConfigurationError('tableName must be defined', { model: 'Meter' });
 */
class ConfigurationError extends ModelError {
  constructor(message, details = {}) {
    super(message, details);
    this.statusCode = 500; // Internal Server Error
  }
}

module.exports = {
  ModelError,
  ValidationError,
  UniqueConstraintError,
  ForeignKeyError,
  NotFoundError,
  NotNullError,
  ConnectionError,
  ConfigurationError
};
