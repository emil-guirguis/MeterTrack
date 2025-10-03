// Setup facility-management database with meter readings
// Connection: mongodb+srv://emil_user:db2424@cluster0.tveleqd.mongodb.net/

print("Setting up facility-management database with meter readings...");

// Switch to facility-management database
use('facility-management');

// ============================================================================
// 1. ADD METER READINGS DATA
// ============================================================================

print("Adding meter readings data...");

// Drop existing meter readings if they exist
db.meterReadings.drop();

// Create meter readings collection with sample data
db.meterReadings.insertMany([
    {
        _id: ObjectId(),
        meterId: "ELEC-001-2023",
        ip: "192.168.1.100",
        port: 502,
        kVARh: 1250.75, // kVAR Hour Net
        kVAh: 2890.45,  // kVA Hour Net
        A: 125.8,        // Current (Amperes)
        kWh: 15420.5,    // Watt-Hour Meter
        dPF: 0.95,       // Displacement Power Factor
        dPFchannel: 1,   // Displacement Power Factor Channel
        V: 480.2,        // Volts
        kW: 85.6,        // Watt Demand
        kWpeak: 120.3,   // Demand kW Peak
        timestamp: new Date(),
        quality: 'good',
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        _id: ObjectId(),
        meterId: "ELEC-002-2023",
        ip: "192.168.1.101",
        port: 502,
        kVARh: 890.25,
        kVAh: 2156.80,
        A: 98.4,
        kWh: 12890.75,
        dPF: 0.92,
        dPFchannel: 1,
        V: 478.9,
        kW: 67.2,
        kWpeak: 95.8,
        timestamp: new Date(),
        quality: 'good',
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        _id: ObjectId(),
        meterId: "ELEC-003-2023",
        ip: "192.168.1.102",
        port: 502,
        kVARh: 1456.90,
        kVAh: 3245.60,
        A: 142.6,
        kWh: 18750.25,
        dPF: 0.97,
        dPFchannel: 2,
        V: 481.5,
        kW: 102.8,
        kWpeak: 145.2,
        timestamp: new Date(),
        quality: 'good',
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        _id: ObjectId(),
        meterId: "ELEC-004-2023",
        ip: "192.168.1.103",
        port: 502,
        kVARh: 675.40,
        kVAh: 1890.30,
        A: 78.9,
        kWh: 9875.60,
        dPF: 0.89,
        dPFchannel: 1,
        V: 476.8,
        kW: 54.3,
        kWpeak: 78.9,
        timestamp: new Date(),
        quality: 'estimated',
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        _id: ObjectId(),
        meterId: "ELEC-005-2023",
        ip: "192.168.1.104",
        port: 502,
        kVARh: 2100.85,
        kVAh: 4567.20,
        A: 189.3,
        kWh: 25670.40,
        dPF: 0.94,
        dPFchannel: 3,
        V: 482.1,
        kW: 135.7,
        kWpeak: 198.5,
        timestamp: new Date(),
        quality: 'good',
        createdAt: new Date(),
        updatedAt: new Date()
    }
]);

// Create indexes for meter readings collection
db.meterReadings.createIndex({ meterId: 1 });
db.meterReadings.createIndex({ timestamp: -1 });
db.meterReadings.createIndex({ ip: 1 });
db.meterReadings.createIndex({ quality: 1 });
db.meterReadings.createIndex({ meterId: 1, timestamp: -1 });

print("✅ Meter readings added successfully");

// ============================================================================
// 2. VERIFY EXISTING DATA
// ============================================================================

print("");
print("=== DATABASE VERIFICATION ===");
print("Collections in facility-management:");
print("- Users: " + db.users.countDocuments());
print("- Buildings: " + db.buildings.countDocuments());
print("- Equipment: " + db.equipment.countDocuments());
print("- Contacts: " + db.contacts.countDocuments());
print("- Meters: " + db.meters.countDocuments());
print("- Meter Readings: " + db.meterReadings.countDocuments());
print("- Email Templates: " + db.emailTemplates.countDocuments());
print("- Company Settings: " + db.companySettings.countDocuments());

print("");
print("Sample login credentials:");
print("- Admin: admin@example.com / admin123");
print("- Manager: manager@example.com / manager123");
print("- Technician: tech@example.com / tech123");

print("");
print("Sample meter readings:");
db.meterReadings.find({}, { meterId: 1, ip: 1, kWh: 1, kW: 1, V: 1, A: 1, quality: 1 }).forEach(function(reading) {
    print("- " + reading.meterId + " (" + reading.ip + ") - " + reading.kWh + " kWh, " + reading.kW + " kW, " + reading.V + "V, " + reading.A + "A [" + reading.quality + "]");
});

print("");
print("=== SETUP COMPLETE ===");
print("Your facility-management database is ready with meter readings!");
print("Restart your backend server to connect to the updated database.");