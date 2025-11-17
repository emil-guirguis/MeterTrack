/**
 * Contact Model for PostgreSQL
 * Extends BaseModel for automatic CRUD generation
 */
const BaseModel = require('../../../../framework/backend/api/base/BaseModel');

class Contact extends BaseModel {
    constructor(contactData = {}) {
        super(contactData);

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
     * @override
     */
    static get tableName() {
        return 'contact';
    }
    
    /**
     * @override
     */
    static get primaryKey() {
        return 'id';
    }

    /**
     * Get meter statistics
     */
}

module.exports = Contact;

