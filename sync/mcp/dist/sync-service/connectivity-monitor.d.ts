/**
 * Connectivity Monitor
 *
 * Monitors Client System connectivity and provides status for offline operation handling.
 * Automatically detects when connectivity is restored and triggers sync resumption.
 */
import { ClientSystemApiClient } from './api-client.js';
import { EventEmitter } from 'events';
export interface ConnectivityStatus {
    isConnected: boolean;
    lastCheckTime: Date;
    lastSuccessfulConnection?: Date;
    lastFailedConnection?: Date;
    consecutiveFailures: number;
    uptime: number;
    downtime: number;
}
export declare class ConnectivityMonitor extends EventEmitter {
    private apiClient;
    private checkIntervalMs;
    private intervalId?;
    private status;
    private lastStateChangeTime;
    constructor(apiClient: ClientSystemApiClient, checkIntervalMs?: number);
    /**
     * Start monitoring connectivity
     */
    start(): void;
    /**
     * Stop monitoring connectivity
     */
    stop(): void;
    /**
     * Check connectivity to Client System
     */
    private checkConnectivity;
    /**
     * Handle connectivity state change
     */
    private handleStateChange;
    /**
     * Update uptime and downtime counters
     */
    private updateTimers;
    /**
     * Get current connectivity status
     */
    getStatus(): ConnectivityStatus;
    /**
     * Check if currently connected
     */
    isConnected(): boolean;
    /**
     * Force an immediate connectivity check
     */
    forceCheck(): Promise<boolean>;
}
