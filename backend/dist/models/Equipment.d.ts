export = Equipment;
declare class Equipment {
    /**
     * Create new equipment
     */
    static create(equipmentData: any): Promise<Equipment>;
    /**
     * Find equipment by ID
     */
    static findById(id: any): Promise<Equipment | null>;
    /**
     * Find all equipment with optional filters
     */
    static findAll(filters?: {}): Promise<Equipment[]>;
    /**
     * Get equipment statistics
     */
    static getStats(): Promise<any[]>;
    /**
     * Get equipment by location
     */
    static findByLocation(locationId: any): Promise<Equipment[]>;
    constructor(equipmentData?: {});
    id: any;
    name: any;
    type: any;
    locationid: any;
    locationname: any;
    specifications: any;
    status: any;
    installdate: any;
    lastmaintenance: any;
    nextmaintenance: any;
    serialnumber: any;
    manufacturer: any;
    model: any;
    location: any;
    notes: any;
    createdat: any;
    updatedat: any;
    /**
     * Update equipment
     */
    update(updateData: any): Promise<this>;
    /**
     * Delete equipment (soft delete)
     */
    delete(): Promise<this>;
    /**
     * Update maintenance date
     */
    updateMaintenance(maintenanceDate: any, nextMaintenanceDate?: null): Promise<this>;
    /**
     * Convert to JSON
     */
    toJSON(): this & {
        specifications: any;
    };
}
//# sourceMappingURL=Equipment.d.ts.map