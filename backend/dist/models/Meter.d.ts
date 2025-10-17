export = Meter;
declare class Meter {
    /**
     * Create new meter
     */
    static create(meterData: any): Promise<Meter>;
    /**
     * Find meter by ID
     */
    static findById(id: any): Promise<Meter | null>;
    /**
     * Find meter by meter ID
     */
    static findByMeterId(meterid: any): Promise<Meter | null>;
    /**
     * Find all meters with optional filters
     */
    static findAll(filters?: {}): Promise<Meter[]>;
    /**
     * Get meter statistics
     */
    static getStats(): Promise<any[]>;
    /**
     * Get meters by location
     */
    static findByLocation(location: any): Promise<Meter[]>;
    constructor(meterData?: {});
    id: any;
    meterid: any;
    name: any;
    type: any;
    device_id: any;
    device_name: any;
    device_description: any;
    serialnumber: any;
    installation_date: any;
    last_reading_date: any;
    status: any;
    location_location: any;
    location_floor: any;
    location_room: any;
    location_description: any;
    unit_of_measurement: any;
    multiplier: any;
    notes: any;
    register_map: any;
    createdat: any;
    updatedat: any;
    /**
     * Update meter
     */
    update(updateData: any): Promise<this>;
    /**
     * Delete meter (soft delete)
     */
    delete(): Promise<this>;
    /**
     * Update last reading date
     */
    updateLastReading(readingDate?: Date): Promise<this>;
    /**
     * Get full location string
     */
    get fullLocation(): string;
    /**
     * Convert to JSON
     */
    toJSON(): this & {
        fullLocation: string;
    };
}
//# sourceMappingURL=Meter.d.ts.map