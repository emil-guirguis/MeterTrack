/**
 * Migration: Create device_register junction table
 * 
 * This migration creates the junction table to associate devices with registers.
 * This allows a device to have multiple registers and a register to be used by multiple devices.
 */

const db = require('../src/config/database');

async function up() {
  try {
    console.log('Creating device_register table...');
    
    // Ensure database is connected
    if (!db.connected) {
      await db.connect();
    }
    
    await db.query(`
      CREATE TABLE IF NOT EXISTS device_register (
        id SERIAL PRIMARY KEY,
        device_id INTEGER NOT NULL REFERENCES device(id) ON DELETE CASCADE,
        register_id INTEGER NOT NULL REFERENCES register(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(device_id, register_id)
      );
    `);

    // Create index for faster lookups
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_device_register_device_id 
      ON device_register(device_id);
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_device_register_register_id 
      ON device_register(register_id);
    `);

    console.log('✓ device_register table created successfully');
  } catch (error) {
    console.error('Error creating device_register table:', error);
    throw error;
  }
}

async function down() {
  try {
    console.log('Dropping device_register table...');
    
    // Ensure database is connected
    if (!db.connected) {
      await db.connect();
    }
    
    await db.query(`
      DROP TABLE IF EXISTS device_register CASCADE;
    `);

    console.log('✓ device_register table dropped successfully');
  } catch (error) {
    console.error('Error dropping device_register table:', error);
    throw error;
  }
}

module.exports = { up, down };
