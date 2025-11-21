/**
 * Users Model with Schema Definition
 * 
 * Auto-generated from database schema
 * Single source of truth for Users entity
 */

const BaseModel = require('../../../../framework/backend/api/base/BaseModel');
const { defineSchema, field, relationship, FieldTypes, RelationshipTypes } = require('../../../../framework/backend/api/base/SchemaDefinition');

class Users extends BaseModel {
    constructor(data = {}) {
        super(data);
        
        // Auto-initialize all fields from schema
        Users.schema.initializeFromData(this, data);
    }
    
    static get tableName() {
        return 'users';
    }
    
    static get primaryKey() {
        return 'id';
    }

    // ===== SCHEMA DEFINITION (Single Source of Truth) =====
    
    static get schema() {
        return defineSchema({
            entityName: 'Users',
            tableName: 'users',
            description: 'Users entity',
            
            // Form fields - user can edit these
            formFields: {
                instanceId: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: false,
                    label: 'Instance Id',
                    dbField: 'instance_id',
                }),
                name: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: true,
                    label: 'Name',
                    dbField: 'name',
                    maxLength: 100,
                }),
                email: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: true,
                    label: 'Email',
                    dbField: 'email',
                    maxLength: 254,
                }),
                aud: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: false,
                    label: 'Aud',
                    dbField: 'aud',
                    maxLength: 255,
                }),
                passwordhash: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: true,
                    label: 'Passwordhash',
                    dbField: 'passwordhash',
                    maxLength: 200,
                }),
                role: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: false,
                    label: 'Role',
                    dbField: 'role',
                    maxLength: 255,
                }),
                role: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: false,
                    label: 'Role',
                    dbField: 'role',
                    maxLength: 20,
                }),
                email: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: false,
                    label: 'Email',
                    dbField: 'email',
                    maxLength: 255,
                }),
                encryptedPassword: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: false,
                    label: 'Encrypted Password',
                    dbField: 'encrypted_password',
                    maxLength: 255,
                }),
                permissions: field({
                    type: FieldTypes.OBJECT,
                    default: null,
                    required: false,
                    label: 'Permissions',
                    dbField: 'permissions',
                }),
                emailConfirmedAt: field({
                    type: FieldTypes.DATE,
                    default: '',
                    required: false,
                    label: 'Email Confirmed At',
                    dbField: 'email_confirmed_at',
                }),
                lastLogin: field({
                    type: FieldTypes.DATE,
                    default: '',
                    required: false,
                    label: 'Last Login',
                    dbField: 'last_login',
                }),
                invitedAt: field({
                    type: FieldTypes.DATE,
                    default: '',
                    required: false,
                    label: 'Invited At',
                    dbField: 'invited_at',
                }),
                confirmationToken: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: false,
                    label: 'Confirmation Token',
                    dbField: 'confirmation_token',
                    maxLength: 255,
                }),
                active: field({
                    type: FieldTypes.BOOLEAN,
                    default: false,
                    required: false,
                    label: 'Active',
                    dbField: 'active',
                }),
                confirmationSentAt: field({
                    type: FieldTypes.DATE,
                    default: '',
                    required: false,
                    label: 'Confirmation Sent At',
                    dbField: 'confirmation_sent_at',
                }),
                recoveryToken: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: false,
                    label: 'Recovery Token',
                    dbField: 'recovery_token',
                    maxLength: 255,
                }),
                recoverySentAt: field({
                    type: FieldTypes.DATE,
                    default: '',
                    required: false,
                    label: 'Recovery Sent At',
                    dbField: 'recovery_sent_at',
                }),
                emailChangeTokenNew: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: false,
                    label: 'Email Change Token New',
                    dbField: 'email_change_token_new',
                    maxLength: 255,
                }),
                emailChange: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: false,
                    label: 'Email Change',
                    dbField: 'email_change',
                    maxLength: 255,
                }),
                emailChangeSentAt: field({
                    type: FieldTypes.DATE,
                    default: '',
                    required: false,
                    label: 'Email Change Sent At',
                    dbField: 'email_change_sent_at',
                }),
                lastSignInAt: field({
                    type: FieldTypes.DATE,
                    default: '',
                    required: false,
                    label: 'Last Sign In At',
                    dbField: 'last_sign_in_at',
                }),
                rawAppMetaData: field({
                    type: FieldTypes.OBJECT,
                    default: null,
                    required: false,
                    label: 'Raw App Meta Data',
                    dbField: 'raw_app_meta_data',
                }),
                rawUserMetaData: field({
                    type: FieldTypes.OBJECT,
                    default: null,
                    required: false,
                    label: 'Raw User Meta Data',
                    dbField: 'raw_user_meta_data',
                }),
                isSuperAdmin: field({
                    type: FieldTypes.BOOLEAN,
                    default: false,
                    required: false,
                    label: 'Is Super Admin',
                    dbField: 'is_super_admin',
                }),
                phone: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: false,
                    label: 'Phone',
                    dbField: 'phone',
                }),
                phoneConfirmedAt: field({
                    type: FieldTypes.DATE,
                    default: '',
                    required: false,
                    label: 'Phone Confirmed At',
                    dbField: 'phone_confirmed_at',
                }),
                phoneChange: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: false,
                    label: 'Phone Change',
                    dbField: 'phone_change',
                }),
                phoneChangeToken: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: false,
                    label: 'Phone Change Token',
                    dbField: 'phone_change_token',
                    maxLength: 255,
                }),
                phoneChangeSentAt: field({
                    type: FieldTypes.DATE,
                    default: '',
                    required: false,
                    label: 'Phone Change Sent At',
                    dbField: 'phone_change_sent_at',
                }),
                confirmedAt: field({
                    type: FieldTypes.DATE,
                    default: '',
                    required: false,
                    label: 'Confirmed At',
                    dbField: 'confirmed_at',
                }),
                emailChangeTokenCurrent: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: false,
                    label: 'Email Change Token Current',
                    dbField: 'email_change_token_current',
                    maxLength: 255,
                }),
                emailChangeConfirmStatus: field({
                    type: FieldTypes.NUMBER,
                    default: 0,
                    required: false,
                    label: 'Email Change Confirm Status',
                    dbField: 'email_change_confirm_status',
                }),
                bannedUntil: field({
                    type: FieldTypes.DATE,
                    default: '',
                    required: false,
                    label: 'Banned Until',
                    dbField: 'banned_until',
                }),
                reauthenticationToken: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: false,
                    label: 'Reauthentication Token',
                    dbField: 'reauthentication_token',
                    maxLength: 255,
                }),
                reauthenticationSentAt: field({
                    type: FieldTypes.DATE,
                    default: '',
                    required: false,
                    label: 'Reauthentication Sent At',
                    dbField: 'reauthentication_sent_at',
                }),
                isSsoUser: field({
                    type: FieldTypes.BOOLEAN,
                    default: false,
                    required: false,
                    label: 'Is Sso User',
                    dbField: 'is_sso_user',
                }),
                deletedAt: field({
                    type: FieldTypes.DATE,
                    default: '',
                    required: false,
                    label: 'Deleted At',
                    dbField: 'deleted_at',
                }),
                isAnonymous: field({
                    type: FieldTypes.BOOLEAN,
                    default: false,
                    required: false,
                    label: 'Is Anonymous',
                    dbField: 'is_anonymous',
                })
            },
            
            // Entity fields - read-only, system-managed
            entityFields: {
                id: field({
                    type: FieldTypes.NUMBER,
                    default: null,
                    readOnly: true,
                    label: 'Id',
                    dbField: 'id',
                }),
                id: field({
                    type: FieldTypes.STRING,
                    default: null,
                    readOnly: true,
                    label: 'Id',
                    dbField: 'id',
                }),
                tenantId: field({
                    type: FieldTypes.NUMBER,
                    default: null,
                    readOnly: true,
                    label: 'Tenant Id',
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
            
            // TODO: Add relationships here
            relationships: {
                // Example:
                // device: relationship({
                //     type: RelationshipTypes.BELONGS_TO,
                //     model: 'Device',
                //     foreignKey: 'device_id',
                //     autoLoad: false,
                // }),
            },
            
            validation: {},
        });
    }
}

module.exports = Users;
