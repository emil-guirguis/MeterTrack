/**
 * BaseModel - Core model class for dynamic CRUD generation
 * 
 * Provides automatic CRUD operations based on model field definitions.
 * Child classes only need to define their structure through a constructor
 * and provide static configuration properties.
 * 
 * @example
 * class Meter extends BaseModel {
 *   constructor(data = {}) {
 *     super(data);
 *     this.id = data.id;
 *     this.meterid = data.meterid;
 *     this.name = data.name;
 *   }
 * 
 *   static get tableName() { return 'meter'; }
 *   static get primaryKey() { return 'id'; }
 * }
 */

const { 
  extractFields,
  buildInsertSQL,
  buildSelectSQL,
  buildUpdateSQL,
  buildDeleteSQL,
  buildWhereClause,
  buildJoinClause,
  mapJoinedResults,
  deserializeRow
} = require('../../shared/utils/modelHelpers');

const {
  handleDatabaseError,
  validateRequiredFields,
  validateFieldTypes
} = require('./errorHandler');

const {
  ConfigurationError,
  NotFoundError
} = require('./errors');

const { logQuery } = require('../../shared/utils/logger');

class BaseModel {
  /**
   * Constructor - Initialize model instance with data
   * 
   * @param {Object} data - Initial data for the model instance
   */
  constructor(data = {}) {
    // Initialize instance with provided data
    // Child classes will define their own fields
    // This base constructor just ensures the pattern is followed
    
    // Note: Field extraction is deferred until first use of _getFields()
    // This allows child class constructors to complete before validation
  }

  /**
   * Extract and cache field metadata from constructor
   * Uses the modelHelpers.extractFields utility to parse the constructor
   * and identify field definitions
   * 
   * @returns {Array<Object>} Array of field metadata objects
   * @private
   */
  static _getFields() {
    // Check if fields are already cached
    if (this._fields) {
      return this._fields;
    }

    // Validate that required configuration is defined
    this._validateConfiguration();

    // Extract fields from constructor using modelHelpers
    this._fields = extractFields(this);

    return this._fields;
  }

  /**
   * Validate that required configuration properties are defined
   * Throws descriptive errors if tableName or primaryKey are missing
   * 
   * @throws {ConfigurationError} If tableName is not defined
   * @throws {ConfigurationError} If primaryKey is not defined
   * @private
   */
  static _validateConfiguration() {
    // Skip validation if this is the BaseModel class itself
    if (this === BaseModel) {
      return;
    }

    // Check tableName - try to access it and catch the error
    try {
      const tableName = this.tableName;
      if (!tableName) {
        throw new Error('tableName is empty');
      }
    } catch (error) {
      throw new ConfigurationError(
        `tableName must be defined in ${this.name} model class. ` +
        `Add: static get tableName() { return 'your_table_name'; }`,
        { model: this.name }
      );
    }

    // Check primaryKey - try to access it and catch the error
    try {
      const primaryKey = this.primaryKey;
      if (!primaryKey) {
        throw new Error('primaryKey is empty');
      }
    } catch (error) {
      throw new ConfigurationError(
        `primaryKey must be defined in ${this.name} model class. ` +
        `Add: static get primaryKey() { return 'id'; }`,
        { model: this.name }
      );
    }
  }

  /**
   * Get the table name for this model
   * MUST be overridden by child classes
   * 
   * @returns {string} The database table name
   * @throws {ConfigurationError} If not overridden in child class
   */
  static get tableName() {
    throw new ConfigurationError(
      `tableName must be defined in ${this.name} model class. ` +
      `Add: static get tableName() { return 'your_table_name'; }`,
      { model: this.name }
    );
  }

  /**
   * Get the primary key field name for this model
   * MUST be overridden by child classes
   * Defaults to 'id' if not specified
   * 
   * @returns {string} The primary key field name
   * @throws {ConfigurationError} If not overridden in child class
   */
  static get primaryKey() {
    throw new ConfigurationError(
      `primaryKey must be defined in ${this.name} model class. ` +
      `Add: static get primaryKey() { return 'id'; }`,
      { model: this.name }
    );
  }

