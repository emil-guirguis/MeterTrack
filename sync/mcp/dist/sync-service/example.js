/**
 * Sync Service Usage Example
 *
 * This file demonstrates how to use the Sync Service components.
 * This is for reference only and should not be run in production.
 */
import { createDatabaseFromEnv } from '../database/postgres.js';
import { createApiClientFromEnv } from './api-client.js';
import { createSyncManagerFromEnv } from './sync-manager.js';
async function main() {
    console.log('=== Sync Service Example ===\n');
    // Initialize components from environment variables
    console.log('1. Initializing components...');
    const database = createDatabaseFromEnv();
    const apiClient = createApiClientFromEnv();
    const syncManager = createSyncManagerFromEnv(database, apiClient);
    // Test database connection
    console.log('2. Testing database connection...');
    const dbConnected = await database.testConnection();
    console.log(`   Database: ${dbConnected ? '✓ Connected' : '✗ Failed'}`);
    if (!dbConnected) {
        console.error('Cannot proceed without database connection');
        process.exit(1);
    }
    // Test Client System connectivity
    console.log('3. Testing Client System connectivity...');
    const clientConnected = await apiClient.testConnection();
    console.log(`   Client System: ${clientConnected ? '✓ Connected' : '✗ Unreachable'}`);
    // Get initial queue size
    console.log('4. Checking sync queue...');
    const queueSize = await database.getUnsynchronizedCount();
    console.log(`   Queue size: ${queueSize} readings`);
    // Start sync manager
    console.log('5. Starting sync manager...');
    await syncManager.start();
    console.log('   ✓ Sync manager started');
    // Wait a moment for initial sync
    await sleep(2000);
    // Get sync status
    console.log('6. Getting sync status...');
    const status = syncManager.getStatus();
    console.log('   Status:', {
        isRunning: status.isRunning,
        lastSyncTime: status.lastSyncTime,
        lastSyncSuccess: status.lastSyncSuccess,
        queueSize: status.queueSize,
        isClientConnected: status.isClientConnected,
    });
    // Get connectivity status
    console.log('7. Getting connectivity status...');
    const connectivity = syncManager.getConnectivityStatus();
    console.log('   Connectivity:', {
        isConnected: connectivity.isConnected,
        consecutiveFailures: connectivity.consecutiveFailures,
        uptime: connectivity.uptime,
        downtime: connectivity.downtime,
    });
    // Get sync statistics
    console.log('8. Getting sync statistics (last 24 hours)...');
    const stats = await syncManager.getSyncStats(24);
    console.log('   Stats:', stats);
    // Manually trigger a sync
    if (queueSize > 0 && clientConnected) {
        console.log('9. Manually triggering sync...');
        await syncManager.triggerSync();
        console.log('   ✓ Manual sync completed');
        // Check queue size again
        const newQueueSize = await database.getUnsynchronizedCount();
        console.log(`   New queue size: ${newQueueSize} readings`);
    }
    // Download configuration (if connected)
    if (clientConnected) {
        console.log('10. Downloading configuration from Client System...');
        try {
            await syncManager.downloadConfiguration();
            console.log('    ✓ Configuration downloaded');
        }
        catch (error) {
            console.error('    ✗ Configuration download failed:', error);
        }
    }
    // Send heartbeat (if connected)
    if (clientConnected) {
        console.log('11. Sending heartbeat to Client System...');
        try {
            await syncManager.sendHeartbeat();
            console.log('    ✓ Heartbeat sent');
        }
        catch (error) {
            console.error('    ✗ Heartbeat failed:', error);
        }
    }
    // Keep running for a while to observe scheduled sync
    console.log('\n12. Sync manager is now running...');
    console.log('    Press Ctrl+C to stop\n');
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n\nShutting down...');
        await syncManager.stop();
        await database.close();
        console.log('✓ Shutdown complete');
        process.exit(0);
    });
    // Keep process alive
    await new Promise(() => { });
}
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
// Run example if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch((error) => {
        console.error('Error:', error);
        process.exit(1);
    });
}
