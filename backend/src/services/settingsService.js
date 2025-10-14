/**
 * Settings Service for PostgreSQL
 * Replaces MongoDB-based CompanySettings model
 */

const db = require('../config/database');

class SettingsService {
  /**
   * Get company settings from PostgreSQL
   */
  static async getCompanySettings() {
    try {
      const result = await db.query('SELECT * FROM companysettings LIMIT 1');
      
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
      const existingResult = await db.query('SELECT id FROM companysettings LIMIT 1');
      
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
      company_name: 'Your Company Name',
      company_address_street: '123 Main Street',
      company_address_city: 'Your City',
      company_address_state: 'Your State',
      company_address_zip_code: '12345',
      company_address_country: 'USA',
      company_phone: '(555) 123-4567',
      company_email: 'info@yourcompany.com',
      company_website: 'https://yourcompany.com',
      default_currency: 'USD',
      default_timezone: 'America/New_York',
      business_hours: JSON.stringify({
        monday: { open: '09:00', close: '17:00' },
        tuesday: { open: '09:00', close: '17:00' },
        wednesday: { open: '09:00', close: '17:00' },
        thursday: { open: '09:00', close: '17:00' },
        friday: { open: '09:00', close: '17:00' },
        saturday: { open: '10:00', close: '14:00' },
        sunday: { closed: true }
      }),
      notification_settings: JSON.stringify({
        email_enabled: true,
        sms_enabled: false,
        push_enabled: true,
        daily_reports: true,
        weekly_reports: true,
        monthly_reports: true
      })
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
        INSERT INTO companysettings (${fields.join(', ')})
        VALUES (${placeholders})
        RETURNING *
      `;
      
      const result = await db.query(query, values);
      return this.formatSettings(result.rows[0]);
    } catch (error) {
      console.error('Error creating settings:', error);
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
        UPDATE companysettings 
        SET ${setClause}
        WHERE id = $1
        RETURNING *
      `;
      
      const result = await db.query(query, [settingsId, ...values]);
      return this.formatSettings(result.rows[0]);
    } catch (error) {
      console.error('Error updating settings:', error);
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
      name: dbRow.company_name,
      logo: null, // Not yet implemented in DB schema
      address: {
        street: dbRow.company_address_street,
        city: dbRow.company_address_city,
        state: dbRow.company_address_state,
        zipCode: dbRow.company_address_zip_code,
        country: dbRow.company_address_country
      },
      contact: {
        phone: dbRow.company_phone,
        email: dbRow.company_email,
        website: dbRow.company_website
      },
      // System config
      systemConfig: {
        timezone: dbRow.default_timezone,
        currency: dbRow.default_currency,
        businessHours: typeof dbRow.business_hours === 'string' 
          ? JSON.parse(dbRow.business_hours) 
          : dbRow.business_hours
      },
      // Branding (placeholder for compatibility)
      branding: {
        primaryColor: '#1976d2',
        secondaryColor: '#dc004e',
        accentColor: '#ff5722',
        logoUrl: null, // Not yet implemented in DB schema
        faviconUrl: null,
        customCss: null,
        emailSignature: null
      },
      // Notification settings
      notifications: typeof dbRow.notification_settings === 'string'
        ? JSON.parse(dbRow.notification_settings)
        : dbRow.notification_settings,
      createdAt: dbRow.createdat,
      updatedAt: dbRow.updatedat
    };
  }

  /**
   * Convert frontend format back to database format
   */
  static formatForDatabase(frontendData) {
    const dbData = {};

    if (frontendData.name) dbData.company_name = frontendData.name;
    // logo field not yet implemented in DB schema

    if (frontendData.address) {
      if (frontendData.address.street) dbData.company_address_street = frontendData.address.street;
      if (frontendData.address.city) dbData.company_address_city = frontendData.address.city;
      if (frontendData.address.state) dbData.company_address_state = frontendData.address.state;
      if (frontendData.address.zipCode) dbData.company_address_zip_code = frontendData.address.zipCode;
      if (frontendData.address.country) dbData.company_address_country = frontendData.address.country;
    }

    if (frontendData.contact) {
      if (frontendData.contact.phone) dbData.company_phone = frontendData.contact.phone;
      if (frontendData.contact.email) dbData.company_email = frontendData.contact.email;
      if (frontendData.contact.website) dbData.company_website = frontendData.contact.website;
    }

    if (frontendData.systemConfig) {
      if (frontendData.systemConfig.timezone) dbData.default_timezone = frontendData.systemConfig.timezone;
      if (frontendData.systemConfig.currency) dbData.default_currency = frontendData.systemConfig.currency;
      if (frontendData.systemConfig.businessHours) {
        dbData.business_hours = JSON.stringify(frontendData.systemConfig.businessHours);
      }
    }

    if (frontendData.notifications) {
      dbData.notification_settings = JSON.stringify(frontendData.notifications);
    }

    return dbData;
  }
}

module.exports = SettingsService;