  /**
   * Get relationship configuration for this model
   * Can be overridden by child classes to define relationships
   * 
   * @returns {Object} Relationship configuration object
   * @example
   * static get relationships() {
   *   return {
   *     device: {
   *       type: 'belongsTo',
   *       model: 'Device',
   *       foreignKey: 'device_id',
   *       targetKey: 'id'
   *     }
   *   };
   * }
   */
  static get relationships() {
    return {};
  }

  /**
   * Get timestamp configuration for this model
   * Determines if created_at and updated_at should be automatically managed
   * 
   * @returns {boolean} True if timestamps should be managed automatically
   */
  static get timestamps() {
    return true;
  }

  /**
   * Get database connection
   * Provides access to the database for executing queries
   * 
   * @returns {Object} Database connection instance
   * @private
   */
  static _getDb() {
    // Import database connection (lazy load to avoid circular dependencies)
    if (!this._db) {
      this._db = require('../../../../client/backend/src/config/database');
    }
    return this._db;
  }

  /**
   * Get database connection for custom queries in child classes
   * This is the public API for accessing the database connection
   * 
   * @returns {Object} Database connection instance with query() and transaction() methods
   * 
   * @example
   * // In a child class custom method
   * static async getStats() {
   *   const db = this.getDb();
   *   const result = await db.query('SELECT COUNT(*) FROM meter');
   *   return result.rows[0];
   * }
   */
  static getDb() {
    return this._getDb();
  }

  /**
   * Execute a function within a database transaction
   * Automatically handles BEGIN, COMMIT, and ROLLBACK
   * 
   * @param {Function} callback - Async function that receives a database client
   * @returns {Promise<*>} Result from the callback function
   * @throws {ModelError} If transaction fails
   * 
   * @example
   * // Transfer operation with transaction
   * await Meter.transaction(async (client) => {
   *   await client.query('UPDATE meter SET status = $1 WHERE id = $2', ['inactive', 1]);
   *   await client.query('UPDATE meter SET status = $1 WHERE id = $2', ['active', 2]);
   * });
   * 
   * @example
   * // Create multiple related records in a transaction
   * const result = await Device.transaction(async (client) => {
   *   const device = await client.query(
   *     'INSERT INTO device (name) VALUES ($1) RETURNING *',
   *     ['New Device']
   *   );
   *   await client.query(
   *     'INSERT INTO meter (device_id, name) VALUES ($1, $2)',
   *     [device.rows[0].id, 'New Meter']
   *   );
   *   return device.rows[0];
   * });
   */
  static async transaction(callback) {
    try {
      const db = this._getDb();
      return await db.transaction(callback);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this._handleDatabaseError(err, 'transaction', '', []);
      throw err; // Ensure function returns
    }
  }

  /**
   * Map database result row to model instance
   * Applies type deserialization before creating the instance
   * 
   * @param {Object} row - Database result row
   * @returns {Object} Model instance
   * @private
   */
  static _mapResultToInstance(row) {
    if (!row) {
      return null;
    }
    
    // Deserialize database values to proper JavaScript types
    const fields = this._getFields();
    const deserializedRow = deserializeRow(row, fields);
    
    return new this(deserializedRow);
  }

  /**
   * Handle database errors and throw appropriate custom errors
   * Uses the errorHandler utility to parse PostgreSQL errors
   * 
   * @param {Error} error - Database error
   * @param {string} operation - Operation being performed
   * @param {string|null} sql - SQL query that failed (optional)
   * @param {Array} params - Query parameters (optional)
   * @throws {ModelError} Custom error based on error code
   * @private
   */
  static _handleDatabaseError(error, operation, sql = null, params = []) {
    // Use the centralized error handler
    // Ensure error is an Error object
    const err = error instanceof Error ? error : new Error(String(error));
    handleDatabaseError(err, operation, this.name, this.tableName, sql || '', params);
  }

