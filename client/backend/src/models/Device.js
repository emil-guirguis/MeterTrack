const db = require('../config/database');

class Device {
    constructor(deviceData = {}) {
        this.id = deviceData.id;
        this.description = deviceData.description;
        this.manufacturer = deviceData.manufacturer;
        this.model_number = deviceData.model_number;
        this.type = deviceData.type;
        this.register_map = deviceData.register_map;
        this.active = deviceData.active;
        this.created_at = deviceData.created_at;
        this.updated_at = deviceData.updated_at;
    }

    /**
     * Create new device
     */
    static async create(deviceData) {
        const {
            type, manufacturer,model_number,description,  createdat, updatedat
        } = deviceData;

        const query = `
            INSERT INTO device (
                type, manufacturer,model_number,description, createdat, updatedat
            ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING *
        `;

        const values = [type, manufacturer,model_number,description];

        try {
            const result = await db.query(query, values);
            return new Device(result.rows[0]);
        } catch (error) {
            if (error && typeof error === 'object' && 'code' in error && error.code === '23505') { // Unique constraint violation
                throw new Error('Device name already exists');
            }
            throw error;
        }
    }

    /**
     * Find device by ID
     */
    static async findById(id) {
        const query = 'SELECT * FROM device WHERE id = $1';
        const result = await db.query(query, [id]);
        if (result.rows.length === 0) {
            return null;
        }
        return new Device(result.rows[0]);
    }

    /**
     * Find all device with optional filters
     */
    static async findAll(filters = {}) {
        let query = 'SELECT * FROM device WHERE 1=1';
        const values = [];
        let paramCount = 0;

        if (filters.search) {
            paramCount++;
            query += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount} OR model ILIKE $${paramCount})`;
            values.push(`%${filters.search}%`);
        }

        query += ' ORDER BY type ASC';

        if (filters.limit) {
            paramCount++;
            query += ` LIMIT $${paramCount}`;
            values.push(filters.limit);
        }

        const result = await db.query(query, values);
        return result.rows.map(data => new Device(data));
    }

    /**
     * Update device
     */
    async update(updateData) {
        const allowedFields = ['type', 'name', 'description', 'model'];
        const updates = [];
        const values = [];
        let paramCount = 0;

        for (const [key, value] of Object.entries(updateData)) {
            if (allowedFields.includes(key) && value !== undefined) {
                paramCount++;
                updates.push(`${key} = $${paramCount}`);
                values.push(value);
            }
        }

        if (updates.length === 0) {
            throw new Error('No valid fields to update');
        }

        updates.push(`updatedat = CURRENT_TIMESTAMP`);
        paramCount++;
        values.push(this.id);

        const query = `
            UPDATE device 
            SET ${updates.join(', ')}
            WHERE id = $${paramCount}
            RETURNING *
        `;

        try {
            const result = await db.query(query, values);
            
            if (result.rows.length === 0) {
                throw new Error('Device not found');
            }

            // Update current instance
            Object.assign(this, result.rows[0]);
            return this;
        } catch (error) {
            if (error && typeof error === 'object' && 'code' in error && error.code === '23505') { // Unique constraint violation
                throw new Error('Device name already exists');
            }
            throw error;
        }
    }

    /**
     * Delete device
     */
    async delete() {
        const query = 'DELETE FROM device WHERE id = $1 RETURNING *';
        const result = await db.query(query, [this.id]);
        
        if (result.rows.length === 0) {
            throw new Error('Device not found');
        }

        return true;
    }

    /**
     * Convert to JSON
     */
    toJSON() {
        return {
            id: this.id,
            type: this.type, 
            manufacturer: this.manufacturer,
            model_number: this.model_number,
            description: this.description,
            createdAt: this.created_at,
            updatedAt: this.updated_at
        };
    }
}

module.exports = Device;