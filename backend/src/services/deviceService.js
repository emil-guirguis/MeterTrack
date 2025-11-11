/**
 * Device Service for PostgreSQL
 * Replaces MongoDB-based Brand model
 */

const db = require('../config/database');

class DeviceService {
  /**
   * Validate device input data
   */
  static validateDeviceInput(deviceData, isUpdate = false) {
    const errors = [];

    // Validate name field
    if (!isUpdate || deviceData.hasOwnProperty('name')) {
      if (!deviceData.name) {
        errors.push('Device name is required');
      } else if (typeof deviceData.name !== 'string') {
        errors.push('Device name must be a string');
      } else if (deviceData.name.trim().length === 0) {
        errors.push('Device name cannot be empty');
      } else if (deviceData.name.length > 100) {
        errors.push('Device name cannot exceed 100 characters');
      } else if (deviceData.name.trim() !== deviceData.name) {
        errors.push('Device name cannot have leading or trailing whitespace');
      }
    }

    // Validate description field (optional)
    if (deviceData.hasOwnProperty('description') && deviceData.description !== null) {
      if (typeof deviceData.description !== 'string') {
        errors.push('Device description must be a string');
      } else if (deviceData.description.length > 255) {
        errors.push('Device description cannot exceed 255 characters');
      }
    }

    // Validate model field (optional)
    if (deviceData.hasOwnProperty('model') && deviceData.model !== null) {
      if (typeof deviceData.model !== 'string') {
        errors.push('Device model must be a string');
      } else if (deviceData.model.length > 255) {
        errors.push('Device model cannot exceed 255 characters');
      }
    }

    // Check for unexpected fields
    const allowedFields = ['tyoe', 'description', 'brand', 'model_number'];
    const unexpectedFields = Object.keys(deviceData).filter(field => !allowedFields.includes(field));
    if (unexpectedFields.length > 0) {
      errors.push(`Unexpected fields: ${unexpectedFields.join(', ')}`);
    }

    return errors;
  }

  /**
   * Create validation error with specific error code
   */
  static createValidationError(errors) {
    const error = new Error(`Validation failed: ${errors.join(', ')}`);
    error.code = 'VALIDATION_ERROR';
    error.details = errors;
    return error;
  }

  /**
   * Create database error with specific error code
   */
  static createDatabaseError(originalError, operation) {
    let error;
    
    if (originalError.code === '23505') {
      // Unique constraint violation
      error = new Error('Device name already exists');
      error.code = 'DUPLICATE_NAME';
    } else if (originalError.code === '23503') {
      // Foreign key constraint violation
      error = new Error('Cannot delete device: it is referenced by other records');
      error.code = 'FOREIGN_KEY_VIOLATION';
    } else if (originalError.code === '22001') {
      // String data too long
      error = new Error('Input data exceeds maximum length');
      error.code = 'DATA_TOO_LONG';
    } else {
      // Generic database error
      error = new Error(`Database error during ${operation}`);
      error.code = 'DATABASE_ERROR';
    }
    
    error.originalError = originalError;
    return error;
  }

  /**
   * Get all devices
   */
  static async getAllDevices() {
    try {
      const result = await db.query('SELECT * FROM device ORDER BY brand ASC');
      return result.rows.map(this.formatDevice);
    } catch (error) {
      console.error('Error fetching device:', error);
      throw this.createDatabaseError(error, 'device retrieval');
    }
  }

  /**
   * Get device by ID
   */
  static async getDeviceById(id) {
    // Validate ID
    if (!id) {
      throw this.createValidationError(['Device ID is required']);
    }

    try {
      const result = await db.query('SELECT * FROM device WHERE id = $1', [id]);
      if (result.rows.length === 0) {
        return null;
      }
      return this.formatDevice(result.rows[0]);
    } catch (error) {
      console.error('Error fetching device by ID:', error);
      throw this.createDatabaseError(error, 'device retrieval');
    }
  }

  /**
   * Create new device
   */
  static async createDevice(deviceData) {
    // Validate input data
    const validationErrors = this.validateDeviceInput(deviceData);
    if (validationErrors.length > 0) {
      throw this.createValidationError(validationErrors);
    }

    try {
      const { name, description, model } = deviceData;
      const result = await db.query(
        'INSERT INTO device (type, description, brand,model_number) VALUES ($1, $2, $3, $4) RETURNING *',
        [name.trim(), description || null, model || null]
      );
      return this.formatDevice(result.rows[0]);
    } catch (error) {
      console.error('Error creating device:', error);
      throw this.createDatabaseError(error, 'device creation');
    }
  }

  /**
   * Update device
   */
  static async updateDevice(id, updateData) {
    // Validate ID
    if (!id) {
      throw this.createValidationError(['Device ID is required']);
    }

    // Validate input data for update
    const validationErrors = this.validateDeviceInput(updateData, true);
    if (validationErrors.length > 0) {
      throw this.createValidationError(validationErrors);
    }

    try {
      // Build dynamic update query based on provided fields
      const updateFields = [];
      const values = [];
      let paramIndex = 1;

      if (updateData.hasOwnProperty('type')) {
        updateFields.push(`type = $${paramIndex}`);
        values.push(updateData.name.trim());
        paramIndex++;
      }

      if (updateData.hasOwnProperty('description')) {
        updateFields.push(`description = $${paramIndex}`);
        values.push(updateData.description || null);
        paramIndex++;
      }

            if (updateData.hasOwnProperty('brand')) {
        updateFields.push(`brand = $${paramIndex}`);
        values.push(updateData.description || null);
        paramIndex++;
      }


      if (updateData.hasOwnProperty('model_number')) {
        updateFields.push(`model_number = $${paramIndex}`);
        values.push(updateData.model || null);
        paramIndex++;
      }

      if (updateFields.length === 0) {
        throw this.createValidationError(['No valid fields provided for update']);
      }

      // Add updated timestamp
      updateFields.push(`updatedat = CURRENT_TIMESTAMP`);
      
      // Add ID parameter
      values.push(id);
      const query = `UPDATE device SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;

      const result = await db.query(query, values);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.formatDevice(result.rows[0]);
    } catch (error) {
      console.error('Error updating device:', error);
      if (error.code === 'VALIDATION_ERROR') {
        throw error;
      }
      throw this.createDatabaseError(error, 'device update');
    }
  }

  /**
   * Delete device
   */
  static async deleteDevice(id) {
    // Validate ID
    if (!id) {
      throw this.createValidationError(['Device ID is required']);
    }

    try {
      const result = await db.query('DELETE FROM device WHERE id = $1 RETURNING *', [id]);
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error deleting device:', error);
      throw this.createDatabaseError(error, 'device deletion');
    }
  }

  /**
   * Format device data for frontend compatibility
   */
  static formatDevice(dbRow) {
    if (!dbRow) return null;

    return {
      id: dbRow.id,
      name: dbRow.name,
      description: dbRow.description,
      model: dbRow.model,
      createdAt: dbRow.createdat,
      updatedAt: dbRow.updatedat
    };
  }
}

module.exports = DeviceService;
