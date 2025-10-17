"use strict";
/**
 * Meter Model for PostgreSQL
 * Replaces the Mongoose Meter model
 */
const db = require('../config/database');
class Meter {
    constructor(meterData = {}) {
        this.id = meterData.id;
        this.meterid = meterData.meterid;
        this.name = meterData.name;
        this.type = meterData.type;
        this.device_id = meterData.device_id;
        // Joined fields from devices table (when available)
        this.device_name = meterData.device_name;
        this.device_description = meterData.device_description;
        this.serialnumber = meterData.serialnumber;
        this.installation_date = meterData.installation_date;
        this.last_reading_date = meterData.last_reading_date;
        this.status = meterData.status || 'active';
        this.location_location = meterData.location_location;
        this.location_floor = meterData.location_floor;
        this.location_room = meterData.location_room;
        this.location_description = meterData.location_description;
        this.unit_of_measurement = meterData.unit_of_measurement;
        this.multiplier = meterData.multiplier || 1;
        this.notes = meterData.notes;
        this.register_map = meterData.register_map; // JSONB column
        this.createdat = meterData.createdat;
        this.updatedat = meterData.updatedat;
    }
    /**
     * Create new meter
     */
    static async create(meterData) {
        const { meterid, name, type, device_id, serialnumber, installation_date, last_reading_date, status, location_location, location_floor, location_room, location_description, unit_of_measurement, multiplier, notes } = meterData;
        const query = `
            INSERT INTO meters (
                meterid, name, type, device_id, serialnumber,
                installation_date, last_reading_date, status, location_location,
                location_floor, location_room, location_description,
                unit_of_measurement, multiplier, notes, register_map, createdat, updatedat
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING *
        `;
        const values = [
            meterid, name, type, device_id, serialnumber,
            installation_date, last_reading_date, status || 'active', location_location,
            location_floor, location_room, location_description,
            unit_of_measurement, multiplier || 1, notes, meterData.register_map || null
        ];
        try {
            const result = await db.query(query, values);
            return new Meter(result.rows[0]);
        }
        catch (error) {
            if (error.code === '23505') { // Unique constraint violation
                throw new Error('Meter ID already exists');
            }
            throw error;
        }
    }
    /**
     * Find meter by ID
     */
    static async findById(id) {
        const query = `
            SELECT m.*, d.name as device_name, d.description as device_description
            FROM meters m
            LEFT JOIN devices d ON m.device_id = d.id
            WHERE m.id = $1
        `;
        const result = await db.query(query, [id]);
        if (result.rows.length === 0) {
            return null;
        }
        return new Meter(result.rows[0]);
    }
    /**
     * Find meter by meter ID
     */
    static async findByMeterId(meterid) {
        const query = 'SELECT * FROM meters WHERE meterid = $1';
        const result = await db.query(query, [meterid]);
        if (result.rows.length === 0) {
            return null;
        }
        return new Meter(result.rows[0]);
    }
    /**
     * Find all meters with optional filters
     */
    static async findAll(filters = {}) {
        let query = `SELECT m.*, d.name as device_name, d.description as device_description FROM meters m LEFT JOIN devices d ON m.device_id = d.id WHERE 1=1`;
        const values = [];
        let paramCount = 0;
        if (filters.type) {
            paramCount++;
            query += ` AND m.type = ${paramCount}`;
            values.push(filters.type);
        }
        if (filters.status) {
            paramCount++;
            query += ` AND m.status = ${paramCount}`;
            values.push(filters.status);
        }
        if (filters.location_location) {
            paramCount++;
            query += ` AND m.location_location = ${paramCount}`;
            values.push(filters.location_location);
        }
        if (filters.search) {
            paramCount++;
            query += ` AND (m.meterid ILIKE ${paramCount} OR m.name ILIKE ${paramCount} OR d.name ILIKE ${paramCount})`;
            values.push(`%${filters.search}%`);
        }
        query += ' ORDER BY m.meterid ASC';
        if (filters.limit) {
            paramCount++;
            query += ` LIMIT ${paramCount}`;
            values.push(filters.limit);
        }
        const result = await db.query(query, values);
        return result.rows.map(data => new Meter(data));
    }
    /**
     * Update meter
     */
    async update(updateData) {
        const allowedFields = [
            'meterid', 'name', 'type', 'device_id', 'serialnumber',
            'installation_date', 'last_reading_date', 'status', 'location_location',
            'location_floor', 'location_room', 'location_description',
            'unit_of_measurement', 'multiplier', 'notes', 'register_map'
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
            UPDATE meters 
            SET ${updates.join(', ')}
            WHERE id = ${paramCount}
            RETURNING *
        `;
        try {
            const result = await db.query(query, values);
            if (result.rows.length === 0) {
                throw new Error('Meter not found');
            }
            // Update current instance
            Object.assign(this, result.rows[0]);
            return this;
        }
        catch (error) {
            if (error.code === '23505') { // Unique constraint violation
                throw new Error('Meter ID already exists');
            }
            throw error;
        }
    }
    /**
     * Delete meter (soft delete)
     */
    async delete() {
        const query = `
            UPDATE meters 
            SET status = 'inactive', updatedat = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `;
        const result = await db.query(query, [this.id]);
        if (result.rows.length === 0) {
            throw new Error('Meter not found');
        }
        this.status = 'inactive';
        this.updatedat = result.rows[0].updatedat;
        return this;
    }
    /**
     * Update last reading date
     */
    async updateLastReading(readingDate = new Date()) {
        const query = `
            UPDATE meters 
            SET last_reading_date = $1, updatedat = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *
        `;
        const result = await db.query(query, [readingDate, this.id]);
        if (result.rows.length === 0) {
            throw new Error('Meter not found');
        }
        this.last_reading_date = result.rows[0].last_reading_date;
        this.updatedat = result.rows[0].updatedat;
        return this;
    }
    /**
     * Get meter statistics
     */
    static async getStats() {
        const query = `
            SELECT 
                COUNT(*) as total_meters,
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active_meters,
                COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_meters,
                COUNT(CASE WHEN type = 'electric' THEN 1 END) as electric_meters,
                COUNT(CASE WHEN type = 'gas' THEN 1 END) as gas_meters,
                COUNT(CASE WHEN type = 'water' THEN 1 END) as water_meters,
                COUNT(DISTINCT location_location) as locations_with_meters
            FROM meters
        `;
        const result = await db.query(query);
        return result.rows[0];
    }
    /**
     * Get meters by location
     */
    static async findByLocation(location) {
        const query = 'SELECT * FROM meters WHERE location_location = $1 ORDER BY meterid ASC';
        const result = await db.query(query, [location]);
        return result.rows.map(data => new Meter(data));
    }
    /**
     * Get full location string
     */
    get fullLocation() {
        const parts = [
            this.location_location,
            this.location_floor && `Floor ${this.location_floor}`,
            this.location_room && `Room ${this.location_room}`,
            this.location_description
        ].filter(part => part && part.trim());
        return parts.join(', ');
    }
    /**
     * Convert to JSON
     */
    toJSON() {
        return {
            ...this,
            fullLocation: this.fullLocation
        };
    }
}
module.exports = Meter;
//# sourceMappingURL=Meter.js.map