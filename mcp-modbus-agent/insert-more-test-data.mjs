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

async function insertMoreTestData() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    
    const db = client.db('meterdb');
    const collection = db.collection(COLLECTION_NAME);
    
    console.log('📊 Generating more test meter readings for vertical scrolling...');
    
    const testReadings = [];
    const now = new Date();
    
    // Generate 25 more test readings to trigger vertical scrolling
    for (let i = 0; i < 25; i++) {
      const timestamp = new Date(now.getTime() - (i * 15000)); // 15 seconds apart
      
      const reading = {
        meterId: `10.10.10.${11 + (i % 3)}_${1 + (i % 2)}`, // Multiple meters
        deviceIP: `10.10.10.${11 + (i % 3)}`,
        slaveId: 1 + (i % 2),
        source: 'modbus-test',
        
        // Basic measurements with realistic values
        voltage: 220 + (Math.random() - 0.5) * 20,
        current: 10 + (Math.random() - 0.5) * 8,
        power: 2200 + (Math.random() - 0.5) * 800,
        energy: 166136298 + i * 150,
        frequency: 49.8 + (Math.random() - 0.5) * 0.4,
        powerFactor: 0.80 + (Math.random() - 0.5) * 0.2,
        temperatureC: 20 + (Math.random() - 0.5) * 15,
        
        // API format fields
        ip: `10.10.10.${11 + (i % 3)}`,
        port: 502,
        kVARh: 800 + i * 12,
        kVAh: 1800 + i * 18,
        A: 10 + (Math.random() - 0.5) * 8,
        kWh: (166136298 + i * 150) / 1000,
        dPF: 0.80 + (Math.random() - 0.5) * 0.2,
        dPFchannel: 1,
        V: 220 + (Math.random() - 0.5) * 20,
        kW: (2200 + (Math.random() - 0.5) * 800) / 1000,
        kWpeak: (2800 + (Math.random() - 0.5) * 600) / 1000,
        
        // Phase measurements with variations
        phaseAVoltage: 220 + (Math.random() - 0.5) * 8,
        phaseBVoltage: 220 + (Math.random() - 0.5) * 8,
        phaseCVoltage: 220 + (Math.random() - 0.5) * 8,
        phaseACurrent: 10 + (Math.random() - 0.5) * 3,
        phaseBCurrent: 10 + (Math.random() - 0.5) * 3,
        phaseCCurrent: 10 + (Math.random() - 0.5) * 3,
        phaseAPower: 750 + (Math.random() - 0.5) * 250,
        phaseBPower: 750 + (Math.random() - 0.5) * 250,
        phaseCPower: 750 + (Math.random() - 0.5) * 250,
        
        // Line-to-line voltages
        lineToLineVoltageAB: 380 + (Math.random() - 0.5) * 15,
        lineToLineVoltageBC: 380 + (Math.random() - 0.5) * 15,
        lineToLineVoltageCA: 380 + (Math.random() - 0.5) * 15,
        
        // Power measurements
        totalReactivePower: 400 + (Math.random() - 0.5) * 150,
        totalApparentPower: 2400 + (Math.random() - 0.5) * 400,
        
        // Energy measurements
        totalActiveEnergyWh: 166136298 + i * 150,
        totalReactiveEnergyVARh: 45000000 + i * 60,
        totalApparentEnergyVAh: 168000000 + i * 120,
        
        // Additional measurements
        frequencyHz: 49.8 + (Math.random() - 0.5) * 0.4,
        neutralCurrent: 0.3 + Math.random() * 0.8,
        
        // Power factor per phase
        phaseAPowerFactor: 0.80 + (Math.random() - 0.5) * 0.15,
        phaseBPowerFactor: 0.80 + (Math.random() - 0.5) * 0.15,
        phaseCPowerFactor: 0.80 + (Math.random() - 0.5) * 0.15,
        
        // Harmonic distortion
        voltageThd: 1.5 + Math.random() * 4,
        currentThd: 2.5 + Math.random() * 5,
        
        // Demand measurements
        maxDemandKW: 2.8 + Math.random() * 0.8,
        maxDemandKVAR: 1.0 + Math.random() * 0.4,
        maxDemandKVA: 3.0 + Math.random() * 0.7,
        
        timestamp: timestamp,
        quality: i % 4 === 0 ? 'estimated' : (i % 9 === 0 ? 'questionable' : 'good'),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      testReadings.push(reading);
    }
    
    console.log('💾 Inserting additional test data...');
    const result = await collection.insertMany(testReadings);
    
    console.log(`✅ Successfully inserted ${result.insertedCount} additional test meter readings`);
    
    // Get total count
    const totalCount = await collection.countDocuments();
    console.log(`📊 Total meter readings in database: ${totalCount}`);
    
  } catch (error) {
    console.error('❌ Error inserting test data:', error);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

insertMoreTestData();