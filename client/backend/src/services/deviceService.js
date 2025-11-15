/**
 * Device Service for PostgreSQL
 * Maps database fields to frontend fields
 */

const db = require('../config/database');

class DeviceService {
  /**
   * Validate device input data
   */
  static validateDeviceInput(deviceData, isUpdate = false) {
    const errors = [];

    // Validate manufacturer field
    if (!isUpdate || deviceData.hasOwnProperty('manufacturer')) {
      if (!deviceData.manufacturer) {
        errors.push('Device manufacturer is required');
      } else if (typeof deviceData.manufacturer !== 'string') {
        errors.push('Device manufacturer must be a string');
      } else if (deviceData.manufacturer.trim().length === 0) {
        errors.push('Device manufacturer cannot be empty');
      } else if (deviceData.manufacturer.length > 255) {
        errors.push('Device manufacturer cannot exceed 255 characters');
      }
    }

    // Validate type field
    if (!isUpdate || deviceData.hasOwnProperty('type')) {
      if (!deviceData.type) {
        errors.push('Device type is required');
      } else if (typeof deviceData.type !== 'string') {
        errors.push('Device type must be a string');
      } else if (deviceData.type.trim().length === 0) {
        errors.push('Device type cannot be empty');
      } else if (deviceData.type.length > 255) {
        errors.push('Device type cannot exceed 255 characters');
      }
    }

    // Validate manufacturer field
    if (!isUpdate || deviceData.hasOwnProperty('manufacturer')) {
      if (deviceData.manufacturer && typeof deviceData.manufacturer !== 'string') {
        errors.push('Device model number must be a string');
      } else if (deviceData.manufacturer && deviceData.manufacturer.length > 255) {
        errors.push('Device model number cannot exceed 255 characters');
      }
    }

    // Validate model_number field
    if (!isUpdate || deviceData.hasOwnProperty('model_number')) {
      if (deviceData.model_number && typeof deviceData.model_number !== 'string') {
        errors.push('Device model number must be a string');
      } else if (deviceData.model_number && deviceData.model_number.length > 255) {
        errors.push('Device model number cannot exceed 255 characters');
      }
    }

    // Validate description field (optional)
    if (deviceData.hasOwnProperty('description') && deviceData.description !== null) {
      if (typeof deviceData.description !== 'string') {
        errors.push('Device description must be a string');
      }
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
      error = new Error('Device manufacturer already exists');
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
      const result = await db.query('SELECT * FROM device ORDER BY manufacturer ASC');
      return result.rows.map(this.formatDevice);
    } catch (error) {
      console.error('Error fetching devices:', error);
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
    // Map frontend fields (manufacturer, model_number) to database fields
    const mappedData = {
      type: deviceData.type,
      manufacturer: deviceData.manufacturer,
      model_number: deviceData.model_number,
      description: deviceData.description
    };

    // Validate input data
    const validationErrors = this.validateDeviceInput(mappedData);
    if (validationErrors.length > 0) {
      throw this.createValidationError(validationErrors);
    }

    try {
      const { type, manufacturer, description, model_number } = mappedData;
      const result = await db.query(
        'INSERT INTO device (type, manufacturer, description, model_number) VALUES ($1, $2, $3, $4) RETURNING *',
        [type.trim(), manufacturer.trim(), description || null, model_number || null]
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

    // Map frontend fields to database fields
    const mappedData = {};
    if (updateData.hasOwnProperty('type')) {
      mappedData.type = updateData.type;
    }
    if (updateData.hasOwnProperty('manufacturer')) {
      mappedData.manufacturer = updateData.manufacturer;
    }
    if (updateData.hasOwnProperty('model_number')) {
      mappedData.model_number = updateData.model_number;
    }
    if (updateData.hasOwnProperty('description')) {
      mappedData.description = updateData.description;
    }

    // Validate input data for update
    const validationErrors = this.validateDeviceInput(mappedData, true);
    if (validationErrors.length > 0) {
      throw this.createValidationError(validationErrors);
    }

    try {
      // Build dynamic update query based on provided fields
      const updateFields = [];
      const values = [];
      let paramIndex = 1;

      if (mappedData.hasOwnProperty('type')) {
        updateFields.push(`type = $${paramIndex}`);
        values.push(mappedData.type.trim());
        paramIndex++;
      }
      if (mappedData.hasOwnProperty('manufacturer')) {
        updateFields.push(`manufacturer = $${paramIndex}`);
        values.push(mappedData.manufacturer.trim());
        paramIndex++;
      }

      if (mappedData.hasOwnProperty('model_number')) {
        updateFields.push(`model_number = $${paramIndex}`);
        values.push(mappedData.model_number || null);
        paramIndex++;
      }

      if (mappedData.hasOwnProperty('description')) {
        updateFields.push(`description = $${paramIndex}`);
        values.push(mappedData.description || null);
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
   * Maps database fields to frontend fields
   */
  static formatDevice(dbRow) {
    if (!dbRow) return null;

    return {
      id: dbRow.id,
      type: dbRow.type,
      manufacturer: dbRow.manufacturer,
      model_number: dbRow.model_number,
      description: dbRow.description,
      createdAt: dbRow.createdat,
      updatedAt: dbRow.updatedat
    };
  }
}

module.exports = DeviceService;
