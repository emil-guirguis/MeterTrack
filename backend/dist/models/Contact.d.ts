export = Contact;
declare class Contact {
    /**
     * Count all contacts with optional filters
     */
    static countAll(filters?: {}): Promise<number>;
    /**
     * Create new contact
     */
    static create(contactData: any): Promise<Contact>;
    /**
     * Find contact by ID
     */
    static findById(id: any): Promise<Contact | null>;
    /**
     * Find contact by email
     */
    static findByEmail(email: any): Promise<Contact | null>;
    /**
     * Find all contacts with optional filters
     */
    static findAll(filters?: {}): Promise<Contact[]>;
    /**
     * Get contact statistics
     */
    static getStats(): Promise<any[]>;
    /**
     * Find contacts by category
     */
    static findByCategory(category: any): Promise<Contact[]>;
    constructor(contactData?: {});
    id: any;
    name: any;
    company: any;
    role: any;
    email: any;
    phone: any;
    address_street: any;
    address_city: any;
    address_state: any;
    address_zip_code: any;
    address_country: any;
    category: any;
    status: any;
    notes: any;
    createdat: any;
    updatedat: any;
    /**
     * Update contact
     */
    update(updateData: any): Promise<this>;
    /**
     * Delete contact (soft delete)
     */
    delete(): Promise<this>;
    /**
     * Get full address as string
     */
    get fullAddress(): string;
    /**
     * Convert to JSON
     */
    toJSON(): this & {
        fullAddress: string;
    };
}
//# sourceMappingURL=Contact.d.ts.map