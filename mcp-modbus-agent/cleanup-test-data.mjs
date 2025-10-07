#!/usr/bin/env node
import { config as dotenvConfig } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import { MongoClient } from 'mongodb';

// Load environment variables
(() => {
  try {
    const thisFile = fileURLToPath(import.meta.url);
    const thisDir = path.dirname(thisFile);
    const agentEnv = path.join(thisDir, '.env');
    dotenvConfig({ path: agentEnv });
  } catch {
    dotenvConfig();
  }
})();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/meterdb';
const COLLECTION_NAME = process.env.MONGODB_COLLECTION || 'meterreadings';

async function cleanupTestData() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    
    const db = client.db('meterdb');
    const collection = db.collection(COLLECTION_NAME);
    
    console.log('🧹 Cleaning up test and simulator data...');
    
    // Remove test data (data with test sources)
    const testSources = ['modbus-test', 'modbus-simulator'];
    
    for (const source of testSources) {
      const deleteResult = await collection.deleteMany({ source: source });
      console.log(`🗑️  Deleted ${deleteResult.deletedCount} records with source: ${source}`);
    }
    
    // Get remaining count
    const remainingCount = await collection.countDocuments();
    console.log(`📊 Remaining meter readings in database: ${remainingCount}`);
    
    if (remainingCount === 0) {
      console.log('✨ Database is now clean and ready for real meter data');
    } else {
      console.log('✅ Test data cleaned, real meter data preserved');
    }
    
  } catch (error) {
    console.error('❌ Error cleaning up test data:', error);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

cleanupTestData();