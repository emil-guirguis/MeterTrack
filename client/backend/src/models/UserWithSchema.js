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

            customListColumns: {},
            // Form fields - user can edit these
            formFields: {
                name: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: true,
                    label: 'Name',
                    dbField: 'name',
                    maxLength: 100,
                    placeholder: 'John Doe',
                    filertable: ['main'],
                    showOn: ['list', 'form'],
                                }),
                email: field({
                    type: FieldTypes.EMAIL,
                    default: '',
                    required: true,
                    label: 'Email',
                    dbField: 'email',
                    maxLength: 254,
                    placeholder: 'email@yahoo.com',
                    showOn: ['list', 'form'],
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
                    default: 'Viewer',
                    required: false,
                    label: 'Role',
                    dbField: 'role',
                    maxLength: 20,
                    enumValues: ['Admin', 'Manager', 'Technician', 'Viewer'],
                      placeholder: 'Viewer',
                    filertable: ['main'],
                    showOn: ['list', 'form'],  
                            }),
                permissions: field({
                    type: FieldTypes.ARRAY,
                    default: [],
                    required: false,
                    label: 'Permissions',
                    dbField: 'permissions',
                    showOn: [ 'form'],  
                }),
                active: field({
                    type: FieldTypes.BOOLEAN,
                    default: true,
                    required: false,
                    label: 'Active Status',
                    dbField: 'active',
                    showOn: ['list', 'form'],  
                }),
                lastLogin: field({
                    type: FieldTypes.DATE,
                    default: null,
                    required: false,
                    label: 'Last Login',
                    dbField: 'last_sign_in_at',
                    readOnly: true,
                    showOn: ['list', 'form'],  
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
                    showOn: ['form'],  
                }),
                updatedAt: field({
                    type: FieldTypes.DATE,
                    default: null,
                    readOnly: true,
                    label: 'Updated At',
                    dbField: 'updated_at',
                    showOn: ['form'],  
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

    // ===== PERMISSIONS METHODS =====

    /**
     * Validate permissions object structure
     * Ensures permissions follow the nested object format: { module: { action: boolean } }
     * @param {any} permissionsObj - Permissions object to validate
     * @returns {boolean} True if valid, false otherwise
     */
    validatePermissionsObject(permissionsObj) {
        const PermissionsService = require('../services/PermissionsService');
        return PermissionsService.validatePermissionsObject(permissionsObj);
    }

    /**
     * Convert stored permissions to nested object format
     * Handles both JSON string storage and direct object storage
     * @returns {Object} Nested permissions object { module: { action: boolean } }
     */
    getPermissionsAsNestedObject() {
        const PermissionsService = require('../services/PermissionsService');
        
        // @ts-ignore - permissions is dynamically set by schema initialization
        const storedPermissions = this.permissions;

        // If permissions is a string (JSON), parse it
        if (typeof storedPermissions === 'string') {
            try {
                const parsed = JSON.parse(storedPermissions);
                if (PermissionsService.validatePermissionsObject(parsed)) {
                    return parsed;
                }
            } catch (e) {
                console.warn('Failed to parse permissions JSON:', e);
            }
        }

        // If permissions is already an object, validate and return
        if (typeof storedPermissions === 'object' && storedPermissions !== null && !Array.isArray(storedPermissions)) {
            if (PermissionsService.validatePermissionsObject(storedPermissions)) {
                return storedPermissions;
            }
        }

        // If permissions is an array (old format), convert to nested object
        if (Array.isArray(storedPermissions)) {
            return PermissionsService.toNestedObject(storedPermissions);
        }

        // Fallback: return empty permissions object
        return PermissionsService.getPermissionsByRole('viewer');
    }

    /**
     * Convert stored permissions to flat array format
     * Useful for API responses
     * @returns {Array<string>} Flat array of permissions (e.g., ['user:create', 'meter:read'])
     */
    getPermissionsAsFlatArray() {
        const PermissionsService = require('../services/PermissionsService');
        const nestedObj = this.getPermissionsAsNestedObject();
        return PermissionsService.toFlatArray(nestedObj);
    }

    /**
     * Set permissions from nested object format
     * Stores as JSON string in database
     * @param {Object} permissionsObj - Nested permissions object { module: { action: boolean } }
     * @returns {boolean} True if set successfully, false if invalid
     */
    setPermissionsFromNestedObject(permissionsObj) {
        if (!this.validatePermissionsObject(permissionsObj)) {
            console.warn('Invalid permissions object provided to setPermissionsFromNestedObject');
            return false;
        }

        // Store as JSON string
        // @ts-ignore - permissions is dynamically set by schema initialization
        this.permissions = JSON.stringify(permissionsObj);
        return true;
    }

    /**
     * Set permissions from flat array format
     * Converts to nested object and stores as JSON string
     * @param {Array<string>} flatArray - Flat array of permissions (e.g., ['user:create', 'meter:read'])
     * @returns {boolean} True if set successfully, false if invalid
     */
    setPermissionsFromFlatArray(flatArray) {
        const PermissionsService = require('../services/PermissionsService');
        const nestedObj = PermissionsService.toNestedObject(flatArray);
        return this.setPermissionsFromNestedObject(nestedObj);
    }
}

module.exports = User;
