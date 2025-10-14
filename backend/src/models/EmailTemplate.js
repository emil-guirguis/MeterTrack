/**
 * Email Template Model for PostgreSQL
 * Handles email template management for the facility management system
 */

const db = require('../config/database');

class EmailTemplate {
    constructor(templateData = {}) {
        this.id = templateData.id;
        this.name = templateData.name;
        this.subject = templateData.subject;
        this.content = templateData.content;
        this.category = templateData.category;
        this.variables = templateData.variables || [];
        this.isdefault = templateData.isdefault || false;
        this.isactive = templateData.isactive !== undefined ? templateData.isactive : true;
        this.usagecount = templateData.usagecount || 0;
        this.lastused = templateData.lastused;
        this.createdby = templateData.createdby;
        this.createdat = templateData.createdat;
        this.updatedat = templateData.updatedat;
    }

    /**
     * Create a new email template
     */
    static async create(templateData) {
        const { name, subject, content, category, variables, isDefault, createdBy } = templateData;
        
        const query = `
            INSERT INTO email_templates (name, subject, content, category, variables, isdefault, isactive, usagecount, createdby, createdat, updatedat)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING *
        `;

        const values = [
            name,
            subject,
            content,
            category,
            JSON.stringify(variables || []),
            isDefault || false,
            true, // isactive
            0, // usagecount
            createdBy
        ];

        try {
            const result = await db.query(query, values);
            return new EmailTemplate(result.rows[0]);
        } catch (error) {
            if (error.code === '23505') { // Unique constraint violation
                throw new Error('Template name already exists');
            }
            throw error;
        }
    }

    /**
     * Find template by ID
     */
    static async findById(id) {
        const query = 'SELECT * FROM email_templates WHERE id = $1';
        const result = await db.query(query, [id]);
        
        if (result.rows.length === 0) {
            return null;
        }

        const templateData = result.rows[0];
        // Parse JSON fields
        if (templateData.variables && typeof templateData.variables === 'string') {
            templateData.variables = JSON.parse(templateData.variables);
        }
        
        return new EmailTemplate(templateData);
    }

    /**
     * Find template by name
     */
    static async findByName(name) {
        const query = 'SELECT * FROM email_templates WHERE name = $1';
        const result = await db.query(query, [name]);
        
        if (result.rows.length === 0) {
            return null;
        }

        const templateData = result.rows[0];
        // Parse JSON fields
        if (templateData.variables && typeof templateData.variables === 'string') {
            templateData.variables = JSON.parse(templateData.variables);
        }
        
        return new EmailTemplate(templateData);
    }

