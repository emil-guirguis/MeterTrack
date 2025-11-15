const db = require('../config/database');

class SettingsService {
  /**
   * Get company settings from PostgreSQL
   */
  static async getCompanySettings() {
    try {
      const result = await db.query('SELECT * FROM tenant LIMIT 1');
      
      if (result.rows.length === 0) {
        // Create default settings if none exist
        return await this.createDefaultSettings();
      }
      
      return this.formatSettings(result.rows[0]);
    } catch (error) {
      console.error('Error fetching company settings:', error);
      throw error;
    }
  }

  /**
   * Update company settings
   */
  static async updateCompanySettings(updateData) {
    try {
      // Check if settings exist
      const existingResult = await db.query('SELECT id FROM tenant LIMIT 1');
      
      if (existingResult.rows.length === 0) {
        // Create new settings
        return await this.createSettings(updateData);
      } else {
        // Update existing settings
        const settingsId = existingResult.rows[0].id;
        return await this.updateSettings(settingsId, updateData);
      }
    } catch (error) {
      console.error('Error updating company settings:', error);
      throw error;
    }
  }

  /**
   * Create default settings
   */
  static async createDefaultSettings() {
    const defaultSettings = {
      name: 'Your Company Name',
      url: 'https://yourcompany.com',
      address: '123 Main Street',
      address2: '',
      city: 'Your City',
      state: 'Your State',
      zip: '12345',
      country: 'USA',
      active: true
    };

    return await this.createSettings(defaultSettings);
  }

  /**
   * Create new settings record
   */
  static async createSettings(settingsData) {
    try {
      const fields = Object.keys(settingsData);
      const values = Object.values(settingsData);
      const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
      
      const query = `
        INSERT INTO tenant (${fields.join(', ')})
        VALUES (${placeholders})
        RETURNING *
      `;
      
      const result = await db.query(query, values);
      return this.formatSettings(result.rows[0]);
    } catch (error) {
      console.error('Error creating company settings:', error);
      throw error;
    }
  }

  /**
   * Update existing settings record
   */
  static async updateSettings(settingsId, updateData) {
    try {
      const fields = Object.keys(updateData);
      const values = Object.values(updateData);
      const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
      
      const query = `
        UPDATE tenant 
        SET ${setClause}
        WHERE id = $1
        RETURNING *
      `;
      
      const result = await db.query(query, [settingsId, ...values]);
      return this.formatSettings(result.rows[0]);
    } catch (error) {
      console.error('Error updating company settings:', error);
      throw error;
    }
  }

  /**
   * Format settings for frontend compatibility
   */
  static formatSettings(dbRow) {
    if (!dbRow) return null;

    return {
      id: dbRow.id,
      // Company info
      name: dbRow.name,
      url: dbRow.url,
      address: {
        street: dbRow.address,
        street2: dbRow.address2,
        city: dbRow.city,
        state: dbRow.state,
        zipCode: dbRow.zip,
        country: dbRow.country
      },
      // System config (placeholder for compatibility)
      systemConfig: {
        timezone: 'America/New_York',
        currency: 'USD',
        businessHours: {}
      },
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };
  }

  /**
   * Convert frontend format back to database format
   */
  static formatForDatabase(frontendData) {
    const dbData = {};

    if (frontendData.name !== undefined) dbData.name = frontendData.name;
    if (frontendData.url !== undefined) dbData.url = frontendData.url;

    if (frontendData.address) {
      if (frontendData.address.street !== undefined) dbData.address = frontendData.address.street;
      if (frontendData.address.street2 !== undefined) dbData.address2 = frontendData.address.street2;
      if (frontendData.address.city !== undefined) dbData.city = frontendData.address.city;
      if (frontendData.address.state !== undefined) dbData.state = frontendData.address.state;
      if (frontendData.address.zipCode !== undefined) dbData.zip = frontendData.address.zipCode;
      if (frontendData.address.country !== undefined) dbData.country = frontendData.address.country;
    }

    return dbData;
  }
}

module.exports = SettingsService;