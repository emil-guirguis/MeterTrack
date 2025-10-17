export = notificationScheduler;
declare const notificationScheduler: NotificationScheduler;
declare class NotificationScheduler {
    scheduledJobs: Map<any, any>;
    isInitialized: boolean;
    config: {
        schedules: {
            monthlyReports: {
                enabled: boolean;
                cron: string;
                template: string;
            };
            maintenanceReminders: {
                enabled: boolean;
                cron: string;
                template: string;
            };
            errorNotifications: {
                enabled: boolean;
                realtime: boolean;
                template: string;
            };
        };
        retry: {
            maxAttempts: number;
            baseDelay: number;
            maxDelay: number;
            backoffMultiplier: number;
        };
        triggers: {
            meterOfflineThreshold: number;
            highUsageThreshold: number;
            maintenanceDueDays: number;
        };
    } | null;
    retryQueue: any[];
    processingRetries: boolean;
    /**
     * Initialize notification scheduler
     */
    initialize(config?: null): Promise<{
        success: boolean;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
    }>;
    /**
     * Get default scheduler configuration
     */
    getDefaultConfig(): {
        schedules: {
            monthlyReports: {
                enabled: boolean;
                cron: string;
                template: string;
            };
            maintenanceReminders: {
                enabled: boolean;
                cron: string;
                template: string;
            };
            errorNotifications: {
                enabled: boolean;
                realtime: boolean;
                template: string;
            };
        };
        retry: {
            maxAttempts: number;
            baseDelay: number;
            maxDelay: number;
            backoffMultiplier: number;
        };
        triggers: {
            meterOfflineThreshold: number;
            highUsageThreshold: number;
            maintenanceDueDays: number;
        };
    };
    /**
     * Validate scheduler configuration
     */
    validateConfig(config: any): {
        isValid: boolean;
        errors: string[];
    };
    /**
     * Initialize scheduled jobs
     */
    initializeScheduledJobs(): Promise<void>;
    /**
     * Start all scheduled jobs
     */
    startAllJobs(): void;
    /**
     * Stop all scheduled jobs
     */
    stopAllJobs(): void;
    /**
     * Send monthly meter reading reports
     */
    sendMonthlyReports(): Promise<void>;
    /**
     * Send maintenance reminders
     */
    sendMaintenanceReminders(): Promise<void>;
    /**
     * Send meter error notification (triggered by events)
     */
    sendMeterErrorNotification(meterData: any): Promise<{
        success: boolean;
        messageId: any;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        messageId?: undefined;
    }>;
    /**
     * Add failed notification to retry queue
     */
    addToRetryQueue(notification: any): void;
    /**
     * Calculate retry delay with exponential backoff
     */
    calculateRetryDelay(attempts: any): number;
    /**
     * Start retry processor
     */
    startRetryProcessor(): void;
    retryInterval: NodeJS.Timeout | null | undefined;
    /**
     * Process retry queue
     */
    processRetryQueue(): Promise<void>;
    /**
     * Get meter data for a specific period
     */
    getMeterDataForPeriod(days: any): Promise<any[][]>;
    /**
     * Group meter data by location
     */
    groupMeterDataByLocation(meterData: any): {};
    /**
     * Get location contacts
     */
    getLocationContacts(locationId: any): Promise<any[][]>;
    /**
     * Get meters due for maintenance
     */
    getMetersDueForMaintenance(): Promise<any[][]>;
    /**
     * Update maintenance reminder sent date
     */
    updateMaintenanceReminderSent(meterId: any): Promise<void>;
    /**
     * Log notification
     */
    logNotification(logData: any): Promise<void>;
    /**
     * Log notification failure
     */
    logNotificationFailure(notification: any): Promise<void>;
    /**
     * Utility methods
     */
    formatDate(date: any): string;
    formatDateTime(date: any): string;
    calculateErrorDuration(lastCommunication: any): string;
    /**
     * Get scheduler health status
     */
    getHealthStatus(): Promise<{
        isHealthy: boolean;
        initialized: boolean;
        scheduledJobs: any[];
        retryQueueSize: number;
        processingRetries: boolean;
        config: {
            monthlyReportsEnabled: boolean;
            maintenanceRemindersEnabled: boolean;
            errorNotificationsEnabled: boolean;
        };
        lastCheck: string;
    }>;
    /**
     * Stop scheduler and cleanup
     */
    stop(): Promise<void>;
}
//# sourceMappingURL=NotificationScheduler.d.ts.map