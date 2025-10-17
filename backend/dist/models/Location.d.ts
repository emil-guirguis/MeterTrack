export = Location;
declare class Location {
    /**
     * Create a new location
     */
    static create(locationData: any): Promise<Location>;
    /**
     * Find location by ID
     */
    static findById(id: any): Promise<Location | null>;
    /**
     * Find all locations with optional filters
     */
    static findAll(filters?: {}): Promise<Location[]>;
    /**
     * Get location statistics
     */
    static getStats(): Promise<any[]>;
    constructor(locationData?: {});
    id: any;
    name: any;
    address_street: any;
    address_city: any;
    address_state: any;
    address_zip_code: any;
    address_country: any;
    contact_primarycontact: any;
    contact_email: any;
    contact_phone: any;
    contact_website: any;
    type: any;
    status: any;
    totalfloors: any;
    totalunits: any;
    yearbuilt: any;
    squarefootage: any;
    description: any;
    notes: any;
    equipmentcount: any;
    metercount: any;
    createdat: any;
    updatedat: any;
    /**
     * Update location
     */
    update(updateData: any): Promise<this>;
    /**
     * Delete location (soft delete by setting status to inactive)
     */
    delete(): Promise<this>;
    /**
     * Update equipment count for a location
     */
    updateEquipmentCount(): Promise<this>;
    /**
     * Update meter count for a location
     */
    updateMeterCount(): Promise<this>;
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
//# sourceMappingURL=Location.d.ts.map