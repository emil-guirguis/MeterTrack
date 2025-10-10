/**
 * User Model for PostgreSQL
 * Replaces the Mongoose User model
 */

const bcrypt = require('bcryptjs');
const db = require('../config/database');

class User {
    constructor(userData = {}) {
        this.id = userData.id;
        this.email = userData.email;
        this.name = userData.name;
        this.passwordhash = userData.passwordhash;
        this.role = userData.role || 'viewer';
        this.permissions = userData.permissions || [];
        this.status = userData.status || 'active';
        this.lastlogin = userData.lastlogin;
        this.createdat = userData.createdat;
        this.updatedat = userData.updatedat;
    }

    /**
     * Create a new user
     */
    static async create(userData) {
        const { email, name, password, role, permissions, status } = userData;
        
        // Hash the password
        const saltRounds = 12;
        const passwordhash = await bcrypt.hash(password, saltRounds);

        const query = `
            INSERT INTO users (email, name, passwordhash, role, permissions, status, createdat, updatedat)
            VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING *
        `;

        const values = [
            email,
            name,
            passwordhash,
            role || 'viewer',
            JSON.stringify(permissions || []),
            status || 'active'
        ];

        try {
            const result = await db.query(query, values);
            return new User(result.rows[0]);
        } catch (error) {
            if (error.code === '23505') { // Unique constraint violation
                throw new Error('Email already exists');
            }
            throw error;
        }
    }

    /**
     * Find user by email
     */
    static async findByEmail(email) {
        const query = 'SELECT * FROM users WHERE email = $1';
        const result = await db.query(query, [email]);
        
        if (result.rows.length === 0) {
            return null;
        }

        const userData = result.rows[0];
        // Parse JSON fields
        if (userData.permissions && typeof userData.permissions === 'string') {
            userData.permissions = JSON.parse(userData.permissions);
        }
        
        return new User(userData);
    }

    /**
     * Find user by ID
     */
    static async findById(id) {
        const query = 'SELECT * FROM users WHERE id = $1';
        const result = await db.query(query, [id]);
        
        if (result.rows.length === 0) {
            return null;
        }

        const userData = result.rows[0];
        // Parse JSON fields
        if (userData.permissions && typeof userData.permissions === 'string') {
            userData.permissions = JSON.parse(userData.permissions);
        }
        
        return new User(userData);
    }

    /**
     * Find all users with optional filters
     */
    static async findAll(options = {}) {
        const { filters = {}, sortBy = 'createdat', sortOrder = 'desc', limit, offset, search } = options;
        
        let query = 'SELECT * FROM users WHERE 1=1';
        let countQuery = 'SELECT COUNT(*) FROM users WHERE 1=1';
        const values = [];
        let paramCount = 0;

        // Apply filters
        if (filters.role) {
            paramCount++;
            const condition = ` AND role = $${paramCount}`;
            query += condition;
            countQuery += condition;
            values.push(filters.role);
        }

        if (filters.status) {
            paramCount++;
            const condition = ` AND status = $${paramCount}`;
            query += condition;
            countQuery += condition;
            values.push(filters.status);
        }

        // Apply search
        if (search) {
            paramCount++;
            const condition = ` AND (name ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
            query += condition;
            countQuery += condition;
            values.push(`%${search}%`);
        }

        // Add sorting
        const validSortFields = ['name', 'email', 'role', 'status', 'createdat', 'updatedat'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdat';
        const sortDirection = sortOrder === 'asc' ? 'ASC' : 'DESC';
        query += ` ORDER BY ${sortField} ${sortDirection}`;

        // Add pagination
        if (limit) {
            paramCount++;
            query += ` LIMIT $${paramCount}`;
            values.push(limit);
        }

        if (offset) {
            paramCount++;
            query += ` OFFSET $${paramCount}`;
            values.push(offset);
        }

        try {
            // Execute both queries
            const [usersResult, countResult] = await Promise.all([
                db.query(query, values),
                db.query(countQuery, values.slice(0, paramCount - (limit ? 1 : 0) - (offset ? 1 : 0)))
            ]);

            const users = usersResult.rows.map(userData => {
                // Parse JSON fields
                if (userData.permissions && typeof userData.permissions === 'string') {
                    userData.permissions = JSON.parse(userData.permissions);
                }
                return new User(userData);
            });

            return {
                users,
                total: parseInt(countResult.rows[0].count)
            };
        } catch (error) {
            console.error('Error in User.findAll:', error);
            throw error;
        }
    }

    /**
     * Update user
     */
    async update(updateData) {
        const allowedFields = ['name', 'role', 'permissions', 'status'];
        const updates = [];
        const values = [];
        let paramCount = 0;

        for (const [key, value] of Object.entries(updateData)) {
            if (allowedFields.includes(key) && value !== undefined) {
                paramCount++;
                updates.push(`${key} = $${paramCount}`);
                
                if (key === 'permissions') {
                    values.push(JSON.stringify(value));
                } else {
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
            UPDATE users 
            SET ${updates.join(', ')}
            WHERE id = $${paramCount}
            RETURNING *
        `;

        const result = await db.query(query, values);
        
        if (result.rows.length === 0) {
            throw new Error('User not found');
        }

        const userData = result.rows[0];
        // Parse JSON fields
        if (userData.permissions && typeof userData.permissions === 'string') {
            userData.permissions = JSON.parse(userData.permissions);
        }

        // Update current instance
        Object.assign(this, userData);
        return this;
    }

    /**
     * Update password
     */
    async updatePassword(newPassword) {
        const saltRounds = 12;
        const passwordhash = await bcrypt.hash(newPassword, saltRounds);

        const query = `
            UPDATE users 
            SET passwordhash = $1, updatedat = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *
        `;

        const result = await db.query(query, [passwordhash, this.id]);
        
        if (result.rows.length === 0) {
            throw new Error('User not found');
        }

        this.passwordhash = passwordhash;
        this.updatedat = result.rows[0].updatedat;
        return this;
    }

    /**
     * Update last login timestamp
     */
    async updateLastLogin() {
        const query = `
            UPDATE users 
            SET lastlogin = CURRENT_TIMESTAMP, updatedat = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING lastlogin
        `;

        const result = await db.query(query, [this.id]);
        
        if (result.rows.length > 0) {
            this.lastlogin = result.rows[0].lastlogin;
        }

        return this;
    }

    /**
     * Compare password
     */
    async comparePassword(password) {
        return await bcrypt.compare(password, this.passwordhash);
    }

    /**
     * Delete user (soft delete by setting status to inactive)
     */
    async delete() {
        const query = `
            UPDATE users 
            SET status = 'inactive', updatedat = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `;

        const result = await db.query(query, [this.id]);
        
        if (result.rows.length === 0) {
            throw new Error('User not found');
        }

        this.status = 'inactive';
        this.updatedat = result.rows[0].updatedat;
        return this;
    }

    /**
     * Convert to JSON (exclude sensitive data)
     */
    toJSON() {
        const { passwordhash, ...userWithoutPassword } = this;
        return userWithoutPassword;
    }

    /**
     * Get user statistics
     */
    static async getStats() {
        const query = `
            SELECT 
                COUNT(*) as total_users,
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
                COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_users,
                COUNT(CASE WHEN role = 'manager' THEN 1 END) as manager_users,
                COUNT(CASE WHEN role = 'technician' THEN 1 END) as technician_users,
                COUNT(CASE WHEN role = 'viewer' THEN 1 END) as viewer_users
            FROM users
        `;

        const result = await db.query(query);
        return result.rows[0];
    }
}

module.exports = User;