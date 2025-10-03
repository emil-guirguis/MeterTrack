// Copy meter readings from meterdb to facility-management database
// Connection: mongodb+srv://emil_user:db2424@cluster0.tveleqd.mongodb.net/

print("Copying meter readings from meterdb to facility-management...");

// First, get meter readings from meterdb
use('meterdb');
const meterReadings = db.meterReadings.find({}).toArray();

print("Found " + meterReadings.length + " meter readings in meterdb");

// Switch to facility-management and insert meter readings
use('facility-management');

// Drop existing meterReadings collection if it exists
db.meterReadings.drop();

// Insert meter readings into facility-management
if (meterReadings.length > 0) {
    db.meterReadings.insertMany(meterReadings);
    
    // Create indexes for meter readings collection
    db.meterReadings.createIndex({ meterId: 1 });
    db.meterReadings.createIndex({ timestamp: -1 });
    db.meterReadings.createIndex({ ip: 1 });
    db.meterReadings.createIndex({ quality: 1 });
    db.meterReadings.createIndex({ meterId: 1, timestamp: -1 });
    
    print("Successfully copied " + meterReadings.length + " meter readings to facility-management");
    print("");
    print("Meter readings available:");
    db.meterReadings.find({}, { meterId: 1, ip: 1, kWh: 1, timestamp: 1 }).forEach(function(reading) {
        print("- " + reading.meterId + " (" + reading.ip + ") - " + reading.kWh + " kWh");
    });
} else {
    print("No meter readings found to copy");
}

print("");
print("=== METER READINGS COPY COMPLETE ===");
print("Meter readings are now available in facility-management database");