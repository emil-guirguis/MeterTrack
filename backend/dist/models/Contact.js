"use strict";
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
        let query = 'SELECT COUNT(*) FROM contacts WHERE 1=1';
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
        this.address_street = contactData.address_street;
        this.address_city = contactData.address_city;
        this.address_state = contactData.address_state;
        this.address_zip_code = contactData.address_zip_code;
        this.address_country = contactData.address_country;
        this.category = contactData.category;
        this.status = contactData.status || 'active';
        this.notes = contactData.notes;
        this.createdat = contactData.createdat;
        this.updatedat = contactData.updatedat;
    }
    /**
     * Create new contact
     */
    static async create(contactData) {
        const { name, company, role, email, phone, address_street, address_city, address_state, address_zip_code, address_country, category, status, notes } = contactData;
        const query = `
            INSERT INTO contacts (
                name, company, role, email, phone, address_street, address_city,
                address_state, address_zip_code, address_country, category, status, notes,
                createdat, updatedat
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING *
        `;
        const values = [
            name, company, role, email, phone, address_street, address_city,
            address_state, address_zip_code, address_country, category, status || 'active', notes
        ];
        try {
            const result = await db.query(query, values);
            return new Contact(result.rows[0]);
        }
        catch (error) {
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
        const query = 'SELECT * FROM contacts WHERE id = $1';
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
        const query = 'SELECT * FROM contacts WHERE email = $1';
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
        let query = 'SELECT * FROM contacts WHERE 1=1';
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
            'name', 'company', 'role', 'email', 'phone', 'address_street', 'address_city',
            'address_state', 'address_zip_code', 'address_country', 'category', 'status', 'notes'
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
            UPDATE contacts 
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
        }
        catch (error) {
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
            UPDATE contacts 
            SET status = 'inactive', updatedat = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `;
        const result = await db.query(query, [this.id]);
        if (result.rows.length === 0) {
            throw new Error('Contact not found');
        }
        this.status = 'inactive';
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
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active_contacts,
                COUNT(CASE WHEN category = 'vendor' THEN 1 END) as vendor_contacts,
                COUNT(CASE WHEN category = 'contractor' THEN 1 END) as contractor_contacts,
                COUNT(CASE WHEN category = 'client' THEN 1 END) as client_contacts,
                COUNT(CASE WHEN category = 'technician' THEN 1 END) as technician_contacts,
                COUNT(DISTINCT company) as unique_companies
            FROM contacts
        `;
        const result = await db.query(query);
        return result.rows[0];
    }
    /**
     * Find contacts by category
     */
    static async findByCategory(category) {
        const query = 'SELECT * FROM contacts WHERE category = $1 AND status = $2 ORDER BY name ASC';
        const result = await db.query(query, [category, 'active']);
        return result.rows.map(data => new Contact(data));
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
module.exports = Contact;
//# sourceMappingURL=Contact.js.map