    /**
     * Find all templates with optional filters
     */
    static async findAll(options = {}) {
        const { filters = {}, sortBy = 'createdat', sortOrder = 'desc', limit, offset, search } = options;
        
        let query = 'SELECT * FROM email_templates WHERE 1=1';
        let countQuery = 'SELECT COUNT(*) FROM email_templates WHERE 1=1';
        const values = [];
        let paramCount = 0;

        // Apply filters
        if (filters.category) {
            paramCount++;
            const condition = ` AND category = $${paramCount}`;
            query += condition;
            countQuery += condition;
            values.push(filters.category);
        }

        if (filters.isActive !== undefined) {
            paramCount++;
            const condition = ` AND isactive = $${paramCount}`;
            query += condition;
            countQuery += condition;
            values.push(filters.isActive);
        }

        if (filters.isDefault !== undefined) {
            paramCount++;
            const condition = ` AND isdefault = $${paramCount}`;
            query += condition;
            countQuery += condition;
            values.push(filters.isDefault);
        }

        // Apply search
        if (search) {
            paramCount++;
            const condition = ` AND (name ILIKE $${paramCount} OR subject ILIKE $${paramCount} OR content ILIKE $${paramCount})`;
            query += condition;
            countQuery += condition;
            values.push(`%${search}%`);
        }

        // Add sorting
        // Map frontend field names to database column names
        const sortFieldMap = {
            'name': 'name',
            'subject': 'subject',
            'category': 'category',
            'usagecount': 'usagecount',
            'lastused': 'lastused',
            'createdat': 'createdat',
            'updatedat': 'updatedat',
            'createdAt': 'createdat',
            'updatedAt': 'updatedat'
        };
        const sortField = sortFieldMap[sortBy] || 'createdat';
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
            const [templatesResult, countResult] = await Promise.all([
                db.query(query, values),
                db.query(countQuery, values.slice(0, paramCount - (limit ? 1 : 0) - (offset ? 1 : 0)))
            ]);

            const templates = templatesResult.rows.map(templateData => {
                // Parse JSON fields
                if (templateData.variables && typeof templateData.variables === 'string') {
                    templateData.variables = JSON.parse(templateData.variables);
                }
                return new EmailTemplate(templateData);
            });

            return {
                templates,
                total: parseInt(countResult.rows[0].count)
            };
        } catch (error) {
            console.error('Error in EmailTemplate.findAll:', error);
            throw error;
        }
    }

    /**
     * Update template
     */
    async update(updateData) {
        const allowedFields = ['name', 'subject', 'content', 'category', 'variables', 'isactive'];
        const updates = [];
        const values = [];
        let paramCount = 0;

        for (const [key, value] of Object.entries(updateData)) {
            if (allowedFields.includes(key) && value !== undefined) {
                paramCount++;
                updates.push(`${key} = $${paramCount}`);
                
                if (key === 'variables') {
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
            UPDATE email_templates 
            SET ${updates.join(', ')}
            WHERE id = $${paramCount}
            RETURNING *
        `;

        const result = await db.query(query, values);
        
        if (result.rows.length === 0) {
            throw new Error('Template not found');
        }

        const templateData = result.rows[0];
        // Parse JSON fields
        if (templateData.variables && typeof templateData.variables === 'string') {
            templateData.variables = JSON.parse(templateData.variables);
        }

        // Update current instance
        Object.assign(this, templateData);
        return this;
    }

    /**
     * Increment usage count
     */
    async incrementUsage() {
        const query = `
            UPDATE email_templates 
            SET usagecount = usagecount + 1, lastused = CURRENT_TIMESTAMP, updatedat = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING usagecount, lastused
        `;

        const result = await db.query(query, [this.id]);
        
        if (result.rows.length > 0) {
            this.usagecount = result.rows[0].usagecount;
            this.lastused = result.rows[0].lastused;
        }

        return this;
    }

    /**
     * Delete template (soft delete by setting isactive to false)
     */
    async delete() {
        // Check if template is in use (has usage count > 0)
        if (this.usagecount > 0) {
            throw new Error('Cannot delete template that has been used. Set to inactive instead.');
        }

        const query = `
            UPDATE email_templates 
            SET isactive = false, updatedat = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `;

        const result = await db.query(query, [this.id]);
        
        if (result.rows.length === 0) {
            throw new Error('Template not found');
        }

        this.isactive = false;
        this.updatedat = result.rows[0].updatedat;
        return this;
    }

    /**
     * Hard delete template (only for unused templates)
     */
    async hardDelete() {
        // Check if template is in use
        if (this.usagecount > 0) {
            throw new Error('Cannot delete template that has been used');
        }

        const query = 'DELETE FROM email_templates WHERE id = $1 RETURNING id';
        const result = await db.query(query, [this.id]);
        
        if (result.rows.length === 0) {
            throw new Error('Template not found');
        }

        return true;
    }

    /**
     * Get template statistics
     */
    static async getStats() {
        const query = `
            SELECT 
                COUNT(*) as total_templates,
                COUNT(CASE WHEN isactive = true THEN 1 END) as active_templates,
                COUNT(CASE WHEN isdefault = true THEN 1 END) as default_templates,
                COUNT(CASE WHEN category = 'meter_readings' THEN 1 END) as meter_reading_templates,
                COUNT(CASE WHEN category = 'meter_errors' THEN 1 END) as meter_error_templates,
                COUNT(CASE WHEN category = 'maintenance' THEN 1 END) as maintenance_templates,
                COUNT(CASE WHEN category = 'general' THEN 1 END) as general_templates,
                SUM(usagecount) as total_usage,
                AVG(usagecount) as average_usage
            FROM email_templates
        `;

        const result = await db.query(query);
        return result.rows[0];
    }

    /**
     * Get templates by category
     */
    static async findByCategory(category) {
        const query = 'SELECT * FROM email_templates WHERE category = $1 AND isactive = true ORDER BY name';
        const result = await db.query(query, [category]);
        
        return result.rows.map(templateData => {
            // Parse JSON fields
            if (templateData.variables && typeof templateData.variables === 'string') {
                templateData.variables = JSON.parse(templateData.variables);
            }
            return new EmailTemplate(templateData);
        });
    }

    /**
     * Get available template categories
     */
    static getCategories() {
        return [
            'meter_readings',
            'meter_errors',
            'maintenance',
            'general'
        ];
    }

    /**
     * Validate template content for variables
     */
    static validateTemplate(content, variables = []) {
        const variablePattern = /\{\{([^}]+)\}\}/g;
        const foundVariables = [];
        let match;

        while ((match = variablePattern.exec(content)) !== null) {
            const variableName = match[1].trim();
            if (!foundVariables.includes(variableName)) {
                foundVariables.push(variableName);
            }
        }

        const definedVariables = variables.map(v => v.name);
        const missingVariables = foundVariables.filter(v => !definedVariables.includes(v));
        const unusedVariables = definedVariables.filter(v => !foundVariables.includes(v));

        return {
            isValid: missingVariables.length === 0,
            foundVariables,
            missingVariables,
            unusedVariables
        };
    }

    /**
     * Convert to JSON (clean format)
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            subject: this.subject,
            content: this.content,
            category: this.category,
            variables: this.variables,
            isDefault: this.isdefault,
            isActive: this.isactive,
            usageCount: this.usagecount,
            lastUsed: this.lastused,
            createdBy: this.createdby,
            createdAt: this.createdat,
            updatedAt: this.updatedat
        };
    }
}

module.exports = EmailTemplate;