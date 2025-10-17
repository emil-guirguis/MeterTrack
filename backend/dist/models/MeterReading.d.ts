export = MeterReading;
declare class MeterReading {
    /**
     * Create new meter reading
     */
    static create(readingData: any): Promise<MeterReading>;
    /**
     * Find reading by ID
     */
    static findById(id: any): Promise<MeterReading | null>;
    /**
     * Find all readings with optional filters
     */
    static findAll(filters?: {}): Promise<MeterReading[]>;
    /**
     * Find readings by meter ID
     */
    static findByMeterId(meterid: any, options?: {}): Promise<MeterReading[]>;
    /**
     * Get reading statistics for a meter
     */
    static getStatsByMeter(meterid: any, period?: string): Promise<any[]>;
    /**
     * Get latest reading for a meter
     */
    static getLatestByMeter(meterid: any): Promise<MeterReading | null>;
    /**
     * Get consumption between two dates
     */
    static getConsumption(meterid: any, startDate: any, endDate: any): Promise<any[]>;
    constructor(readingData?: {});
    reading_type: string;
    multiplier: number;
    status: string;
    /**
     * Update reading
     */
    update(updateData: any): Promise<this>;
    /**
     * Verify reading
     */
    verify(verifiedBy: any): Promise<this>;
    verified_by: any;
    verified_date: any;
    updatedat: any;
    /**
     * Delete reading (soft delete)
     */
    delete(): Promise<this>;
    /**
     * Convert to JSON
     */
    toJSON(): this & {
        isVerified: boolean;
    };
}
//# sourceMappingURL=MeterReading.d.ts.map