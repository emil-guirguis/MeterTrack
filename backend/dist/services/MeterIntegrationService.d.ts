export = meterIntegrationService;
declare const meterIntegrationService: MeterIntegrationService;
declare class MeterIntegrationService {
    isInitialized: boolean;
    config: {
        monitoring: {
            enabled: boolean;
            checkInterval: number;
            batchSize: number;
        };
        thresholds: {
            offlineTimeout: number;
            highUsageThreshold: number;
            lowUsageThreshold: number;
            usageSpikeMultiplier: number;
        };
        maintenance: {
            defaultInterval: string;
            reminderDays: number;
            autoSchedule: boolean;
        };
        notifications: {
            errorNotifications: boolean;
            maintenanceReminders: boolean;
            usageAlerts: boolean;
        };
    } | null;
    eventListeners: Map<any, any>;
    /**
     * Initialize meter integration service
     */
    initialize(config?: null): Promise<{
        success: boolean;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
    }>;
    /**
     * Get default configuration
     */
    getDefaultConfig(): {
        monitoring: {
            enabled: boolean;
            checkInterval: number;
            batchSize: number;
        };
        thresholds: {
            offlineTimeout: number;
            highUsageThreshold: number;
            lowUsageThreshold: number;
            usageSpikeMultiplier: number;
        };
        maintenance: {
            defaultInterval: string;
            reminderDays: number;
            autoSchedule: boolean;
        };
        notifications: {
            errorNotifications: boolean;
            maintenanceReminders: boolean;
            usageAlerts: boolean;
        };
    };
    /**
     * Set up event listeners for meter data changes
     */
    setupEventListeners(): Promise<void>;
    /**
     * Handle new meter reading
     */
    handleNewMeterReading(readingData: any): Promise<void>;
    /**
     * Handle meter status changes
     */
    handleMeterStatusChange(statusData: any): Promise<void>;
    /**
     * Handle maintenance events
     */
    handleMaintenanceEvent(maintenanceData: any): Promise<void>;
    /**
     * Initialize maintenance scheduling for all meters
     */
    initializeMaintenanceScheduling(): Promise<void>;
    /**
     * Auto-schedule maintenance for a meter
     */
    autoScheduleMaintenance(meter: any): Promise<void>;
    /**
     * Check for usage anomalies
     */
    checkUsageAnomalies(meter: any, currentReading: any): Promise<void>;
    /**
     * Send meter offline notification
     */
    sendMeterOfflineNotification(meter: any, reason: any): Promise<void>;
    /**
     * Send usage alert notification
     */
    sendUsageAlert(meter: any, alertType: any, data: any): Promise<void>;
    /**
     * Database helper methods
     */
    updateMeterLastReading(meterId: any, readingDate: any): Promise<void>;
    updateMeterStatus(meterId: any, status: any): Promise<void>;
    updateMeterMaintenanceSchedule(meterId: any, maintenanceData: any): Promise<void>;
    getMetersNeedingMaintenanceSchedule(): Promise<Meter[]>;
    getRecentReadings(meterid: any, count?: number): Promise<any[][]>;
    getLocationInfo(locationIdentifier: any): Promise<any[] | null>;
    logMeterStatusChange(meterId: any, oldStatus: any, newStatus: any, reason: any): Promise<void>;
    logUsageAlert(meterId: any, alertType: any, data: any): Promise<void>;
    /**
     * Utility methods
     */
    parseMaintenanceInterval(interval: any): number;
    formatMeterLocation(meter: any): string;
    /**
     * Public API methods
     */
    triggerMeterCheck(meterid: any): Promise<{
        success: boolean;
        status: string;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        status?: undefined;
    }>;
    scheduleMeterMaintenance(meterid: any, maintenanceDate: any, notes?: string): Promise<{
        success: boolean;
        message: string;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        message?: undefined;
    }>;
    completeMeterMaintenance(meterid: any, completedDate: any, notes?: string): Promise<{
        success: boolean;
        message: string;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        message?: undefined;
    }>;
    /**
     * Get service health status
     */
    getHealthStatus(): Promise<{
        isHealthy: boolean;
        initialized: boolean;
        config: {
            monitoringEnabled: boolean;
            errorNotificationsEnabled: boolean;
            maintenanceRemindersEnabled: boolean;
            usageAlertsEnabled: boolean;
        };
        eventListeners: any[];
        lastCheck: string;
    }>;
    /**
     * Stop service and cleanup
     */
    stop(): Promise<void>;
}
import Meter = require("../models/Meter");
//# sourceMappingURL=MeterIntegrationService.d.ts.map