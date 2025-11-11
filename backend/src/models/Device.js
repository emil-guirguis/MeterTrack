const db = require('../config/database');

class Device {
    constructor(deviceData = {}) {
        this.id = deviceData.id;
        this.type = deviceData.type;
        this.description = deviceData.description;
        this.brand = deviceData.brand;
        this.model_number = deviceData.model_number;
        this.createdat = deviceData.createdat;
        this.updatedat = deviceData.updatedat;
    }

    /**
     * Create new device
     */
    static async create(deviceData) {
        const {
            brand,model_number,type, description,  createdat, updatedat
        } = deviceData;

        const query = `
            INSERT INTO device (
                brand,model_number,type, description, createdat, updatedat
            ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING *
        `;

        const values = [brand,model_number,type, description];

        try {
            const result = await db.query(query, values);
            return new Device(result.rows[0]);
        } catch (error) {
            if (error.code === '23505') { // Unique constraint violation
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

        query += ' ORDER BY name ASC';

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
        const allowedFields = ['name', 'description', 'model'];
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
            if (error.code === '23505') { // Unique constraint violation
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
            brand: this.brand,
            model_number: this.model_number,
            type: this.type, 
            description: this.description,
            createdAt: this.createdat,
            updatedAt: this.updatedat
        };
    }
}

module.exports = Device;