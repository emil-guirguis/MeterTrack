export = meterDataAnalyzer;
declare const meterDataAnalyzer: MeterDataAnalyzer;
declare class MeterDataAnalyzer {
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
            highUsage: number;
            usageSpike: number;
            lowUsage: number;
            communicationGap: number;
        };
        analysis: {
            historicalDays: number;
            baselineReadings: number;
            anomalyDetectionEnabled: boolean;
        };
    } | null;
    /**
     * Initialize meter data analyzer
     */
    initialize(config?: null): Promise<{
        success: boolean;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
    }>;
    /**
     * Get default analyzer configuration
     */
    getDefaultConfig(): {
        monitoring: {
            enabled: boolean;
            interval: number;
            batchSize: number;
        };
        thresholds: {
            offlineTimeout: number;
            highUsage: number;
            usageSpike: number;
            lowUsage: number;
            communicationGap: number;
        };
        analysis: {
            historicalDays: number;
            baselineReadings: number;
            anomalyDetectionEnabled: boolean;
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
     * Analyze all meters for triggers and anomalies
     */
    analyzeAllMeters(): Promise<void>;
    /**
     * Analyze individual meter for triggers
     */
    analyzeMeter(meter: any): Promise<any[]>;
    /**
     * Check meter communication status
     */
    checkCommunicationStatus(meter: any): Promise<{
        type: string;
        severity: string;
        message: string;
        data: {
            meter_id: any;
            last_communication?: undefined;
            offline_duration?: undefined;
            error_code?: undefined;
            error_description?: undefined;
            gaps?: undefined;
        };
    } | {
        type: string;
        severity: string;
        message: string;
        data: {
            meter_id: any;
            last_communication: Date;
            offline_duration: number;
            error_code: string;
            error_description: string;
            gaps?: undefined;
        };
    } | {
        type: string;
        severity: string;
        message: string;
        data: {
            meter_id: any;
            gaps: any[];
            last_communication?: undefined;
            offline_duration?: undefined;
            error_code?: undefined;
            error_description?: undefined;
        };
    } | null>;
    /**
     * Check for usage anomalies
     */
    checkUsageAnomalies(meter: any): Promise<any[]>;
    /**
     * Check if maintenance is due
     */
    checkMaintenanceDue(meter: any): Promise<{
        type: string;
        severity: string;
        message: string;
        data: {
            meter_id: any;
            due_date: Date;
            days_until_due: number;
            maintenance_type: any;
            days_overdue?: undefined;
        };
    } | {
        type: string;
        severity: string;
        message: string;
        data: {
            meter_id: any;
            due_date: Date;
            days_overdue: number;
            maintenance_type: any;
            days_until_due?: undefined;
        };
    } | null>;
    /**
     * Process detected triggers
     */
    processTriggers(meter: any, triggers: any): Promise<void>;
    /**
     * Handle communication error triggers
     */
    handleCommunicationError(meter: any, trigger: any): Promise<void>;
    /**
     * Handle usage anomaly triggers
     */
    handleUsageAnomaly(meter: any, trigger: any): Promise<void>;
    /**
     * Handle maintenance due triggers
     */
    handleMaintenanceDue(meter: any, trigger: any): Promise<void>;
    /**
     * Database query methods
     */
    getActiveMeters(): Promise<any[][]>;
    getLatestReading(meterId: any): Promise<any[] | null>;
    getRecentReadings(meterId: any, days: any): Promise<any[][]>;
    checkCommunicationGaps(meterId: any): Promise<never[]>;
    logTrigger(meter: any, trigger: any): Promise<void>;
    /**
     * Statistical analysis methods
     */
    calculateUsageStatistics(readings: any): {
        average: number;
        median: any;
        stdDev: number;
        min: number;
        max: number;
    };
    detectStatisticalAnomalies(readings: any, stats: any): {
        type: string;
        severity: string;
        message: string;
        data: {
            meter_id: any;
            reading_value: number;
            z_score: number;
            average: any;
            std_dev: any;
        };
    }[];
    /**
     * Utility methods
     */
    formatDuration(milliseconds: any): string;
    delay(ms: any): Promise<any>;
    /**
     * Get analyzer health status
     */
    getHealthStatus(): Promise<{
        isHealthy: boolean;
        isMonitoring: boolean;
        config: {
            monitoringEnabled: boolean;
            monitoringInterval: number;
            anomalyDetectionEnabled: boolean;
        };
        lastCheck: string;
    }>;
    /**
     * Stop analyzer and cleanup
     */
    stop(): Promise<void>;
}
//# sourceMappingURL=MeterDataAnalyzer.d.ts.map