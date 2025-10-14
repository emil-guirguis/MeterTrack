const db = require('./backend/src/config/database');

async function verifyMigration() {
  try {
    await db.connect();
    console.log('🔍 Verifying migration status...\n');
    
    // Check devices table structure and data
    const devicesResult = await db.query('SELECT COUNT(*) as count FROM devices');
    console.log('✓ Devices table count:', devicesResult.rows[0].count);
    
    const devicesSample = await db.query('SELECT id, name, description FROM devices LIMIT 5');
    console.log('✓ Sample devices:');
    devicesSample.rows.forEach(device => {
      console.log('  -', device.name, ':', device.description);
    });
    
    // Check brands_backup table
    const brandsBackupResult = await db.query('SELECT COUNT(*) as count FROM brands_backup');
    console.log('\n✓ Brands backup table count:', brandsBackupResult.rows[0].count);
    
    // Check brand_device_mapping table
    try {
      const mappingResult = await db.query('SELECT COUNT(*) as count FROM brand_device_mapping');
      console.log('✓ Brand-device mapping records:', mappingResult.rows[0].count);
    } catch (e) {
      console.log('⚠️  Brand-device mapping table not found');
    }
    
    // Check meters table and device relationships
    const metersResult = await db.query('SELECT COUNT(*) as count FROM meters');
    const metersWithDeviceResult = await db.query('SELECT COUNT(*) as count FROM meters WHERE device_id IS NOT NULL');
    console.log('\n✓ Total meters:', metersResult.rows[0].count);
    console.log('✓ Meters with device_id:', metersWithDeviceResult.rows[0].count);
    
    // Check meter-device relationships
    const meterDeviceJoin = await db.query(`
      SELECT m.meterid, m.name as meter_name, m.manufacturer, m.model, 
             d.name as device_name, d.description as device_description
      FROM meters m
      LEFT JOIN devices d ON m.device_id = d.id
      LIMIT 5
    `);
    
    console.log('\n✓ Sample meter-device relationships:');
    meterDeviceJoin.rows.forEach(row => {
      console.log('  - Meter:', row.meter_name, '| Device:', row.device_name);
    });
    
    // Check for any orphaned meters
    const orphanedMeters = await db.query(`
      SELECT COUNT(*) as count FROM meters 
      WHERE device_id IS NULL AND (manufacturer IS NOT NULL OR model IS NOT NULL)
    `);
    console.log('\n✓ Orphaned meters (have manufacturer/model but no device_id):', orphanedMeters.rows[0].count);
    
    console.log('\n🎉 Migration verification completed!');
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  } finally {
    await db.disconnect();
  }
}

verifyMigration();