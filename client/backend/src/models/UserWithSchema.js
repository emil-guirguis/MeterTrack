/**
 * Users Model with Schema Definition
 * 
 * Migrated to single-source-of-truth schema system
 * Single source of truth for Users entity
 */

const BaseModel = require('../../../../framework/backend/api/base/BaseModel');
const { defineSchema, field, relationship, FieldTypes, RelationshipTypes } = require('../../../../framework/backend/api/base/SchemaDefinition');

class User extends BaseModel {
    constructor(data = {}) {
        super(data);
        
        // Auto-initialize all fields from schema
        User.schema.initializeFromData(this, data);
    }
    
    /**
     * @override
     * @returns {string}
     */
    static get tableName() {
        return 'users';
    }
    
    /**
     * @override
     * @returns {string}
     */
    static get primaryKey() {
        return 'id';
    }

    // ===== SCHEMA DEFINITION (Single Source of Truth) =====
    
    /**
     * @override
     */
        static get schema() {
        return defineSchema({
            entityName: 'User',
            tableName: 'users',
            description: 'User entity for authentication and authorization',
            
            // Form fields - user can edit these
            formFields: {
                name: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: true,
                    label: 'Name',
                    dbField: 'name',
                    maxLength: 100,
                }),
                email: field({
                    type: FieldTypes.EMAIL,
                    default: '',
                    required: true,
                    label: 'Email',
                    dbField: 'email',
                    maxLength: 254,
                }),
                passwordHash: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: false,
                    label: 'Password Hash',
                    dbField: 'passwordhash',
                    maxLength: 200,
                    readOnly: true,
                }),
                role: field({
                    type: FieldTypes.STRING,
                    default: 'viewer',
                    required: false,
                    label: 'Role',
                    dbField: 'role',
                    maxLength: 20,
                    enumValues: ['admin', 'manager', 'technician', 'viewer'],
                }),
                permissions: field({
                    type: FieldTypes.ARRAY,
                    default: [],
                    required: false,
                    label: 'Permissions',
                    dbField: 'permissions',
                }),
                active: field({
                    type: FieldTypes.BOOLEAN,
                    default: true,
                    required: false,
                    label: 'Active Status',
                    dbField: 'active',
                }),
                lastLogin: field({
                    type: FieldTypes.DATE,
                    default: null,
                    required: false,
                    label: 'Last Login',
                    dbField: 'last_sign_in_at',
                    readOnly: true,
                })
            },
            
            // Entity fields - read-only, system-managed
            entityFields: {
                id: field({
                    type: FieldTypes.NUMBER,
                    default: null,
                    readOnly: true,
                    label: 'ID',
                    dbField: 'id',
                }),
                tenantId: field({
                    type: FieldTypes.NUMBER,
                    default: null,
                    readOnly: true,
                    label: 'Tenant ID',
                    dbField: 'tenant_id',
                }),
                createdAt: field({
                    type: FieldTypes.DATE,
                    default: null,
                    readOnly: true,
                    label: 'Created At',
                    dbField: 'created_at',
                }),
                updatedAt: field({
                    type: FieldTypes.DATE,
                    default: null,
                    readOnly: true,
                    label: 'Updated At',
                    dbField: 'updated_at',
                })
            },
            
            // Relationships
            relationships: {
                tenant: relationship({
                    type: RelationshipTypes.BELONGS_TO,
                    model: 'Tenant',
                    foreignKey: 'tenant_id',
                    autoLoad: false,
                }),
            },
            
            validation: {},
        });
    }

    // ===== CUSTOM AUTHENTICATION METHODS =====

    /**
     * Find user by email
     * @param {string} email - User email
     * @returns {Promise<User|null>} User instance or null
     */
    static async findByEmail(email) {
        return await this.findOne({ email });
    }

    /**
     * Compare password with stored hash
     * @param {string} password - Plain text password
     * @returns {Promise<boolean>} True if password matches
     */
    async comparePassword(password) {
        // Validate password parameter is non-empty string
        if (!password || typeof password !== 'string' || password.trim() === '') {
            console.warn('comparePassword called with invalid password parameter');
            return false;
        }

        // Validate passwordHash property is non-empty string
        // @ts-ignore - passwordHash is dynamically set by schema initialization
        if (!this.passwordHash || typeof this.passwordHash !== 'string' || this.passwordHash.trim() === '') {
            // @ts-ignore - email and id are dynamically set by schema initialization
            console.warn(`comparePassword: User ${this.email || this.id || 'unknown'} has missing or invalid passwordHash`);
            return false;
        }

        const bcrypt = require('bcryptjs');
        // @ts-ignore - passwordHash is dynamically set by schema initialization
        return await bcrypt.compare(password, this.passwordHash);
    }

    /**
     * Update last login timestamp
     * @returns {Promise<User>} Updated user instance
     */
    async updateLastLogin() {
        return await this.update({
            lastLogin: new Date()
        });
    }

    /**
     * Hash password
     * @param {string} password - Plain text password
     * @returns {Promise<string>} Hashed password
     */
    static async hashPassword(password) {
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        return await bcrypt.hash(password, salt);
    }
}

module.exports = User;
