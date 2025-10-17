export = DeviceService;
declare class DeviceService {
    /**
     * Validate device input data
     */
    static validateDeviceInput(deviceData: any, isUpdate?: boolean): string[];
    /**
     * Create validation error with specific error code
     */
    static createValidationError(errors: any): Error;
    /**
     * Create database error with specific error code
     */
    static createDatabaseError(originalError: any, operation: any): Error;
    /**
     * Get all devices
     */
    static getAllDevices(): Promise<({
        id: any;
        name: any;
        description: any;
        createdAt: any;
        updatedAt: any;
    } | null)[]>;
    /**
     * Get device by ID
     */
    static getDeviceById(id: any): Promise<{
        id: any;
        name: any;
        description: any;
        createdAt: any;
        updatedAt: any;
    } | null>;
    /**
     * Create new device
     */
    static createDevice(deviceData: any): Promise<{
        id: any;
        name: any;
        description: any;
        createdAt: any;
        updatedAt: any;
    } | null>;
    /**
     * Update device
     */
    static updateDevice(id: any, updateData: any): Promise<{
        id: any;
        name: any;
        description: any;
        createdAt: any;
        updatedAt: any;
    } | null>;
    /**
     * Delete device
     */
    static deleteDevice(id: any): Promise<boolean>;
    /**
     * Format device data for frontend compatibility
     */
    static formatDevice(dbRow: any): {
        id: any;
        name: any;
        description: any;
        createdAt: any;
        updatedAt: any;
    } | null;
}
//# sourceMappingURL=deviceService.d.ts.map