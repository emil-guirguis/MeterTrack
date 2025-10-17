/**
 * Simple test to verify the enhanced Modbus client can be instantiated
 */

import winston from 'winston';
import { EnhancedModbusClient } from './enhanced-modbus-client.js';
import { ModbusConnectionPool } from './connection-pool.js';
import { ModbusClientConfig } from './types/modbus.js';

// Create a simple logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
    })
  ),
  transports: [
    new winston.transports.Console()
  ]
});

// Test configuration
const testConfig: ModbusClientConfig = {
  host: '127.0.0.1', // localhost for testing
  port: 502,
  unitId: 1,
  timeout: 5000,
  maxRetries: 3,
  reconnectDelay: 5000
};

async function testEnhancedClient() {
  console.log('Testing Enhanced Modbus Client instantiation...');
  
  try {
    // Test client creation
    const client = new EnhancedModbusClient(testConfig, logger);
    console.log('✅ Enhanced Modbus Client created successfully');
    
    // Test configuration retrieval
    const config = client.getConfig();
    console.log('✅ Configuration retrieved:', config);
    
    // Test performance metrics
    const metrics = client.getPerformanceMetrics();
    console.log('✅ Performance metrics retrieved:', metrics);
    
    // Test health status
    const health = client.getHealthStatus();
    console.log('✅ Health status retrieved:', health);
    
    // Clean up
    client.destroy();
    console.log('✅ Client destroyed successfully');
    
  } catch (error) {
    console.error('❌ Error testing Enhanced Modbus Client:', error);
  }
}

async function testConnectionPool() {
  console.log('\nTesting Connection Pool instantiation...');
  
  try {
    // Test pool creation
    const pool = new ModbusConnectionPool({
      maxConnections: 5,
      idleTimeout: 300000,
      acquireTimeout: 30000,
      createRetryInterval: 5000,
      maxRetries: 3,
      healthCheckInterval: 60000
    }, logger);
    
    console.log('✅ Connection Pool created successfully');
    
    // Test stats retrieval
    const stats = pool.getStats();
    console.log('✅ Pool stats retrieved:', stats);
    
    // Clean up
    await pool.closeAll();
    console.log('✅ Pool closed successfully');
    
  } catch (error) {
    console.error('❌ Error testing Connection Pool:', error);
  }
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('ENHANCED MODBUS CLIENT - INSTANTIATION TESTS');
  console.log('='.repeat(60));
  
  await testEnhancedClient();
  await testConnectionPool();
  
  console.log('\n='.repeat(60));
  console.log('TESTS COMPLETED');
  console.log('='.repeat(60));
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { testEnhancedClient, testConnectionPool };