  /**
   * Create a new record in the database
   * 
   * @param {Object} data - Data for the new record
   * @returns {Promise<Object>} Created model instance
   * @throws {ValidationError} If validation fails
   * @throws {ModelError} If database error occurs
   * 
   * @example
   * const meter = await Meter.create({
   *   meterid: 'M001',
   *   name: 'Main Meter',
   *   type: 'electric'
   * });
   */
  static async create(data) {
    let sql = '';
    let values = [];
    
    try {
      // Get fields and validate configuration
      const fields = this._getFields();
      
      // Validate field types before query execution
      validateFieldTypes(data, fields, this.name);
      
      // Build INSERT query
      const queryResult = buildInsertSQL(this.tableName, fields, data);
      sql = queryResult.sql;
      values = queryResult.values;
      
      // Log query for debugging
      logQuery('create', this.name, sql, values);
      
      // Execute query
      const db = this._getDb();
      const result = await db.query(sql, values);
      
      // Map result to model instance
      if (result.rows && result.rows.length > 0) {
        return this._mapResultToInstance(result.rows[0]);
      }
      
      throw new Error('Failed to create record: no data returned');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this._handleDatabaseError(err, 'create', sql, values);
      throw err; // Ensure function returns
    }
  }

  /**
   * Find a record by its primary key
   * 
   * @param {*} id - Primary key value
   * @param {Object} options - Query options (include for relationships)
   * @returns {Promise<Object|null>} Model instance or null if not found
   * 
   * @example
   * const meter = await Meter.findById(5);
   * const meterWithDevice = await Meter.findById(5, { include: ['device'] });
   */
  static async findById(id, options = {}) {
    let sql = '';
    let values = [];
    
    try {
      // Get fields and validate configuration
      const fields = this._getFields();
      
      // Build WHERE condition for primary key
      const where = { [this.primaryKey]: id };
      
      // Build SELECT query with relationships if specified
      const queryOptions = {
        ...options,
        where,
        relationships: this.relationships,
        limit: 1
      };
      
      const queryResult = buildSelectSQL(this.tableName, fields, queryOptions);
      sql = queryResult.sql;
      values = queryResult.values;
      const relationshipMap = queryResult.relationshipMap;
      
      // Log query for debugging
      logQuery('findById', this.name, sql, values);
      
      // Execute query
      const db = this._getDb();
      const result = await db.query(sql, values);
      
      // Return first result or null
      if (result.rows && result.rows.length > 0) {
        // Map joined results to nested objects if relationships were included
        let rows = result.rows;
        if (relationshipMap && relationshipMap.length > 0) {
          rows = mapJoinedResults(rows, relationshipMap, this.primaryKey);
        }
        
        return this._mapResultToInstance(rows[0]);
      }
      
      return null;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this._handleDatabaseError(err, 'findById', sql, values);
      return null; // Ensure function returns
    }
  }

  /**
   * Find the first record matching the given conditions
   * 
   * @param {Object} where - WHERE conditions
   * @param {Object} options - Query options (include for relationships)
   * @returns {Promise<Object|null>} Model instance or null if not found
   * 
   * @example
   * const meter = await Meter.findOne({ meterid: 'M001' });
   * const meterWithDevice = await Meter.findOne(
   *   { status: 'active' },
   *   { include: ['device'] }
   * );
   */
  static async findOne(where, options = {}) {
    let sql = '';
    let values = [];
    
    try {
      // Get fields and validate configuration
      const fields = this._getFields();
      
      // Build SELECT query
      const queryOptions = {
        ...options,
        where,
        relationships: this.relationships,
        limit: 1
      };
      
      const queryResult = buildSelectSQL(this.tableName, fields, queryOptions);
      sql = queryResult.sql;
      values = queryResult.values;
      const relationshipMap = queryResult.relationshipMap;
      
      // Log query for debugging
      logQuery('findOne', this.name, sql, values);
      
      // Execute query
      const db = this._getDb();
      const result = await db.query(sql, values);
      
      // Return first result or null
      if (result.rows && result.rows.length > 0) {
        // Map joined results to nested objects if relationships were included
        let rows = result.rows;
        if (relationshipMap && relationshipMap.length > 0) {
          rows = mapJoinedResults(rows, relationshipMap, this.primaryKey);
        }
        
        return this._mapResultToInstance(rows[0]);
      }
      
      return null;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this._handleDatabaseError(err, 'findOne', sql, values);
      return null; // Ensure function returns
    }
  }

