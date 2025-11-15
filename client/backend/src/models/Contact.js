/**
 * Contact Model for PostgreSQL
 * Replaces the Mongoose Contact model
 */

const db = require('../config/database');

class Contact {
    /**
     * Count all contacts with optional filters
     */
    static async countAll(filters = {}) {
        let query = 'SELECT COUNT(*) FROM contact WHERE 1=1';
        const values = [];
        let paramCount = 0;

        if (filters.category) {
            paramCount++;
            query += ` AND category = $${paramCount}`;
            values.push(filters.category);
        }

        if (filters.status) {
            paramCount++;
            query += ` AND status = $${paramCount}`;
            values.push(filters.status);
        }

        if (filters.search) {
            paramCount++;
            query += ` AND (name ILIKE $${paramCount} OR company ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
            values.push(`%${filters.search}%`);
        }

        const result = await db.query(query, values);
        return parseInt(result.rows[0].count, 10);
    }
    constructor(contactData = {}) {
        this.id = contactData.id;
        this.name = contactData.name;
        this.company = contactData.company;
        this.role = contactData.role;
        this.email = contactData.email;
        this.phone = contactData.phone;
        this.address = contactData.address;
        this.address2 = contactData.address2;
        this.city = contactData.city;
        this.state = contactData.state;
        this.zip = contactData.zip;
        this.country = contactData.country;
        this.active = contactData.active;
        this.notes = contactData.notes;
        this.createdat = contactData.created_at;
        this.updated_at = contactData.updated_at;
    }

    /**
     * Create new contact
     */
    static async create(contactData) {
        const {
            name, company, role, email, phone, address, address2, city,
            state, zip, country, active, notes
        } = contactData;

        const query = `
            INSERT INTO contact (
                name, company, role, email, phone, address, address2, city,
                state, zip, country, active, notes,
                created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 
                      $9, $10, $11, $12, $13, 
                      CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING *
        `;

        const values = [
                name, company, role, email, phone, address, address2, city,
                state, zip, country, active, notes,
        ];

        try {
            const result = await db.query(query, values);
            return new Contact(result.rows[0]);
        } catch (error) {
            if (error.code === '23505') { // Unique constraint violation
                throw new Error('Email already exists');
            }
            throw error;
        }
    }

    /**
     * Find contact by ID
     */
    static async findById(id) {
        const query = 'SELECT * FROM contact WHERE id = $1';
        const result = await db.query(query, [id]);

        if (result.rows.length === 0) {
            return null;
        }

        return new Contact(result.rows[0]);
    }

    /**
     * Find contact by email
     */
    static async findByEmail(email) {
        const query = 'SELECT * FROM contact WHERE email = $1';
        const result = await db.query(query, [email]);

        if (result.rows.length === 0) {
            return null;
        }

        return new Contact(result.rows[0]);
    }

    /**
     * Find all contacts with optional filters
     */
    static async findAll(filters = {}) {
        let query = 'SELECT * FROM contact WHERE 1=1';
        const values = [];
        let paramCount = 0;

        if (filters.category) {
            paramCount++;
            query += ` AND category = $${paramCount}`;
            values.push(filters.category);
        }

        if (filters.status) {
            paramCount++;
            query += ` AND status = $${paramCount}`;
            values.push(filters.status);
        }

        if (filters.search) {
            paramCount++;
            query += ` AND (name ILIKE $${paramCount} OR company ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
            values.push(`%${filters.search}%`);
        }

        query += ' ORDER BY name ASC';

        if (filters.limit) {
            paramCount++;
            query += ` LIMIT $${paramCount}`;
            values.push(filters.limit);
        }

        if (filters.offset) {
            paramCount++;
            query += ` OFFSET $${paramCount}`;
            values.push(filters.offset);
        }

        const result = await db.query(query, values);
        return result.rows.map(data => new Contact(data));
    }

    /**
     * Update contact
     */
    async update(updateData) {
        const allowedFields = [
            'name', 'company', 'role', 'email', 'phone', 'address', 'address2', 'city',
            'state', 'zip', 'country', 'category', 'active', 'notes'
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
            UPDATE contact 
            SET ${updates.join(', ')}
            WHERE id = $${paramCount}
            RETURNING *
        `;

        try {
            const result = await db.query(query, values);

            if (result.rows.length === 0) {
                throw new Error('Contact not found');
            }

            // Update current instance
            Object.assign(this, result.rows[0]);
            return this;
        } catch (error) {
            if (error.code === '23505') { // Unique constraint violation
                throw new Error('Email already exists');
            }
            throw error;
        }
    }

    /**
     * Delete contact (soft delete)
     */
    async delete() {
        const query = `
            UPDATE contact 
            SET active = 'false', updatedat = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `;

        const result = await db.query(query, [this.id]);

        if (result.rows.length === 0) {
            throw new Error('Contact not found');
        }

        this.active = false;
        this.updatedat = result.rows[0].updatedat;
        return this;
    }

    /**
     * Get contact statistics
     */
    static async getStats() {
        const query = `
            SELECT 
                COUNT(*) as total_contacts,
                COUNT(CASE WHEN active = true THEN 1 END) as active_contacts,
                COUNT(CASE WHEN category = 'vendor' THEN 1 END) as vendor_contacts,
                COUNT(CASE WHEN category = 'contractor' THEN 1 END) as contractor_contacts,
                COUNT(CASE WHEN category = 'client' THEN 1 END) as client_contacts,
                COUNT(CASE WHEN category = 'technician' THEN 1 END) as technician_contacts,
                COUNT(DISTINCT company) as unique_companies
            FROM contact
        `;

        const result = await db.query(query);
        return result.rows[0];
    }

    /**
     * Find contacts by category
     */
    static async findByCategory(category) {
        const query = 'SELECT * FROM contact WHERE category = $1 AND status = $2 ORDER BY name ASC';
        const result = await db.query(query, [category, 'active']);
        return result.rows.map(data => new Contact(data));
    }

    /**
     * Get full address as string
     */
    get fullAddress() {
        const parts = [
            this.street,
            this.city,
            this.state,
            this.zip_code,
            this.country
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

module.exports = Contact;

