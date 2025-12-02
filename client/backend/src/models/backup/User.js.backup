/**
 * User Model for PostgreSQL
 * Replaces the Mongoose User model
 */

const bcrypt = require('bcryptjs');
const db = require('../config/database');

class User {
    constructor(userData = {}) {
        this.id = userData.id;
        this.tenant_id = userData.tenant_id;
        this.email = userData.email;
        this.name = userData.name;
        this.password_hash = userData.password_hash || userData.passwordhash;
        this.role = userData.role || 'viewer';
        this.permissions = userData.permissions || [];
        this.status = userData.status || 'active';
        this.last_login = userData.last_login || userData.lastlogin;
        this.created_at = userData.created_at || userData.createdat;
        this.updated_at = userData.updated_at || userData.updatedat;
    }

    /**
     * Helper to parse user data from database
     * @param {any} row 
     * @returns {any}
     */
    static parseUserData(row) {
        const userData = /** @type {any} */(row);
        // Parse JSON fields
        if (userData.permissions && typeof userData.permissions === 'string') {
            userData.permissions = JSON.parse(userData.permissions);
        }
        return userData;
    }

    /**
     * Create a new user
     */
    static async create(userData) {
        const { email, name, password, role, permissions, status, tenant_id } = userData;
        
        // Hash the password
        const saltRounds = 12;
        const passwordhash = await bcrypt.hash(password, saltRounds);

        const query = `
            INSERT INTO users (email, name, password_hash, role, permissions, status, tenant_id,
                               created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7,
                    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING *
        `;

        const values = [
            email,
            name,
            passwordhash,
            role || 'viewer',
            JSON.stringify(permissions || []),
            status || 'active',
            tenant_id,
        ];

        try {
            const result = await db.query(query, values);
            return new User(result.rows[0]);
        } catch (error) {
            if (error && typeof error === 'object' && 'code' in error && error.code === '23505') { // Unique constraint violation
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

        return new User(this.parseUserData(result.rows[0]));
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

        return new User(this.parseUserData(result.rows[0]));
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

        // Add sorting - map frontend field names to database column names
        const sortFieldMap = {
            'name': 'name',
            'email': 'email', 
            'role': 'role',
            'status': 'status',
            'createdAt': 'created_at',
            'updatedAt': 'updated_at',
            'createdat': 'created_at',
            'updatedat': 'updated_at',
            'created_at': 'created_at',
            'updated_at': 'updated_at'
        };
        const sortField = sortFieldMap[sortBy] || 'created_at';
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
            // For count query, exclude LIMIT and OFFSET parameters
            let countValues = [...values];
            if (limit) countValues.pop(); // Remove limit parameter
            if (offset) countValues.pop(); // Remove offset parameter
            
            const [usersResult, countResult] = await Promise.all([
                db.query(query, values),
                db.query(countQuery, countValues)
            ]);

            const users = usersResult.rows.map(row => {
                return new User(this.parseUserData(row));
            });

            return {
                users,
                total: parseInt(/** @type {any} */(countResult.rows[0]).count)
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
        updates.push(`updated_at = CURRENT_TIMESTAMP`);
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

        const userData = User.parseUserData(result.rows[0]);

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
            SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *
        `;

        const result = await db.query(query, [passwordhash, this.id]);
        
        if (result.rows.length === 0) {
            throw new Error('User not found');
        }

        this.password_hash = passwordhash;
        this.updated_at = /** @type {any} */(result.rows[0]).updated_at;
        return this;
    }

    /**
     * Update last login timestamp
     */
    async updateLastLogin() {
        const query = `
            UPDATE users 
            SET last_login = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING last_login
        `;

        const result = await db.query(query, [this.id]);
        
        if (result.rows.length > 0) {
            this.last_login = /** @type {any} */(result.rows[0]).last_login;
        }

        return this;
    }

    /**
     * Compare password
     */
    async comparePassword(password) {
        return await bcrypt.compare(password, this.password_hash);
    }

    /**
     * Delete user (soft delete by setting status to inactive)
     */
    async delete() {
        const query = `
            UPDATE users 
            SET status = 'inactive', updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `;

        const result = await db.query(query, [this.id]);
        
        if (result.rows.length === 0) {
            throw new Error('User not found');
        }

        this.status = 'inactive';
        this.updated_at = /** @type {any} */(result.rows[0]).updated_at;
        return this;
    }

    /**
     * Convert to JSON (exclude sensitive data)
     */
    toJSON() {
        const { password_hash, ...userWithoutPassword } = this;
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