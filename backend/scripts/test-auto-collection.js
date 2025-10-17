#!/usr/bin/env node

/**
 * Test script for Auto Meter Collection Service
 * This script tests the auto collection functionality without starting the full server
 */

require('dotenv').config();
const db = require('../src/config/database');
const autoMeterCollectionService = require('../src/services/AutoMeterCollectionService');

async function testAutoCollection() {
    console.log('🧪 Testing Auto Meter Collection Service...\n');
    
    try {
        // Connect to database
        console.log('📊 Connecting to database...');
        await db.connect();
        console.log('✅ Database connected\n');
        
        // Initialize the service
        console.log('🔄 Initializing auto collection service...');
        const initResult = await autoMeterCollectionService.initialize({
            collection: {
                enabled: true,
                interval: 10000, // 10 seconds for testing
                batchSize: 5,
                timeout: 5000,
                retryAttempts: 1
            },
            logging: {
                logSuccessfulReads: true,
                logFailedReads: true,
                logInterval: 30000 // 30 seconds
            }
        });
        
        if (!initResult.success) {
            throw new Error(`Initialization failed: ${initResult.error}`);
        }
        console.log('✅ Service initialized\n');
        
        // Get initial status
        console.log('📊 Getting service status...');
        const healthStatus = await autoMeterCollectionService.getHealthStatus();
        console.log('Health Status:', JSON.stringify(healthStatus, null, 2));
        console.log('');
        
        // Start collection
        console.log('🔄 Starting auto collection...');
        const startResult = autoMeterCollectionService.startCollection();
        
        if (!startResult.success) {
            throw new Error(`Failed to start collection: ${startResult.message}`);
        }
        console.log('✅ Collection started\n');
        
        // Let it run for a few cycles
        console.log('⏱️  Running collection for 35 seconds...');
        console.log('   (This will allow for 3-4 collection cycles at 10-second intervals)\n');
        
        // Show stats every 15 seconds
        const statsInterval = setInterval(() => {
            const stats = autoMeterCollectionService.getCollectionStats();
            console.log('📊 Current Stats:', {
                isCollecting: stats.isCollecting,
                totalAttempts: stats.totalAttempts,
                successfulReads: stats.successfulReads,
                failedReads: stats.failedReads,
                successRate: stats.successRate + '%',
                lastCollectionTime: stats.lastCollectionTime
            });
        }, 15000);
        
        // Stop after 35 seconds
        setTimeout(async () => {
            clearInterval(statsInterval);
            
            console.log('\n🛑 Stopping collection...');
            autoMeterCollectionService.stopCollection();
            
            // Final stats
            const finalStats = autoMeterCollectionService.getCollectionStats();
            console.log('\n📊 Final Statistics:');
            console.log('   Total Attempts:', finalStats.totalAttempts);
            console.log('   Successful Reads:', finalStats.successfulReads);
            console.log('   Failed Reads:', finalStats.failedReads);
            console.log('   Success Rate:', finalStats.successRate + '%');
            console.log('   Last Collection:', finalStats.lastCollectionTime);
            
            if (finalStats.lastError) {
                console.log('   Last Error:', finalStats.lastError);
            }
            
            console.log('\n✅ Test completed successfully!');
            
            // Cleanup
            await db.disconnect();
            process.exit(0);
            
        }, 35000);
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        
        try {
            await db.disconnect();
        } catch (dbError) {
            console.error('❌ Database disconnect error:', dbError.message);
        }
        
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    
    try {
        autoMeterCollectionService.stopCollection();
        await db.disconnect();
    } catch (error) {
        console.error('Error during shutdown:', error.message);
    }
    
    process.exit(0);
});

// Run the test
testAutoCollection();