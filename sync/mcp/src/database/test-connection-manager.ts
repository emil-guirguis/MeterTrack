/**
 * Test script for Database Connection Manager
 * 
 * Tests dual database connections (local and remote)
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import winston from 'winston';
import { createConnectionManagerFromEnv } from './connection-manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
// When running from dist, paths need to account for the build directory
dotenv.config({ path: join(__dirname, '../../../../.env') }); // Root .env
dotenv.config({ path: join(__dirname, '../../.env') }); // Local .env

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.colorize(),
    winston.format.simple()
  ),
  transports: [
    new winston.transports.Console(),
  ],
});

async function testConnectionManager() {
  logger.info('=== Testing Database Connection Manager ===');
  
  try {
    // Create connection manager
    logger.info('Creating connection manager...');
    const connectionManager = createConnectionManagerFromEnv(logger);
    
    // Initialize connections
    logger.info('Initializing connections...');
    await connectionManager.initialize();
    
    // Get status
    const status = connectionManager.getStatus();
    logger.info('Connection Status:', status);
    
    // Test queries on both databases
    logger.info('\n=== Testing Local Database ===');
    const localPool = connectionManager.getLocalPool();
    const localResult = await localPool.query('SELECT NOW() as current_time, current_database() as db_name');
    logger.info('Local DB Query Result:', localResult.rows[0]);
    
    logger.info('\n=== Testing Remote Database ===');
    const remotePool = connectionManager.getRemotePool();
    const remoteResult = await remotePool.query('SELECT NOW() as current_time, current_database() as db_name');
    logger.info('Remote DB Query Result:', remoteResult.rows[0]);
    
    // Close connections
    logger.info('\n=== Closing Connections ===');
    await connectionManager.close();
    
    logger.info('\n✅ All tests passed!');
  } catch (error) {
    logger.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run test
testConnectionManager();
