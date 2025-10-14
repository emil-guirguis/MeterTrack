#!/usr/bin/env node

/**
 * Script to populate register_map column in meters table
 * Uses data from the CSV export to create JSON register mappings
 */

import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { config as dotenvConfig } from 'dotenv';

// Load backend environment
(() => {
  try {
    const thisFile = fileURLToPath(import.meta.url);
    const thisDir = path.dirname(thisFile);
    const rootDir = path.resolve(thisDir, '..');
    const backendEnv = path.join(rootDir, 'backend', '.env');
    dotenvConfig({ path: backendEnv });
  } catch {
    dotenvConfig();
  }
})();

// Import database from backend
const dbPath = path.resolve(process.cwd(), '..', 'backend', 'src', 'config', 'database.js');
const { default: db } = await import(dbPath);

// CSV data from our export (known register mappings from 10.10.10.11)
const REGISTER_MAP_TEMPLATE = {
  description: "Standard Modbus TCP Energy Meter Register Map",
  fields: [
    {
      name: "Status/Frequency",
      address: 0,
      type: "u16",
      source: "holding",
      scale: 10,
      abbr: "Hz",
      description: "Possible frequency indicator (register 0 = ~54)"
    },
    {
      name: "Unknown Flag 1",
      address: 4,
      type: "u16", 
      source: "holding",
      scale: 1,
      abbr: "",
      description: "Always 1 in observations"
    },
    {
      name: "Voltage",
      address: 5,
      type: "u16",
      source: "holding", 
      scale: 200,
      abbr: "V",
      description: "Primary voltage reading (scaled by 200)"
    },
    {
      name: "Current",
      address: 6,
      type: "u16",
      source: "holding",
      scale: 100, 
      abbr: "A",
      description: "Primary current reading (scaled by 100)"
    },
    {
      name: "Active Power",
      address: 7, 
      type: "u16",
      source: "holding",
      scale: 1,
      abbr: "W",
      description: "Active power in watts (direct reading)"
    },
    {
      name: "Unknown Flag 2",
      address: 8,
      type: "u16",
      source: "holding", 
      scale: 1,
      abbr: "",
      description: "Always 5 in observations"
    },
    {
      name: "Unknown Flag 3", 
      address: 9,
      type: "u16",
      source: "holding",
      scale: 1,
      abbr: "",
      description: "Always 2 in observations"
    },
    {
      name: "Voltage (Duplicate)",
      address: 12,
      type: "u16",
      source: "holding",
      scale: 200,
      abbr: "V", 
      description: "Duplicate of register 5"
    },
    {
      name: "Current (Duplicate)", 
      address: 15,
      type: "u16",
      source: "holding",
      scale: 100,
      abbr: "A",
      description: "Duplicate of register 6"
    },
    {
      name: "Unknown Flag 4",
      address: 16,
      type: "u16",
      source: "holding",
      scale: 1,
      abbr: "",
      description: "Always 1 in observations"
    },
    {
      name: "Current Raw",
      address: 17, 
      type: "u16",
      source: "holding",
      scale: 1,
      abbr: "A",
      description: "Raw current value (matches register 6 value before scaling)"
    },
    {
      name: "Active Power (Duplicate)",
      address: 18,
      type: "u16", 
      source: "holding",
      scale: 1,
      abbr: "W",
      description: "Duplicate of register 7"
    },
    {
      name: "Unknown Flag 5",
      address: 19,
      type: "u16",
      source: "holding",
      scale: 1, 
      abbr: "",
      description: "Always 4 in observations"
    }
  ]
};

async function populateRegisterMaps() {
  console.log('🔧 Starting register_map population...');
  
  try {
    // Get all meters
    const result = await db.query('SELECT id, meterid, manufacturer, model FROM meters ORDER BY meterid');
    const meters = result.rows;
    
    console.log(`📊 Found ${meters.length} meters to update`);
    
    let updated = 0;
    let skipped = 0;
    
    for (const meter of meters) {
      try {
        // Check if register_map already exists
        const existing = await db.query(
          'SELECT register_map FROM meters WHERE id = $1',
          [meter.id]
        );
        
        if (existing.rows[0]?.register_map) {
          console.log(`⏭️  Skipping ${meter.meterid} - register_map already exists`);
          skipped++;
          continue;
        }
        
        // Create customized register map based on manufacturer/model
        const registerMap = { ...REGISTER_MAP_TEMPLATE };
        
        // Customize description based on meter info
        if (meter.manufacturer && meter.model) {
          registerMap.description = `${meter.manufacturer} ${meter.model} Register Map`;
        } else if (meter.manufacturer) {
          registerMap.description = `${meter.manufacturer} Register Map`;
        }
        
        // Update the meter with register_map
        await db.query(
          'UPDATE meters SET register_map = $1, updatedat = CURRENT_TIMESTAMP WHERE id = $2',
          [JSON.stringify(registerMap), meter.id]
        );
        
        console.log(`✅ Updated ${meter.meterid} with register map`);
        updated++;
        
      } catch (error) {
        console.error(`❌ Failed to update ${meter.meterid}:`, error.message);
      }
    }
    
    console.log('\n📈 Summary:');
    console.log(`✅ Updated: ${updated} meters`);
    console.log(`⏭️  Skipped: ${skipped} meters`);
    console.log(`📊 Total: ${meters.length} meters`);
    
    // Verify the updates
    const verification = await db.query(
      'SELECT COUNT(*) as total, COUNT(register_map) as with_maps FROM meters'
    );
    const stats = verification.rows[0];
    
    console.log('\n🔍 Verification:');
    console.log(`📊 Total meters: ${stats.total}`);
    console.log(`🗺️  With register maps: ${stats.with_maps}`);
    console.log(`📋 Coverage: ${((stats.with_maps / stats.total) * 100).toFixed(1)}%`);
    
  } catch (error) {
    console.error('❌ Population failed:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await db.end();
    console.log('\n✅ Database connection closed');
  }
}

// Add some example usage info
console.log('🗺️  Register Map Population Script');
console.log('=====================================');
console.log('This script populates the register_map column with standard');
console.log('Modbus register mappings based on the CSV export data.');
console.log('');

populateRegisterMaps().catch(console.error);