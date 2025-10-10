/**
 * Building Model for PostgreSQL
 * Replaces the Mongoose Building model
 */

const db = require('../config/database');

class Building {
    constructor(buildingData = {}) {
        this.id = buildingData.id;
        this.name = buildingData.name;
        this.address_street = buildingData.address_street;
        this.address_city = buildingData.address_city;
        this.address_state = buildingData.address_state;
        this.address_zip_code = buildingData.address_zip_code;
        this.address_country = buildingData.address_country;
        this.contact_primarycontact = buildingData.contact_primarycontact;
        this.contact_email = buildingData.contact_email;
        this.contact_phone = buildingData.contact_phone;
        this.contact_website = buildingData.contact_website;
        this.type = buildingData.type;
        this.status = buildingData.status || 'active';
        this.totalfloors = buildingData.totalfloors;
        this.totalunits = buildingData.totalunits;
        this.yearbuilt = buildingData.yearbuilt;
        this.squarefootage = buildingData.squarefootage;
        this.description = buildingData.description;
        this.notes = buildingData.notes;
        this.equipmentcount = buildingData.equipmentcount || 0;
        this.metercount = buildingData.metercount || 0;
        this.createdat = buildingData.createdat;
        this.updatedat = buildingData.updatedat;
    }

    /**
     * Create a new building
     */
    static async create(buildingData) {
        const {
            name, address_street, address_city, address_state, address_zip_code, address_country,
            contact_primarycontact, contact_email, contact_phone, contact_website,
            type, status, totalfloors, totalunits, yearbuilt, squarefootage,
            description, notes
        } = buildingData;

        const query = `
            INSERT INTO buildings (
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
     * Find building by ID
     */
    static async findById(id) {
        const query = 'SELECT * FROM buildings WHERE id = $1';
        const result = await db.query(query, [id]);
        
        if (result.rows.length === 0) {
            return null;
        }
        
        return new Building(result.rows[0]);
    }

    /**
     * Find all buildings with optional filters
     */
    static async findAll(filters = {}) {
        let query = 'SELECT * FROM buildings WHERE 1=1';
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

        if (filters.search) {
            paramCount++;
            query += ` AND (name ILIKE $${paramCount} OR address_city ILIKE $${paramCount})`;
            values.push(`%${filters.search}%`);
        }

        query += ' ORDER BY name ASC';

        if (filters.limit) {
            paramCount++;
            query += ` LIMIT $${paramCount}`;
            values.push(filters.limit);
        }

        const result = await db.query(query, values);
        return result.rows.map(data => new Building(data));
    }

    /**
     * Update building
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
                updates.push(`${key} = $${paramCount}`);
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
            UPDATE buildings 
            SET ${updates.join(', ')}
            WHERE id = $${paramCount}
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
     * Delete building (soft delete by setting status to inactive)
     */
    async delete() {
        const query = `
            UPDATE buildings 
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
     * Get building statistics
     */
    static async getStats() {
        const query = `
            SELECT 
                COUNT(*) as total_buildings,
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active_buildings,
                COUNT(CASE WHEN type = 'office' THEN 1 END) as office_buildings,
                COUNT(CASE WHEN type = 'warehouse' THEN 1 END) as warehouse_buildings,
                COUNT(CASE WHEN type = 'retail' THEN 1 END) as retail_buildings,
                COUNT(CASE WHEN type = 'residential' THEN 1 END) as residential_buildings,
                COUNT(CASE WHEN type = 'industrial' THEN 1 END) as industrial_buildings,
                SUM(equipmentcount) as total_equipment,
                SUM(metercount) as total_meters
            FROM buildings
        `;

        const result = await db.query(query);
        return result.rows[0];
    }

    /**
     * Update equipment count for a building
     */
    async updateEquipmentCount() {
        const query = `
            UPDATE buildings 
            SET equipmentcount = (
                SELECT COUNT(*) FROM equipment WHERE buildingid = $1
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
     * Update meter count for a building
     */
    async updateMeterCount() {
        const query = `
            UPDATE buildings 
            SET metercount = (
                SELECT COUNT(*) FROM meters WHERE location_building = $1
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