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
const INTERVAL_MS = parseInt(process.env.COLLECTION_INTERVAL || '10000'); // 10 seconds

let client;
let collection;
let intervalId;
let readingCount = 0;

async function connectToDatabase() {
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db('meterdb');
    collection = db.collection(COLLECTION_NAME);
    console.log('✅ Connected to MongoDB');
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    return false;
  }
}

function generateRealisticReading() {
  const now = new Date();
  const baseVoltage = 230;
  const baseCurrent = 15;
  const basePower = 3000;
  
  // Add some realistic variations
  const voltageVariation = (Math.random() - 0.5) * 10;
  const currentVariation = (Math.random() - 0.5) * 3;
  const powerVariation = (Math.random() - 0.5) * 500;
  
  const voltage = baseVoltage + voltageVariation;
  const current = baseCurrent + currentVariation;
  const power = basePower + powerVariation;
  
  return {
    meterId: `10.10.10.11_1`,
    deviceIP: '10.10.10.11',
    slaveId: 1,
    source: 'modbus-simulator',
    
    // Basic measurements
    voltage: voltage,
    current: current,
    power: power,
    energy: 166136298 + (readingCount * 50), // Incrementing energy
    frequency: 50 + (Math.random() - 0.5) * 0.2,
    powerFactor: 0.85 + (Math.random() - 0.5) * 0.1,
    temperatureC: 25 + (Math.random() - 0.5) * 5,
    
    // API format fields
    ip: '10.10.10.11',
    port: 502,
    kVARh: 1000 + (readingCount * 5),
    kVAh: 2000 + (readingCount * 8),
    A: current,
    kWh: (166136298 + (readingCount * 50)) / 1000,
    dPF: 0.85 + (Math.random() - 0.5) * 0.1,
    dPFchannel: 1,
    V: voltage,
    kW: power / 1000,
    kWpeak: (power + 200) / 1000,
    
    // Phase measurements
    phaseAVoltage: voltage + (Math.random() - 0.5) * 2,
    phaseBVoltage: voltage + (Math.random() - 0.5) * 2,
    phaseCVoltage: voltage + (Math.random() - 0.5) * 2,
    phaseACurrent: current + (Math.random() - 0.5) * 1,
    phaseBCurrent: current + (Math.random() - 0.5) * 1,
    phaseCCurrent: current + (Math.random() - 0.5) * 1,
    phaseAPower: power / 3 + (Math.random() - 0.5) * 50,
    phaseBPower: power / 3 + (Math.random() - 0.5) * 50,
    phaseCPower: power / 3 + (Math.random() - 0.5) * 50,
    
    // Line-to-line voltages
    lineToLineVoltageAB: 400 + (Math.random() - 0.5) * 5,
    lineToLineVoltageBC: 400 + (Math.random() - 0.5) * 5,
    lineToLineVoltageCA: 400 + (Math.random() - 0.5) * 5,
    
    // Power measurements
    totalReactivePower: 500 + (Math.random() - 0.5) * 100,
    totalApparentPower: power * 1.1 + (Math.random() - 0.5) * 200,
    
    // Energy measurements
    totalActiveEnergyWh: 166136298 + (readingCount * 50),
    totalReactiveEnergyVARh: 50000000 + (readingCount * 25),
    totalApparentEnergyVAh: 170000000 + (readingCount * 55),
    
    // Additional measurements
    frequencyHz: 50 + (Math.random() - 0.5) * 0.2,
    neutralCurrent: 0.1 + Math.random() * 0.3,
    
    // Power factor per phase
    phaseAPowerFactor: 0.85 + (Math.random() - 0.5) * 0.05,
    phaseBPowerFactor: 0.85 + (Math.random() - 0.5) * 0.05,
    phaseCPowerFactor: 0.85 + (Math.random() - 0.5) * 0.05,
    
    // Harmonic distortion
    voltageThd: 2 + Math.random() * 1,
    currentThd: 3 + Math.random() * 1.5,
    
    // Demand measurements
    maxDemandKW: (power / 1000) * 1.1 + Math.random() * 0.2,
    maxDemandKVAR: 1.2 + Math.random() * 0.2,
    maxDemandKVA: (power / 1000) * 1.15 + Math.random() * 0.2,
    
    timestamp: now,
    quality: readingCount % 10 === 0 ? 'estimated' : 'good',
    createdAt: now,
    updatedAt: now
  };
}

async function insertReading() {
  try {
    const reading = generateRealisticReading();
    await collection.insertOne(reading);
    readingCount++;
    
    const timestamp = reading.timestamp.toLocaleTimeString();
    console.log(`📊 [${timestamp}] Inserted reading #${readingCount} - Power: ${reading.kW.toFixed(2)}kW, Voltage: ${reading.V.toFixed(1)}V`);
    
  } catch (error) {
    console.error('❌ Error inserting reading:', error);
  }
}

async function startSimulator() {
  console.log('🚀 Starting Continuous Modbus Data Simulator...');
  console.log(`📊 Configuration:`);
  console.log(`   MongoDB: ${MONGODB_URI}`);
  console.log(`   Collection: ${COLLECTION_NAME}`);
  console.log(`   Interval: ${INTERVAL_MS}ms (${INTERVAL_MS/1000}s)`);
  console.log('');
  
  const connected = await connectToDatabase();
  if (!connected) {
    process.exit(1);
  }
  
  console.log('⏰ Starting data generation...');
  console.log('🛑 Press Ctrl+C to stop');
  console.log('');
  
  // Insert first reading immediately
  await insertReading();
  
  // Then continue every interval
  intervalId = setInterval(insertReading, INTERVAL_MS);
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Stopping data simulator...');
  
  if (intervalId) {
    clearInterval(intervalId);
  }
  
  if (client) {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
  
  console.log(`✅ Simulator stopped after ${readingCount} readings`);
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Stopping data simulator...');
  
  if (intervalId) {
    clearInterval(intervalId);
  }
  
  if (client) {
    await client.close();
  }
  
  process.exit(0);
});

startSimulator().catch(console.error);