"use strict";
/**
 * Equipment Model for PostgreSQL
 * Replaces the Mongoose Equipment model
 */
const db = require('../config/database');
class Equipment {
    constructor(equipmentData = {}) {
        this.id = equipmentData.id;
        this.name = equipmentData.name;
        this.type = equipmentData.type;
        this.locationid = equipmentData.locationid;
        this.locationname = equipmentData.locationname;
        this.specifications = equipmentData.specifications;
        this.status = equipmentData.status || 'active';
        this.installdate = equipmentData.installdate;
        this.lastmaintenance = equipmentData.lastmaintenance;
        this.nextmaintenance = equipmentData.nextmaintenance;
        this.serialnumber = equipmentData.serialnumber;
        this.manufacturer = equipmentData.manufacturer;
        this.model = equipmentData.model;
        this.location = equipmentData.location;
        this.notes = equipmentData.notes;
        this.createdat = equipmentData.createdat;
        this.updatedat = equipmentData.updatedat;
    }
    /**
     * Create new equipment
     */
    static async create(equipmentData) {
        const { name, type, locationid, locationname, specifications, status, installdate, lastmaintenance, nextmaintenance, serialnumber, manufacturer, model, location, notes } = equipmentData;
        const query = `
            INSERT INTO equipment (
                name, type, locationid, locationname, specifications, status,
                installdate, lastmaintenance, nextmaintenance, serialnumber,
                manufacturer, model, location, notes, createdat, updatedat
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING *
        `;
        const values = [
            name, type, locationid, locationname,
            JSON.stringify(specifications || {}), status || 'active',
            installdate, lastmaintenance, nextmaintenance, serialnumber,
            manufacturer, model, location, notes
        ];
        const result = await db.query(query, values);
        const equipment = new Equipment(result.rows[0]);
        // Parse JSON fields
        if (equipment.specifications && typeof equipment.specifications === 'string') {
            equipment.specifications = JSON.parse(equipment.specifications);
        }
        return equipment;
    }
    /**
     * Find equipment by ID
     */
    static async findById(id) {
        const query = 'SELECT * FROM equipment WHERE id = $1';
        const result = await db.query(query, [id]);
        if (result.rows.length === 0) {
            return null;
        }
        const equipment = new Equipment(result.rows[0]);
        // Parse JSON fields
        if (equipment.specifications && typeof equipment.specifications === 'string') {
            equipment.specifications = JSON.parse(equipment.specifications);
        }
        return equipment;
    }
    /**
     * Find all equipment with optional filters
     */
    static async findAll(filters = {}) {
        let query = 'SELECT * FROM equipment WHERE 1=1';
        const values = [];
        let paramCount = 0;
        if (filters.type) {
            paramCount++;
            query += ` AND type = $${paramCount}`;
            values.push(filters.type);
        }
        if (filters.status) {
            paramCount++;
            query += ` AND status = $${paramCount}`;
            values.push(filters.status);
        }
        if (filters.locationid) {
            paramCount++;
            query += ` AND locationid = $${paramCount}`;
            values.push(filters.locationid);
        }
        if (filters.search) {
            paramCount++;
            query += ` AND (name ILIKE $${paramCount} OR manufacturer ILIKE $${paramCount} OR model ILIKE $${paramCount})`;
            values.push(`%${filters.search}%`);
        }
        query += ' ORDER BY name ASC';
        if (filters.limit) {
            paramCount++;
            query += ` LIMIT $${paramCount}`;
            values.push(filters.limit);
        }
        const result = await db.query(query, values);
        return result.rows.map(data => {
            const equipment = new Equipment(data);
            // Parse JSON fields
            if (equipment.specifications && typeof equipment.specifications === 'string') {
                equipment.specifications = JSON.parse(equipment.specifications);
            }
            return equipment;
        });
    }
    /**
     * Update equipment
     */
    async update(updateData) {
        const allowedFields = [
            'name', 'type', 'locationid', 'locationname', 'specifications', 'status',
            'installdate', 'lastmaintenance', 'nextmaintenance', 'serialnumber',
            'manufacturer', 'model', 'location', 'notes'
        ];
        const updates = [];
        const values = [];
        let paramCount = 0;
        for (const [key, value] of Object.entries(updateData)) {
            if (allowedFields.includes(key) && value !== undefined) {
                paramCount++;
                updates.push(`${key} = ${paramCount}`);
                if (key === 'specifications') {
                    values.push(JSON.stringify(value));
                }
                else {
                    values.push(value);
                }
            }
        }
        if (updates.length === 0) {
            throw new Error('No valid fields to update');
        }
        paramCount++;
        updates.push(`updatedat = CURRENT_TIMESTAMP`);
        values.push(this.id);
        const query = `
            UPDATE equipment 
            SET ${updates.join(', ')}
            WHERE id = $${paramCount}
            RETURNING *
        `;
        const result = await db.query(query, values);
        if (result.rows.length === 0) {
            throw new Error('Equipment not found');
        }
        // Update current instance
        Object.assign(this, result.rows[0]);
        // Parse JSON fields
        if (this.specifications && typeof this.specifications === 'string') {
            this.specifications = JSON.parse(this.specifications);
        }
        return this;
    }
    /**
     * Delete equipment (soft delete)
     */
    async delete() {
        const query = `
            UPDATE equipment 
            SET status = 'inactive', updatedat = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `;
        const result = await db.query(query, [this.id]);
        if (result.rows.length === 0) {
            throw new Error('Equipment not found');
        }
        this.status = 'inactive';
        this.updatedat = result.rows[0].updatedat;
        return this;
    }
    /**
     * Get equipment statistics
     */
    static async getStats() {
        const query = `
            SELECT 
                COUNT(*) as total_equipment,
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active_equipment,
                COUNT(CASE WHEN status = 'maintenance' THEN 1 END) as maintenance_equipment,
                COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_equipment,
                COUNT(DISTINCT type) as equipment_types,
                COUNT(DISTINCT locationid) as location_with_equipment
            FROM equipment
        `;
        const result = await db.query(query);
        return result.rows[0];
    }
    /**
     * Get equipment by location
     */
    static async findByLocation(locationId) {
        const query = 'SELECT * FROM equipment WHERE locationid = $1 ORDER BY name ASC';
        const result = await db.query(query, [locationId]);
        return result.rows.map(data => {
            const equipment = new Equipment(data);
            // Parse JSON fields
            if (equipment.specifications && typeof equipment.specifications === 'string') {
                equipment.specifications = JSON.parse(equipment.specifications);
            }
            return equipment;
        });
    }
    /**
     * Update maintenance date
     */
    async updateMaintenance(maintenanceDate, nextMaintenanceDate = null) {
        const query = `
            UPDATE equipment 
            SET lastmaintenance = $1, 
                nextmaintenance = $2,
                updatedat = CURRENT_TIMESTAMP
            WHERE id = $3
            RETURNING *
        `;
        const result = await db.query(query, [maintenanceDate, nextMaintenanceDate, this.id]);
        if (result.rows.length === 0) {
            throw new Error('Equipment not found');
        }
        this.lastmaintenance = result.rows[0].lastmaintenance;
        this.nextmaintenance = result.rows[0].nextmaintenance;
        this.updatedat = result.rows[0].updatedat;
        return this;
    }
    /**
     * Convert to JSON
     */
    toJSON() {
        return {
            ...this,
            // Ensure specifications is an object
            specifications: typeof this.specifications === 'string'
                ? JSON.parse(this.specifications)
                : this.specifications
        };
    }
}
module.exports = Equipment;
//# sourceMappingURL=Equipment.js.map