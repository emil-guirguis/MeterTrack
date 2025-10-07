#!/usr/bin/env node
import { MongoClient } from 'mongodb';
import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/meterdb';
const COLLECTION_NAME = process.env.MONGODB_COLLECTION || 'meterreadings';

async function checkMeterIds() {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db('meterdb');
    const collection = db.collection(COLLECTION_NAME);
    
    // Get unique meter IDs
    const uniqueMeterIds = await collection.distinct('meterId');
    console.log('📊 Unique Meter IDs:', uniqueMeterIds);
    
    // Get sample readings
    const readings = await collection.find({}).sort({ timestamp: -1 }).limit(5).toArray();
    console.log('\n📋 Sample readings:');
    readings.forEach((r, i) => {
      console.log(`${i+1}. MeterId: ${r.meterId}, Timestamp: ${new Date(r.timestamp).toLocaleString()}, Energy: ${r.energy}`);
    });
    
    // Count by meter ID
    const counts = await collection.aggregate([
      { $group: { _id: '$meterId', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();
    
    console.log('\n📈 Readings per Meter ID:');
    counts.forEach(c => {
      console.log(`  ${c._id}: ${c.count} readings`);
    });
    
    await client.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkMeterIds();