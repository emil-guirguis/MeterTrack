export = meterMonitoringService;
declare const meterMonitoringService: MeterMonitoringService;
declare class MeterMonitoringService {
    isMonitoring: boolean;
    monitoringInterval: NodeJS.Timeout | null;
    config: {
        monitoring: {
            enabled: boolean;
            interval: number;
            batchSize: number;
        };
        thresholds: {
            offlineTimeout: number;
            communicationGap: number;
            readingFrequency: number;
        };
        notifications: {
            immediateAlerts: boolean;
            batchAlerts: boolean;
            maxAlertsPerHour: number;
        };
    } | null;
    lastCheckTime: Date | null;
    /**
     * Initialize meter monitoring service
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
            interval: number;
            batchSize: number;
        };
        thresholds: {
            offlineTimeout: number;
            communicationGap: number;
            readingFrequency: number;
        };
        notifications: {
            immediateAlerts: boolean;
            batchAlerts: boolean;
            maxAlertsPerHour: number;
        };
    };
    /**
     * Start monitoring meter data
     */
    startMonitoring(): void;
    /**
     * Stop monitoring meter data
     */
    stopMonitoring(): void;
    /**
     * Perform monitoring check
     */
    performMonitoringCheck(): Promise<void>;
    /**
     * Check meter status (online/offline)
     */
    checkMeterStatus(meter: any): Promise<{
        isOffline: boolean;
        reason: string;
        duration: null;
        shouldAlert: boolean;
        lastReading?: undefined;
    } | {
        isOffline: boolean;
        reason: string | null;
        duration: number;
        lastReading: Date;
        shouldAlert: boolean;
    } | {
        isOffline: boolean;
        shouldAlert: boolean;
        reason?: undefined;
        duration?: undefined;
        lastReading?: undefined;
    }>;
    /**
     * Check for communication gaps
     */
    checkCommunicationGaps(meter: any): Promise<{
        hasGaps: boolean;
        shouldAlert: boolean;
        gaps?: undefined;
    } | {
        hasGaps: boolean;
        gaps: {
            start: Date;
            end: Date;
            duration: number;
        }[];
        shouldAlert: boolean;
    }>;
    /**
     * Check reading patterns for anomalies
     */
    checkReadingPatterns(meter: any): Promise<{
        hasAnomalies: boolean;
        shouldAlert: boolean;
        anomalies?: undefined;
        statistics?: undefined;
    } | {
        hasAnomalies: boolean;
        anomalies: ({
            type: string;
            count: number;
            severity: string;
            value?: undefined;
            values?: undefined;
        } | {
            type: string;
            count: number;
            value: number;
            severity: string;
            values?: undefined;
        } | {
            type: string;
            count: number;
            values: {
                value: any;
                zScore: number;
            }[];
            severity: string;
            value?: undefined;
        })[];
        statistics: {
            count: any;
            mean: number;
            median: any;
            stdDev: number;
            min: number;
            max: number;
            sum: any;
        } | null;
        shouldAlert: boolean;
    }>;
    /**
     * Trigger offline alert
     */
    triggerOfflineAlert(meter: any, status: any): Promise<void>;
    /**
     * Trigger communication gap alert
     */
    triggerCommunicationGapAlert(meter: any, gapStatus: any): Promise<void>;
    /**
     * Trigger pattern alert
     */
    triggerPatternAlert(meter: any, patternStatus: any): Promise<void>;
    /**
     * Database helper methods
     */
    getActiveMeters(): Promise<any[][]>;
    getRecentReadings(meterid: any, count?: number): Promise<any[][]>;
    updateMeterStatus(meterId: any, status: any, reason: any): Promise<void>;
    logStatusChange(meterId: any, newStatus: any, reason: any): Promise<void>;
    logAlert(meterId: any, alertType: any, alertData: any): Promise<void>;
    shouldSendAlert(meterId: any, alertType: any): Promise<boolean>;
    /**
     * Statistical analysis methods
     */
    calculateStatistics(values: any): {
        count: any;
        mean: number;
        median: any;
        stdDev: number;
        min: number;
        max: number;
        sum: any;
    } | null;
    countConsecutiveZeros(values: any): number;
    countStuckReadings(values: any): number;
    findOutliers(values: any, stats: any): {
        value: any;
        zScore: number;
    }[];
    /**
     * Utility methods
     */
    formatDuration(milliseconds: any): string;
    delay(ms: any): Promise<any>;
    /**
     * Get service health status
     */
    getHealthStatus(): Promise<{
        isHealthy: boolean;
        isMonitoring: boolean;
        lastCheckTime: Date | null;
        config: {
            monitoringEnabled: boolean;
            monitoringInterval: number;
            offlineThreshold: number;
        };
        lastCheck: string;
    }>;
    /**
     * Stop service and cleanup
     */
    stop(): Promise<void>;
}
//# sourceMappingURL=MeterMonitoringService.d.ts.map