"use strict";
/**
 * Building Model for PostgreSQL
 * Replaces the Mongoose Building model
 */
const db = require('../config/database');
class Building {
    constructor(locationData = {}) {
        this.id = locationData.id;
        this.name = locationData.name;
        this.address_street = locationData.address_street;
        this.address_city = locationData.address_city;
        this.address_state = locationData.address_state;
        this.address_zip_code = locationData.address_zip_code;
        this.address_country = locationData.address_country;
        this.contact_primarycontact = locationData.contact_primarycontact;
        this.contact_email = locationData.contact_email;
        this.contact_phone = locationData.contact_phone;
        this.contact_website = locationData.contact_website;
        this.type = locationData.type;
        this.status = locationData.status || 'active';
        this.totalfloors = locationData.totalfloors;
        this.totalunits = locationData.totalunits;
        this.yearbuilt = locationData.yearbuilt;
        this.squarefootage = locationData.squarefootage;
        this.description = locationData.description;
        this.notes = locationData.notes;
        this.equipmentcount = locationData.equipmentcount || 0;
        this.metercount = locationData.metercount || 0;
        this.createdat = locationData.createdat;
        this.updatedat = locationData.updatedat;
    }
    /**
     * Create a new location
     */
    static async create(locationData) {
        const { name, address_street, address_city, address_state, address_zip_code, address_country, contact_primarycontact, contact_email, contact_phone, contact_website, type, status, totalfloors, totalunits, yearbuilt, squarefootage, description, notes } = locationData;
        const query = `
            INSERT INTO locations (
                name, address_street, address_city, address_state, address_zip_code, address_country,
                contact_primarycontact, contact_email, contact_phone, contact_website,
                type, status, totalfloors, totalunits, yearbuilt, squarefootage,
                description, notes, createdat, updatedat
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING *
        `;
        const values = [
            name, address_street, address_city, address_state, address_zip_code, address_country,
            contact_primarycontact, contact_email, contact_phone, contact_website,
            type, status || 'active', totalfloors, totalunits, yearbuilt, squarefootage,
            description, notes
        ];
        const result = await db.query(query, values);
        return new Building(result.rows[0]);
    }
    /**
     * Find location by ID
     */
    static async findById(id) {
        const query = 'SELECT * FROM locations WHERE id = $1';
        const result = await db.query(query, [id]);
        if (result.rows.length === 0) {
            return null;
        }
        return new Building(result.rows[0]);
    }
    /**
     * Find all locations with optional filters
     */
    static async findAll(filters = {}) {
        let query = 'SELECT * FROM locations WHERE 1=1';
        const values = [];
        let paramCount = 0;
        if (filters.type) {
            paramCount++;
            query += ` AND type = ${paramCount}`;
            values.push(filters.type);
        }
        if (filters.status) {
            paramCount++;
            query += ` AND status = ${paramCount}`;
            values.push(filters.status);
        }
        if (filters.search) {
            paramCount++;
            query += ` AND (name ILIKE ${paramCount} OR address_city ILIKE ${paramCount})`;
            values.push(`%${filters.search}%`);
        }
        query += ' ORDER BY name ASC';
        if (filters.limit) {
            paramCount++;
            query += ` LIMIT ${paramCount}`;
            values.push(filters.limit);
        }
        const result = await db.query(query, values);
        return result.rows.map(data => new Building(data));
    }
    /**
     * Update location
     */
    async update(updateData) {
        const allowedFields = [
            'name', 'address_street', 'address_city', 'address_state', 'address_zip_code', 'address_country',
            'contact_primarycontact', 'contact_email', 'contact_phone', 'contact_website',
            'type', 'status', 'totalfloors', 'totalunits', 'yearbuilt', 'squarefootage',
            'description', 'notes'
        ];
        const updates = [];
        const values = [];
        let paramCount = 0;
        for (const [key, value] of Object.entries(updateData)) {
            if (allowedFields.includes(key) && value !== undefined) {
                paramCount++;
                updates.push(`${key} = ${paramCount}`);
                values.push(value);
            }
        }
        if (updates.length === 0) {
            throw new Error('No valid fields to update');
        }
        paramCount++;
        updates.push(`updatedat = CURRENT_TIMESTAMP`);
        values.push(this.id);
        const query = `
            UPDATE locations 
            SET ${updates.join(', ')}
            WHERE id = ${paramCount}
            RETURNING *
        `;
        const result = await db.query(query, values);
        if (result.rows.length === 0) {
            throw new Error('Building not found');
        }
        // Update current instance
        Object.assign(this, result.rows[0]);
        return this;
    }
    /**
     * Delete location (soft delete by setting status to inactive)
     */
    async delete() {
        const query = `
            UPDATE locations 
            SET status = 'inactive', updatedat = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `;
        const result = await db.query(query, [this.id]);
        if (result.rows.length === 0) {
            throw new Error('Building not found');
        }
        this.status = 'inactive';
        this.updatedat = result.rows[0].updatedat;
        return this;
    }
    /**
     * Get location statistics
     */
    static async getStats() {
        const query = `
            SELECT 
                COUNT(*) as total_locations,
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active_locations,
                COUNT(CASE WHEN type = 'office' THEN 1 END) as office_locations,
                COUNT(CASE WHEN type = 'warehouse' THEN 1 END) as warehouse_locations,
                COUNT(CASE WHEN type = 'retail' THEN 1 END) as retail_locations,
                COUNT(CASE WHEN type = 'residential' THEN 1 END) as residential_locations,
                COUNT(CASE WHEN type = 'industrial' THEN 1 END) as industrial_locations,
                SUM(equipmentcount) as total_equipment,
                SUM(metercount) as total_meters
            FROM locations
        `;
        const result = await db.query(query);
        return result.rows[0];
    }
    /**
     * Update equipment count for a location
     */
    async updateEquipmentCount() {
        const query = `
            UPDATE locations 
            SET equipmentcount = (
                SELECT COUNT(*) FROM equipment WHERE locationid = $1
            ),
            updatedat = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING equipmentcount
        `;
        const result = await db.query(query, [this.id]);
        if (result.rows.length > 0) {
            this.equipmentcount = result.rows[0].equipmentcount;
        }
        return this;
    }
    /**
     * Update meter count for a location
     */
    async updateMeterCount() {
        const query = `
            UPDATE locations 
            SET metercount = (
                SELECT COUNT(*) FROM meters WHERE location_location = $1
            ),
            updatedat = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING metercount
        `;
        const result = await db.query(query, [this.id]);
        if (result.rows.length > 0) {
            this.metercount = result.rows[0].metercount;
        }
        return this;
    }
    /**
     * Get full address as string
     */
    get fullAddress() {
        const parts = [
            this.address_street,
            this.address_city,
            this.address_state,
            this.address_zip_code,
            this.address_country
        ].filter(part => part && part.trim());
        return parts.join(', ');
    }
    /**
     * Convert to JSON
     */
    toJSON() {
        return {
            ...this,
            fullAddress: this.fullAddress
        };
    }
}
module.exports = Building;
//# sourceMappingURL=Building.js.map