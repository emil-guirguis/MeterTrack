/**
 * Error Handler for BaseModel
 * 
 * Parses PostgreSQL error codes and throws appropriate custom errors.
 * Provides detailed error messages with context for debugging.
 */

const {
  ValidationError,
  UniqueConstraintError,
  ForeignKeyError,
  NotFoundError,
  NotNullError,
  ConnectionError,
  ConfigurationError
} = require('./errors');

const { logDatabaseError } = require('../../shared/utils/logger');

/**
 * Parse PostgreSQL error and throw appropriate custom error
 * 
 * @param {Error} error - PostgreSQL error
 * @param {string} operation - Operation being performed (create, update, etc.)
 * @param {string} modelName - Name of the model class
 * @param {string} tableName - Database table name
 * @param {string} sql - SQL query that failed (optional)
 * @param {Array} params - Query parameters (optional)
 * @throws {ModelError} Appropriate custom error based on error code
 */
function handleDatabaseError(error, operation, modelName, tableName, sql = null, params = []) {
  // Log the error with full context
  logDatabaseError(operation, modelName, error, sql, params);
  
  // Handle connection errors
  if (isConnectionError(error)) {
    throw new ConnectionError(
      `Failed to connect to database: ${error.message}`,
      {
        operation,
        model: modelName,
        originalError: error.message
      }
    );
  }
  
  // Handle specific PostgreSQL error codes
  const errorCode = error.code;
  
  switch (errorCode) {
    case '23505': // Unique constraint violation
      throw parseUniqueConstraintError(error, modelName, tableName);
      
    case '23503': // Foreign key violation
      throw parseForeignKeyError(error, modelName, tableName);
      
    case '23502': // Not null violation
      throw parseNotNullError(error, modelName, tableName);
      
    case '42P01': // Undefined table
      throw new ConfigurationError(
        `Table '${tableName}' does not exist in the database`,
        {
          operation,
          model: modelName,
          tableName,
          errorCode
        }
      );
      
    case '42703': // Undefined column
      throw parseUndefinedColumnError(error, modelName, tableName);
      
    case '22P02': // Invalid text representation (type conversion error)
      throw parseTypeConversionError(error, modelName);
      
    case '23514': // Check constraint violation
      throw parseCheckConstraintError(error, modelName, tableName);
      
    case '08000': // Connection exception
    case '08003': // Connection does not exist
    case '08006': // Connection failure
      throw new ConnectionError(
        `Database connection error: ${error.message}`,
        {
          operation,
          model: modelName,
          errorCode,
          originalError: error.message
        }
      );
      
    default:
      // For unknown errors, throw a generic error with full context
      throw new Error(
        `Database error during ${operation} on ${modelName}: ${error.message}`
      );
  }
}

/**
 * Check if error is a connection error
 * 
 * @param {Error} error - Error object
 * @returns {boolean} True if connection error
 */
function isConnectionError(error) {
  const connectionErrorCodes = ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNRESET'];
  return connectionErrorCodes.includes(error.code) || 
         error.message.includes('connect') ||
         error.message.includes('connection');
}

/**
 * Parse unique constraint violation error
 * 
 * @param {Error} error - PostgreSQL error
 * @param {string} modelName - Model name
 * @param {string} tableName - Table name
 * @returns {UniqueConstraintError} Parsed error
 */
function parseUniqueConstraintError(error, modelName, tableName) {
  // Extract constraint details from error message
  // Format: Key (field)=(value) already exists
  const keyMatch = error.message.match(/Key \(([^)]+)\)=\(([^)]+)\)/);
  const constraintMatch = error.message.match(/constraint "([^"]+)"/);
  
  const field = keyMatch ? keyMatch[1] : 'unknown field';
  const value = keyMatch ? keyMatch[2] : 'unknown value';
  const constraint = constraintMatch ? constraintMatch[1] : 'unknown constraint';
  
  return new UniqueConstraintError(
    `Duplicate value: ${field} with value '${value}' already exists`,
    {
      model: modelName,
      tableName,
      field,
      value,
      constraint,
      errorCode: '23505'
    }
  );
}

/**
 * Parse foreign key constraint violation error
 * 
 * @param {Error} error - PostgreSQL error
 * @param {string} modelName - Model name
 * @param {string} tableName - Table name
 * @returns {ForeignKeyError} Parsed error
 */
function parseForeignKeyError(error, modelName, tableName) {
  // Extract foreign key details from error message
  // Format: Key (field)=(value) is not present in table "referenced_table"
  const keyMatch = error.message.match(/Key \(([^)]+)\)=\(([^)]+)\)/);
  const tableMatch = error.message.match(/table "([^"]+)"/);
  const constraintMatch = error.message.match(/constraint "([^"]+)"/);
  
  const field = keyMatch ? keyMatch[1] : 'unknown field';
  const value = keyMatch ? keyMatch[2] : 'unknown value';
  const referencedTable = tableMatch ? tableMatch[1] : 'unknown table';
  const constraint = constraintMatch ? constraintMatch[1] : 'unknown constraint';
  
  // Determine if this is an insert/update or delete violation
  const isDeleteViolation = error.message.includes('still referenced');
  
  if (isDeleteViolation) {
    return new ForeignKeyError(
      `Cannot delete: record is still referenced by ${referencedTable}`,
      {
        model: modelName,
        tableName,
        field,
        value,
        referencedTable,
        constraint,
        errorCode: '23503',
        violationType: 'delete'
      }
    );
  } else {
    return new ForeignKeyError(
      `Invalid reference: ${field} with value '${value}' does not exist in ${referencedTable}`,
      {
        model: modelName,
        tableName,
        field,
        value,
        referencedTable,
        constraint,
        errorCode: '23503',
        violationType: 'insert_update'
      }
    );
  }
}

/**
 * Parse not null constraint violation error
 * 
 * @param {Error} error - PostgreSQL error
 * @param {string} modelName - Model name
 * @param {string} tableName - Table name
 * @returns {NotNullError} Parsed error
 */
function parseNotNullError(error, modelName, tableName) {
  // Extract field name from error message
  // Format: null value in column "field" violates not-null constraint
  const fieldMatch = error.message.match(/column "([^"]+)"/);
  const field = fieldMatch ? fieldMatch[1] : 'unknown field';
  
  return new NotNullError(
    `Required field missing: '${field}' cannot be null`,
    {
      model: modelName,
      tableName,
      field,
      errorCode: '23502'
    }
  );
}

/**
 * Parse undefined column error
 * 
 * @param {Error} error - PostgreSQL error
 * @param {string} modelName - Model name
 * @param {string} tableName - Table name
 * @returns {ConfigurationError} Parsed error
 */
function parseUndefinedColumnError(error, modelName, tableName) {
  // Extract column name from error message
  const columnMatch = error.message.match(/column "([^"]+)"/);
  const column = columnMatch ? columnMatch[1] : 'unknown column';
  
  return new ConfigurationError(
    `Column '${column}' does not exist in table '${tableName}'`,
    {
      model: modelName,
      tableName,
      column,
      errorCode: '42703'
    }
  );
}

/**
 * Parse type conversion error
 * 
 * @param {Error} error - PostgreSQL error
 * @param {string} modelName - Model name
 * @returns {ValidationError} Parsed error
 */
function parseTypeConversionError(error, modelName) {
  // Extract type information from error message
  const typeMatch = error.message.match(/invalid input syntax for (?:type )?(\w+)/);
  const type = typeMatch ? typeMatch[1] : 'unknown type';
  
  return new ValidationError(
    `Invalid data type: cannot convert value to ${type}`,
    {
      model: modelName,
      expectedType: type,
      errorCode: '22P02',
      originalError: error.message
    }
  );
}

/**
 * Parse check constraint violation error
 * 
 * @param {Error} error - PostgreSQL error
 * @param {string} modelName - Model name
 * @param {string} tableName - Table name
 * @returns {ValidationError} Parsed error
 */
function parseCheckConstraintError(error, modelName, tableName) {
  // Extract constraint name from error message
  const constraintMatch = error.message.match(/constraint "([^"]+)"/);
  const constraint = constraintMatch ? constraintMatch[1] : 'unknown constraint';
  
  return new ValidationError(
    `Check constraint violation: ${constraint}`,
    {
      model: modelName,
      tableName,
      constraint,
      errorCode: '23514',
      originalError: error.message
    }
  );
}

/**
 * Validate required fields before query execution
 * Throws ValidationError if any required fields are missing
 * 
 * @param {Object} data - Data to validate
 * @param {Array} requiredFields - Array of required field names
 * @param {string} modelName - Model name for error context
 * @throws {ValidationError} If required fields are missing
 */
function validateRequiredFields(data, requiredFields, modelName) {
  const missingFields = [];
  
  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null) {
      missingFields.push(field);
    }
  }
  
  if (missingFields.length > 0) {
    throw new ValidationError(
      `Required fields missing: ${missingFields.join(', ')}`,
      {
        model: modelName,
        missingFields,
        providedFields: Object.keys(data)
      }
    );
  }
}

/**
 * Validate field types before query execution
 * Throws ValidationError if any field has an invalid type
 * 
 * @param {Object} data - Data to validate
 * @param {Array} fields - Array of field metadata objects
 * @param {string} modelName - Model name for error context
 * @throws {ValidationError} If field types are invalid
 */
function validateFieldTypes(data, fields, modelName) {
  const invalidFields = [];
  
  for (const field of fields) {
    const value = data[field.name];
    
    // Skip undefined values (they're optional)
    if (value === undefined) {
      continue;
    }
    
    // Skip null values (they'll be caught by NOT NULL constraints if needed)
    if (value === null) {
      continue;
    }
    
    // Check type based on field metadata
    if (field.type && !isValidType(value, field.type)) {
      invalidFields.push({
        field: field.name,
        expectedType: field.type,
        actualType: typeof value,
        value
      });
    }
  }
  
  if (invalidFields.length > 0) {
    const fieldNames = invalidFields.map(f => f.field).join(', ');
    throw new ValidationError(
      `Invalid field types: ${fieldNames}`,
      {
        model: modelName,
        invalidFields
      }
    );
  }
}

/**
 * Check if value matches expected type
 * 
 * @param {*} value - Value to check
 * @param {string} expectedType - Expected type
 * @returns {boolean} True if type matches
 */
function isValidType(value, expectedType) {
  const actualType = typeof value;
  
  switch (expectedType) {
    case 'string':
      return actualType === 'string';
    case 'number':
      return actualType === 'number' && !isNaN(value);
    case 'boolean':
      return actualType === 'boolean';
    case 'object':
      return actualType === 'object' && value !== null;
    case 'array':
      return Array.isArray(value);
    case 'date':
      return value instanceof Date || (actualType === 'string' && !isNaN(Date.parse(value)));
    default:
      return true; // Unknown type, allow it
  }
}

module.exports = {
  handleDatabaseError,
  validateRequiredFields,
  validateFieldTypes,
  isConnectionError
};