  /**
   * Find all records matching the given conditions
   * 
   * @param {Object} options - Query options (where, include, order, limit, offset)
   * @returns {Promise<Object>} Object with rows array and pagination metadata
   * 
   * @example
   * // Simple query
   * const result = await Meter.findAll();
   * 
   * // With filtering
   * const result = await Meter.findAll({
   *   where: { status: 'active', type: 'electric' }
   * });
   * 
   * // With pagination and sorting
   * const result = await Meter.findAll({
   *   where: { status: 'active' },
   *   order: [['name', 'ASC']],
   *   limit: 10,
   *   offset: 0
   * });
   * 
   * // With relationships
   * const result = await Meter.findAll({
   *   include: ['device', 'location'],
   *   limit: 10
   * });
   */
  static async findAll(options = {}) {
    let sql = '';
    let values = [];
    
    try {
      // Get fields and validate configuration
      const fields = this._getFields();
      
      // Build SELECT query
      const queryOptions = {
        ...options,
        relationships: this.relationships
      };
      
      const queryResult = buildSelectSQL(this.tableName, fields, queryOptions);
      sql = queryResult.sql;
      values = queryResult.values;
      const relationshipMap = queryResult.relationshipMap;
      
      // Log query for debugging
      logQuery('findAll', this.name, sql, values);
      
      // Execute query
      const db = this._getDb();
      const result = await db.query(sql, values);
      
      // Map joined results to nested objects if relationships were included
      let rows = result.rows;
      if (relationshipMap && relationshipMap.length > 0) {
        rows = mapJoinedResults(rows, relationshipMap, this.primaryKey);
      }
      
      // Map results to model instances
      rows = rows.map(row => this._mapResultToInstance(row));
      
      // Calculate pagination metadata
      const limit = options.limit || null;
      const offset = options.offset || 0;
      
      // Get total count if pagination is used
      let total = rows.length;
      let totalPages = 1;
      let currentPage = 1;
      
      if (limit) {
        // Execute count query to get total records
        const countResult = await this.count(options.where || {});
        total = countResult;
        totalPages = Math.ceil(total / limit);
        currentPage = Math.floor(offset / limit) + 1;
      }
      
      return {
        rows,
        pagination: {
          total,
          limit,
          offset,
          totalPages,
          currentPage,
          hasNextPage: limit ? (offset + limit) < total : false,
          hasPreviousPage: offset > 0
        }
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this._handleDatabaseError(err, 'findAll', sql, values);
      throw err; // Ensure function returns
    }
  }

  /**
   * Count records matching the given conditions
   * 
   * @param {Object} where - WHERE conditions
   * @returns {Promise<number>} Count of matching records
   * 
   * @example
   * const totalMeters = await Meter.count();
   * const activeMeters = await Meter.count({ status: 'active' });
   */
  static async count(where = {}) {
    let sql = '';
    let values = [];
    
    try {
      // Build WHERE clause
      let whereClause = '';
      
      if (where && Object.keys(where).length > 0) {
        const whereResult = buildWhereClause(where, this.tableName);
        whereClause = ` WHERE ${whereResult.clause}`;
        values = whereResult.values;
      }
      
      // Build COUNT query
      sql = `SELECT COUNT(*) as count FROM ${this.tableName}${whereClause}`;
      
      // Log query for debugging
      logQuery('count', this.name, sql, values);
      
      // Execute query
      const db = this._getDb();
      const result = await db.query(sql, values);
      
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this._handleDatabaseError(err, 'count', sql, values);
      return 0; // Ensure function returns
    }
  }

  /**
   * Check if any records exist matching the given conditions
   * 
   * @param {Object} where - WHERE conditions
   * @returns {Promise<boolean>} True if at least one record exists
   * 
   * @example
   * const exists = await Meter.exists({ meterid: 'M001' });
   */
  static async exists(where) {
    try {
      const count = await this.count(where);
      return count > 0;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this._handleDatabaseError(err, 'exists', '', []);
      return false; // Ensure function returns
    }
  }

  // ============================================================================
  // Instance CRUD Methods
  // ============================================================================

  /**
   * Update the current instance in the database
   * Only updates fields that are provided in the data parameter
   * Automatically updates the updated_at timestamp
   * 
   * @param {Object} data - Fields to update
   * @returns {Promise<Object>} Updated model instance
   * @throws {ValidationError} If validation fails
   * @throws {NotFoundError} If primary key is not set
   * @throws {ModelError} If database error occurs
   * 
   * @example
   * const meter = await Meter.findById(5);
   * await meter.update({ name: 'Updated Name', status: 'inactive' });
   * console.log(meter.name); // 'Updated Name'
   */
  async update(data) {
    let sql = '';
    let values = [];
    
    try {
      // Get the constructor (class) of this instance
      const ModelClass = /** @type {typeof BaseModel} */ (this.constructor);
      
      // Get fields and validate configuration
      const fields = ModelClass._getFields();
      
      // Get primary key value from current instance
      const primaryKey = ModelClass.primaryKey;
      const primaryKeyValue = this[primaryKey];
      
      if (!primaryKeyValue) {
        throw new NotFoundError(
          `Cannot update: primary key '${primaryKey}' is not set on this instance`,
          { model: ModelClass.name, primaryKey }
        );
      }
      
      // Validate field types before query execution
      validateFieldTypes(data, fields, ModelClass.name);
      
      // Build WHERE condition for primary key
      const where = { [primaryKey]: primaryKeyValue };
      
      // Build UPDATE query
      const queryResult = buildUpdateSQL(
        ModelClass.tableName,
        fields,
        data,
        where
      );
      sql = queryResult.sql;
      values = queryResult.values;
      
      // Log query for debugging
      logQuery('update', ModelClass.name, sql, values);
      
      // ALWAYS log SQL for debugging (even without DEBUG_SQL flag)
      console.log('\n' + '█'.repeat(100));
      console.log('█ SQL UPDATE STATEMENT');
      console.log('█'.repeat(100));
      console.log('Model:', ModelClass.name);
      console.log('SQL:', sql);
      console.log('Values:', JSON.stringify(values, null, 2));
      console.log('█'.repeat(100) + '\n');
      
      // Execute query
      const db = ModelClass._getDb();
      const result = await db.query(sql, values);
      
      console.log('\n' + '█'.repeat(100));
      console.log('█ SQL UPDATE RESULT');
      console.log('█'.repeat(100));
      console.log('Rows affected:', result.rowCount);
      console.log('Returned data:', JSON.stringify(result.rows, null, 2));
      console.log('█'.repeat(100) + '\n');
      
      // Update current instance properties with returned data
      if (result.rows && result.rows.length > 0) {
        const updatedData = result.rows[0];
        Object.keys(updatedData).forEach(key => {
          this[key] = updatedData[key];
        });
        return this;
      }
      
      throw new NotFoundError(
        `Failed to update record: no data returned for ${primaryKey}=${primaryKeyValue}`,
        { model: ModelClass.name, primaryKey, primaryKeyValue }
      );
    } catch (error) {
      const ModelClass = /** @type {typeof BaseModel} */ (this.constructor);
      const err = error instanceof Error ? error : new Error(String(error));
      ModelClass._handleDatabaseError(err, 'update', sql, values);
      throw err; // Ensure function returns
    }
  }

  /**
   * Delete the current instance from the database
   * 
   * @returns {Promise<Object>} Deleted record data
   * @throws {NotFoundError} If primary key is not set
   * @throws {ForeignKeyError} If foreign key constraint prevents deletion
   * @throws {ModelError} If database error occurs
   * 
   * @example
   * const meter = await Meter.findById(5);
   * const deletedData = await meter.delete();
   * console.log(deletedData); // { id: 5, meterid: 'M001', ... }
   */
  async delete() {
    let sql = '';
    let values = [];
    
    try {
      // Get the constructor (class) of this instance
      const ModelClass = /** @type {typeof BaseModel} */ (this.constructor);
      
      // Get primary key value from current instance
      const primaryKey = ModelClass.primaryKey;
      const primaryKeyValue = this[primaryKey];
      
      if (!primaryKeyValue) {
        throw new NotFoundError(
          `Cannot delete: primary key '${primaryKey}' is not set on this instance`,
          { model: ModelClass.name, primaryKey }
        );
      }
      
      // Build WHERE condition for primary key
      const where = { [primaryKey]: primaryKeyValue };
      
      // Build DELETE query
      const queryResult = buildDeleteSQL(ModelClass.tableName, where);
      sql = queryResult.sql;
      values = queryResult.values;
      
      // Log query for debugging
      logQuery('delete', ModelClass.name, sql, values);
      
      // Execute query
      const db = ModelClass._getDb();
      const result = await db.query(sql, values);
      
      // Return deleted record data
      if (result.rows && result.rows.length > 0) {
        return result.rows[0];
      }
      
      throw new NotFoundError(
        `Failed to delete record: no data returned for ${primaryKey}=${primaryKeyValue}`,
        { model: ModelClass.name, primaryKey, primaryKeyValue }
      );
    } catch (error) {
      const ModelClass = /** @type {typeof BaseModel} */ (this.constructor);
      const err = error instanceof Error ? error : new Error(String(error));
      ModelClass._handleDatabaseError(err, 'delete', sql, values);
      throw err; // Ensure function returns
    }
  }

  /**
   * Save the current instance to the database
   * Creates a new record if primary key is not set, otherwise updates existing record
   * 
   * @returns {Promise<Object>} Saved model instance
   * @throws {ValidationError} If validation fails
   * @throws {ModelError} If database error occurs
   * 
   * @example
   * // Create new record
   * const meter = new Meter({ meterid: 'M001', name: 'Main Meter' });
   * await meter.save();
   * console.log(meter.id); // 5 (assigned by database)
   * 
   * // Update existing record
   * meter.name = 'Updated Name';
   * await meter.save();
   */
  async save() {
    try {
      // Get the constructor (class) of this instance
      const ModelClass = /** @type {typeof BaseModel} */ (this.constructor);
      
      // Get primary key value from current instance
      const primaryKey = ModelClass.primaryKey;
      const primaryKeyValue = this[primaryKey];
      
      if (primaryKeyValue) {
        // Primary key exists - update existing record
        // Get all instance properties as data
        const data = {};
        const fields = ModelClass._getFields();
        fields.forEach((/** @type {any} */ field) => {
          if (this[field.name] !== undefined && field.name !== primaryKey) {
            data[field.name] = this[field.name];
          }
        });
        
        return await this.update(data);
      } else {
        // Primary key doesn't exist - create new record
        // Get all instance properties as data
        const data = {};
        const fields = ModelClass._getFields();
        fields.forEach((/** @type {any} */ field) => {
          if (this[field.name] !== undefined) {
            data[field.name] = this[field.name];
          }
        });
        
        // Create new record
        const created = await ModelClass.create(data);
        
        // Update current instance with created data
        Object.keys(created).forEach(key => {
          this[key] = created[key];
        });
        
        return this;
      }
    } catch (error) {
      const ModelClass = /** @type {typeof BaseModel} */ (this.constructor);
      const err = error instanceof Error ? error : new Error(String(error));
      ModelClass._handleDatabaseError(err, 'save', '', []);
      throw err; // Ensure function returns
    }
  }

  /**
   * Reload the current instance from the database
   * Refreshes all properties with current database values
   * 
   * @returns {Promise<Object>} Reloaded model instance
   * @throws {NotFoundError} If primary key is not set or record not found
   * @throws {ModelError} If database error occurs
   * 
   * @example
   * const meter = await Meter.findById(5);
   * // ... some time passes, database may have changed ...
   * await meter.reload();
   * console.log(meter.name); // Current value from database
   */
  async reload() {
    try {
      // Get the constructor (class) of this instance
      const ModelClass = /** @type {typeof BaseModel} */ (this.constructor);
      
      // Get primary key value from current instance
      const primaryKey = ModelClass.primaryKey;
      const primaryKeyValue = this[primaryKey];
      
      if (!primaryKeyValue) {
        throw new NotFoundError(
          `Cannot reload: primary key '${primaryKey}' is not set on this instance`,
          { model: ModelClass.name, primaryKey }
        );
      }
      
      // Fetch current data from database
      const reloaded = await ModelClass.findById(primaryKeyValue);
      
      if (!reloaded) {
        throw new NotFoundError(
          `Cannot reload: record with ${primaryKey}=${primaryKeyValue} not found`,
          { model: ModelClass.name, primaryKey, primaryKeyValue }
        );
      }
      
      // Update current instance properties with reloaded data
      Object.keys(reloaded).forEach(key => {
        this[key] = reloaded[key];
      });
      
      return this;
    } catch (error) {
      const ModelClass = /** @type {typeof BaseModel} */ (this.constructor);
      const err = error instanceof Error ? error : new Error(String(error));
      ModelClass._handleDatabaseError(err, 'reload', '', []);
      throw err; // Ensure function returns
    }
  }
}

module.exports = BaseModel;
