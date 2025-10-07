#!/usr/bin/env node
import { MongoClient } from 'mongodb';
import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/meterdb';
const COLLECTION_NAME = process.env.MONGODB_COLLECTION || 'meterreadings';

async function checkData() {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db('meterdb');
    const collection = db.collection(COLLECTION_NAME);
    
    const count = await collection.countDocuments();
    const latest = await collection.findOne({}, { sort: { timestamp: -1 } });
    
    console.log(`📊 Total readings in database: ${count}`);
    
    if (latest) {
      console.log(`🕐 Latest reading: ${new Date(latest.timestamp).toLocaleString()}`);
      console.log(`⚡ Energy: ${latest.energy} Wh`);
      console.log(`🔌 Power: ${latest.power} W`);
      console.log(`📈 Voltage: ${latest.voltage} V`);
      console.log(`🔄 Current: ${latest.current} A`);
    } else {
      console.log('❌ No readings found in database');
    }
    
    await client.close();
  } catch (error) {
    console.error('❌ Error checking database:', error.message);
  }
}

checkData();