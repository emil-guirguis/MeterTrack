/**
 * Connectivity Monitor
 *
 * Monitors Client System connectivity and provides status for offline operation handling.
 * Automatically detects when connectivity is restored and triggers sync resumption.
 */
import { EventEmitter } from 'events';
export class ConnectivityMonitor extends EventEmitter {
    apiClient;
    checkIntervalMs;
    intervalId;
    status;
    lastStateChangeTime;
    constructor(apiClient, checkIntervalMs = 60000) {
        super();
        this.apiClient = apiClient;
        this.checkIntervalMs = checkIntervalMs;
        this.status = {
            isConnected: false,
            lastCheckTime: new Date(),
            consecutiveFailures: 0,
            uptime: 0,
            downtime: 0,
        };
        this.lastStateChangeTime = new Date();
    }
    /**
     * Start monitoring connectivity
     */
    start() {
        if (this.intervalId) {
            console.log('Connectivity monitor already running');
            return;
        }
        console.log(`Starting connectivity monitor (check interval: ${this.checkIntervalMs}ms)`);
        // Perform initial check
        this.checkConnectivity();
        // Schedule periodic checks
        this.intervalId = setInterval(() => {
            this.checkConnectivity();
        }, this.checkIntervalMs);
    }
    /**
     * Stop monitoring connectivity
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = undefined;
            console.log('Connectivity monitor stopped');
        }
    }
    /**
     * Check connectivity to Client System
     */
    async checkConnectivity() {
        const previousState = this.status.isConnected;
        try {
            const isConnected = await this.apiClient.testConnection();
            this.status.lastCheckTime = new Date();
            this.status.isConnected = isConnected;
            if (isConnected) {
                this.status.lastSuccessfulConnection = new Date();
                this.status.consecutiveFailures = 0;
                // State changed from offline to online
                if (!previousState) {
                    console.log('✓ Client System connectivity restored');
                    this.handleStateChange(true);
                    this.emit('connected');
                }
            }
            else {
                this.status.lastFailedConnection = new Date();
                this.status.consecutiveFailures++;
                // State changed from online to offline
                if (previousState) {
                    console.log('✗ Client System connectivity lost');
                    this.handleStateChange(false);
                    this.emit('disconnected');
                }
            }
        }
        catch (error) {
            this.status.lastCheckTime = new Date();
            this.status.isConnected = false;
            this.status.lastFailedConnection = new Date();
            this.status.consecutiveFailures++;
            // State changed from online to offline
            if (previousState) {
                console.log('✗ Client System connectivity lost');
                this.handleStateChange(false);
                this.emit('disconnected');
            }
        }
        // Update uptime/downtime
        this.updateTimers();
    }
    /**
     * Handle connectivity state change
     */
    handleStateChange(isConnected) {
        this.lastStateChangeTime = new Date();
        if (isConnected) {
            this.emit('state-change', { isConnected: true, timestamp: new Date() });
        }
        else {
            this.emit('state-change', { isConnected: false, timestamp: new Date() });
        }
    }
    /**
     * Update uptime and downtime counters
     */
    updateTimers() {
        const now = new Date();
        const elapsedSeconds = Math.floor((now.getTime() - this.lastStateChangeTime.getTime()) / 1000);
        if (this.status.isConnected) {
            this.status.uptime = elapsedSeconds;
            this.status.downtime = 0;
        }
        else {
            this.status.downtime = elapsedSeconds;
            this.status.uptime = 0;
        }
    }
    /**
     * Get current connectivity status
     */
    getStatus() {
        this.updateTimers();
        return { ...this.status };
    }
    /**
     * Check if currently connected
     */
    isConnected() {
        return this.status.isConnected;
    }
    /**
     * Force an immediate connectivity check
     */
    async forceCheck() {
        await this.checkConnectivity();
        return this.status.isConnected;
    }
}
