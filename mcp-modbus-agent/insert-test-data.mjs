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

async function insertTestData() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    
    const db = client.db('meterdb');
    const collection = db.collection(COLLECTION_NAME);
    
    console.log('📊 Generating test meter readings...');
    
    const testReadings = [];
    const now = new Date();
    
    // Generate 10 test readings with different timestamps
    for (let i = 0; i < 10; i++) {
      const timestamp = new Date(now.getTime() - (i * 30000)); // 30 seconds apart
      
      const reading = {
        meterId: `10.10.10.11_1`,
        deviceIP: '10.10.10.11',
        slaveId: 1,
        source: 'modbus-test',
        
        // Basic measurements with realistic values
        voltage: 230 + (Math.random() - 0.5) * 10,
        current: 15 + (Math.random() - 0.5) * 5,
        power: 3000 + (Math.random() - 0.5) * 500,
        energy: 166136298 + i * 100,
        frequency: 50 + (Math.random() - 0.5) * 0.5,
        powerFactor: 0.85 + (Math.random() - 0.5) * 0.1,
        temperatureC: 25 + (Math.random() - 0.5) * 10,
        
        // API format fields
        ip: '10.10.10.11',
        port: 502,
        kVARh: 1000 + i * 10,
        kVAh: 2000 + i * 15,
        A: 15 + (Math.random() - 0.5) * 5,
        kWh: (166136298 + i * 100) / 1000,
        dPF: 0.85 + (Math.random() - 0.5) * 0.1,
        dPFchannel: 1,
        V: 230 + (Math.random() - 0.5) * 10,
        kW: (3000 + (Math.random() - 0.5) * 500) / 1000,
        kWpeak: (3500 + (Math.random() - 0.5) * 500) / 1000,
        
        // Phase measurements
        phaseAVoltage: 230 + (Math.random() - 0.5) * 5,
        phaseBVoltage: 230 + (Math.random() - 0.5) * 5,
        phaseCVoltage: 230 + (Math.random() - 0.5) * 5,
        phaseACurrent: 15 + (Math.random() - 0.5) * 2,
        phaseBCurrent: 15 + (Math.random() - 0.5) * 2,
        phaseCCurrent: 15 + (Math.random() - 0.5) * 2,
        phaseAPower: 1000 + (Math.random() - 0.5) * 200,
        phaseBPower: 1000 + (Math.random() - 0.5) * 200,
        phaseCPower: 1000 + (Math.random() - 0.5) * 200,
        
        // Line-to-line voltages
        lineToLineVoltageAB: 400 + (Math.random() - 0.5) * 10,
        lineToLineVoltageBC: 400 + (Math.random() - 0.5) * 10,
        lineToLineVoltageCA: 400 + (Math.random() - 0.5) * 10,
        
        // Power measurements
        totalReactivePower: 500 + (Math.random() - 0.5) * 100,
        totalApparentPower: 3200 + (Math.random() - 0.5) * 300,
        
        // Energy measurements
        totalActiveEnergyWh: 166136298 + i * 100,
        totalReactiveEnergyVARh: 50000000 + i * 50,
        totalApparentEnergyVAh: 170000000 + i * 110,
        
        // Additional measurements
        frequencyHz: 50 + (Math.random() - 0.5) * 0.5,
        neutralCurrent: 0.5 + Math.random() * 0.5,
        
        // Power factor per phase
        phaseAPowerFactor: 0.85 + (Math.random() - 0.5) * 0.1,
        phaseBPowerFactor: 0.85 + (Math.random() - 0.5) * 0.1,
        phaseCPowerFactor: 0.85 + (Math.random() - 0.5) * 0.1,
        
        // Harmonic distortion
        voltageThd: 2 + Math.random() * 3,
        currentThd: 3 + Math.random() * 4,
        
        // Demand measurements
        maxDemandKW: 3.5 + Math.random() * 0.5,
        maxDemandKVAR: 1.2 + Math.random() * 0.3,
        maxDemandKVA: 3.7 + Math.random() * 0.5,
        
        timestamp: timestamp,
        quality: i % 3 === 0 ? 'estimated' : (i % 7 === 0 ? 'questionable' : 'good'),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      testReadings.push(reading);
    }
    
    console.log('💾 Inserting test data...');
    const result = await collection.insertMany(testReadings);
    
    console.log(`✅ Successfully inserted ${result.insertedCount} test meter readings`);
    console.log('📈 Test data timestamps range from:', testReadings[testReadings.length - 1].timestamp, 'to', testReadings[0].timestamp);
    
  } catch (error) {
    console.error('❌ Error inserting test data:', error);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

insertTestData();