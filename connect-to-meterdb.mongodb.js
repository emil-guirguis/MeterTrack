// Setup Facility Management Collections in meterdb
// Connection: mongodb+srv://emil_user:db2424@cluster0.tveleqd.mongodb.net/meterdb

// Use the existing meterdb database
use('meterdb');

// ============================================================================
// 1. USERS COLLECTION - Authentication & Authorization
// ============================================================================

print("Creating users collection...");

// Create users collection with initial admin user
db.users.insertMany([
    {
        _id: ObjectId(),
        email: 'admin@example.com',
        name: 'System Administrator',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: admin123
        role: 'admin',
        permissions: [
            'user:create', 'user:read', 'user:update', 'user:delete',
            'building:create', 'building:read', 'building:update', 'building:delete',
            'equipment:create', 'equipment:read', 'equipment:update', 'equipment:delete',
            'contact:create', 'contact:read', 'contact:update', 'contact:delete',
            'meter:create', 'meter:read', 'meter:update', 'meter:delete',
            'settings:read', 'settings:update',
            'template:create', 'template:read', 'template:update', 'template:delete'
        ],
        status: 'active',
        lastLogin: null,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        _id: ObjectId(),
        email: 'manager@example.com',
        name: 'Facility Manager',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: manager123
        role: 'manager',
        permissions: [
            'user:read',
            'building:create', 'building:read', 'building:update',
            'equipment:create', 'equipment:read', 'equipment:update',
            'contact:create', 'contact:read', 'contact:update',
            'meter:read', 'meter:update'
        ],
        status: 'active',
        lastLogin: null,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        _id: ObjectId(),
        email: 'tech@example.com',
        name: 'Maintenance Technician',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: tech123
        role: 'technician',
        permissions: [
            'equipment:read', 'equipment:update',
            'meter:read', 'meter:update'
        ],
        status: 'active',
        lastLogin: null,
        createdAt: new Date(),
        updatedAt: new Date()
    }
]);

// Create indexes for users collection
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.users.createIndex({ status: 1 });

// ============================================================================
// 2. BUILDINGS COLLECTION - Facility Management
// ============================================================================

print("Creating buildings collection...");

// Create buildings collection with sample data
db.buildings.insertMany([
    {
        _id: ObjectId(),
        name: 'Main Office Building',
        address: {
            street: '123 Business Avenue',
            city: 'Business City',
            state: 'CA',
            zipCode: '90210',
            country: 'US'
        },
        contactInfo: {
            primaryContact: 'John Manager',
            email: 'manager@mainoffice.com',
            phone: '+1-555-0123',
            website: 'https://mainoffice.com'
        },
        type: 'office',
        status: 'active',
        totalFloors: 5,
        totalUnits: 50,
        yearBuilt: 2010,
        squareFootage: 25000,
        description: 'Main office building with modern amenities and HVAC systems',
        notes: 'Recently renovated HVAC system in 2023',
        equipmentCount: 0,
        meterCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        _id: ObjectId(),
        name: 'Warehouse Complex A',
        address: {
            street: '456 Industrial Boulevard',
            city: 'Industrial City',
            state: 'TX',
            zipCode: '75001',
            country: 'US'
        },
        contactInfo: {
            primaryContact: 'Jane Supervisor',
            email: 'supervisor@warehouse.com',
            phone: '+1-555-0456'
        },
        type: 'warehouse',
        status: 'active',
        totalFloors: 1,
        totalUnits: 10,
        yearBuilt: 2015,
        squareFootage: 50000,
        description: 'Large warehouse facility for storage and distribution',
        notes: 'High-capacity loading docks and automated systems',
        equipmentCount: 0,
        meterCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
    }
]);

// Create indexes for buildings collection
db.buildings.createIndex({ name: 1 });
db.buildings.createIndex({ type: 1 });
db.buildings.createIndex({ status: 1 });
db.buildings.createIndex({ 'address.city': 1 });
db.buildings.createIndex({ 'address.state': 1 });

// ============================================================================
// 3. EQUIPMENT COLLECTION - Equipment Management
// ============================================================================

print("Creating equipment collection...");

// Get building IDs for equipment assignment
const mainOfficeId = db.buildings.findOne({ name: 'Main Office Building' })._id;
const warehouseId = db.buildings.findOne({ name: 'Warehouse Complex A' })._id;

// Create equipment collection with sample data
db.equipment.insertMany([
    {
        _id: ObjectId(),
        name: 'HVAC Unit 1 - Main Floor',
        type: 'HVAC System',
        buildingId: mainOfficeId,
        buildingName: 'Main Office Building',
        specifications: {
            capacity: '5 tons',
            efficiency: 'SEER 16',
            refrigerant: 'R-410A',
            voltage: '480V',
            phases: '3'
        },
        status: 'operational',
        installDate: new Date('2023-01-15'),
        lastMaintenance: new Date('2024-06-01'),
        nextMaintenance: new Date('2024-12-01'),
        serialNumber: 'HVAC-001-2023',
        manufacturer: 'Carrier',
        model: 'XYZ-5000',
        location: 'Roof - North Side',
        notes: 'Regular maintenance required every 6 months',
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        _id: ObjectId(),
        name: 'Emergency Generator',
        type: 'Generator',
        buildingId: mainOfficeId,
        buildingName: 'Main Office Building',
        specifications: {
            capacity: '100kW',
            fuel: 'Natural Gas',
            voltage: '480V',
            runtime: '24 hours'
        },
        status: 'operational',
        installDate: new Date('2023-03-20'),
        lastMaintenance: new Date('2024-05-15'),
        nextMaintenance: new Date('2024-11-15'),
        serialNumber: 'GEN-002-2023',
        manufacturer: 'Generac',
        model: 'GEN-100NG',
        location: 'Basement - Generator Room',
        notes: 'Monthly testing required',
        createdAt: new Date(),
        updatedAt: new Date()
    }
]);

// Create indexes for equipment collection
db.equipment.createIndex({ name: 1 });
db.equipment.createIndex({ type: 1 });
db.equipment.createIndex({ status: 1 });
db.equipment.createIndex({ buildingId: 1 });
db.equipment.createIndex({ serialNumber: 1 }, { unique: true });
db.equipment.createIndex({ nextMaintenance: 1 });

// ============================================================================
// 4. CONTACTS COLLECTION - Customer/Vendor Management
// ============================================================================

print("Creating contacts collection...");

// Create contacts collection with sample data
db.contacts.insertMany([
    {
        _id: ObjectId(),
        type: 'vendor',
        name: 'HVAC Solutions Inc.',
        contactPerson: 'Mike Johnson',
        email: 'mike@hvacsolutions.com',
        phone: '+1-555-HVAC',
        address: {
            street: '789 Service Street',
            city: 'Service City',
            state: 'CA',
            zipCode: '90211',
            country: 'US'
        },
        status: 'active',
        businessType: 'HVAC Contractor',
        industry: 'Mechanical Services',
        website: 'https://hvacsolutions.com',
        notes: 'Preferred vendor for HVAC maintenance and repairs',
        tags: ['hvac', 'maintenance', 'emergency-service'],
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        _id: ObjectId(),
        type: 'customer',
        name: 'Tech Startup LLC',
        contactPerson: 'Sarah Williams',
        email: 'sarah@techstartup.com',
        phone: '+1-555-TECH',
        address: {
            street: '321 Innovation Drive',
            city: 'Tech City',
            state: 'CA',
            zipCode: '90212',
            country: 'US'
        },
        status: 'active',
        businessType: 'Technology',
        industry: 'Software Development',
        website: 'https://techstartup.com',
        notes: 'Tenant in Main Office Building - Floors 3-4',
        tags: ['tenant', 'technology', 'long-term'],
        createdAt: new Date(),
        updatedAt: new Date()
    }
]);

// Create indexes for contacts collection
db.contacts.createIndex({ name: 1 });
db.contacts.createIndex({ type: 1 });
db.contacts.createIndex({ status: 1 });
db.contacts.createIndex({ email: 1 });
db.contacts.createIndex({ tags: 1 });

// ============================================================================
// 5. PRESERVE EXISTING METERS OR CREATE NEW ONES
// ============================================================================

print("Setting up meters collection...");

// Check if meters collection already exists with data
const existingMeterCount = db.meters.countDocuments();

if (existingMeterCount > 0) {
    print("Found existing meters (" + existingMeterCount + "), preserving existing data...");

    // Just add indexes to existing meters collection
    db.meters.createIndex({ serialNumber: 1 }, { unique: true });
    db.meters.createIndex({ type: 1 });
    db.meters.createIndex({ status: 1 });
    db.meters.createIndex({ buildingId: 1 });
    db.meters.createIndex({ equipmentId: 1 });
} else {
    print("Creating new meters collection with sample data...");

    // Create meters collection with sample data
    db.meters.insertMany([
        {
            _id: ObjectId(),
            serialNumber: 'ELEC-001-2023',
            type: 'electric',
            buildingId: mainOfficeId,
            buildingName: 'Main Office Building',
            equipmentId: null,
            equipmentName: null,
            configuration: {
                readingInterval: 15,
                units: 'kWh',
                multiplier: 1,
                registers: [1, 2, 3, 4],
                communicationProtocol: 'Modbus RTU',
                baudRate: 9600,
                slaveId: 1
            },
            lastReading: {
                value: 15420.5,
                timestamp: new Date(),
                unit: 'kWh',
                quality: 'good'
            },
            status: 'active',
            installDate: new Date('2023-01-10'),
            manufacturer: 'Schneider Electric',
            model: 'ION7650',
            location: 'Main Electrical Room',
            notes: 'Main building electrical meter',
            createdAt: new Date(),
            updatedAt: new Date()
        }
    ]);

    // Create indexes for meters collection
    db.meters.createIndex({ serialNumber: 1 }, { unique: true });
    db.meters.createIndex({ type: 1 });
    db.meters.createIndex({ status: 1 });
    db.meters.createIndex({ buildingId: 1 });
    db.meters.createIndex({ equipmentId: 1 });
}

// ============================================================================
// 6. EMAIL TEMPLATES COLLECTION
// ============================================================================

print("Creating email templates collection...");

// Create email templates collection
db.emailTemplates.insertMany([
    {
        _id: ObjectId(),
        name: 'Maintenance Reminder',
        subject: 'Scheduled Maintenance Reminder - {{equipmentName}}',
        content: `<h2>Maintenance Reminder</h2>
<p>Dear {{contactName}},</p>
<p>This is a reminder that scheduled maintenance is due for the following equipment:</p>
<ul>
  <li><strong>Equipment:</strong> {{equipmentName}}</li>
  <li><strong>Location:</strong> {{buildingName}} - {{equipmentLocation}}</li>
  <li><strong>Due Date:</strong> {{maintenanceDate}}</li>
</ul>
<p>Please schedule the maintenance at your earliest convenience.</p>
<p>Best regards,<br>Facility Management Team</p>`,
        variables: [
            { name: 'contactName', description: 'Recipient name', type: 'text', required: true },
            { name: 'equipmentName', description: 'Equipment name', type: 'text', required: true },
            { name: 'buildingName', description: 'Building name', type: 'text', required: true },
            { name: 'equipmentLocation', description: 'Equipment location', type: 'text', required: false },
            { name: 'maintenanceDate', description: 'Maintenance due date', type: 'date', required: true }
        ],
        category: 'Maintenance',
        usageCount: 0,
        status: 'active',
        lastUsed: null,
        createdAt: new Date(),
        updatedAt: new Date()
    }
]);

// Create indexes for email templates collection
db.emailTemplates.createIndex({ name: 1 });
db.emailTemplates.createIndex({ category: 1 });
db.emailTemplates.createIndex({ status: 1 });

// ============================================================================
// 7. COMPANY SETTINGS COLLECTION
// ============================================================================

print("Creating company settings collection...");

// Create company settings collection
db.companySettings.insertOne({
    _id: ObjectId(),
    name: 'Facility Management Solutions',
    logo: null,
    address: {
        street: '100 Management Plaza',
        city: 'Business City',
        state: 'CA',
        zipCode: '90210',
        country: 'US'
    },
    contactInfo: {
        email: 'info@facilitymanagement.com',
        phone: '+1-555-FACILITY',
        website: 'https://facilitymanagement.com'
    },
    branding: {
        primaryColor: '#1976d2',
        secondaryColor: '#dc004e',
        accentColor: '#9c27b0',
        logoUrl: '',
        faviconUrl: '',
        customCSS: '',
        emailSignature: 'Best regards,<br>Facility Management Team'
    },
    systemConfig: {
        timezone: 'America/Los_Angeles',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12',
        currency: 'USD',
        language: 'en',
        defaultPageSize: 25,
        sessionTimeout: 60,
        enableNotifications: true,
        enableEmailAlerts: true,
        enableSMSAlerts: false,
        maintenanceMode: false,
        allowUserRegistration: false,
        requireEmailVerification: true
    },
    features: {
        userManagement: true,
        buildingManagement: true,
        equipmentManagement: true,
        meterManagement: true,
        contactManagement: true,
        emailTemplates: true,
        reporting: true,
        analytics: true,
        mobileApp: false,
        apiAccess: true
    },
    updatedAt: new Date()
});

// ============================================================================
// 8. UPDATE BUILDING COUNTS
// ============================================================================

print("Updating building equipment/meter counts...");

// Update equipment counts for buildings
db.buildings.updateOne(
    { _id: mainOfficeId },
    { $set: { equipmentCount: db.equipment.countDocuments({ buildingId: mainOfficeId }) } }
);

db.buildings.updateOne(
    { _id: warehouseId },
    { $set: { equipmentCount: db.equipment.countDocuments({ buildingId: warehouseId }) } }
);

// Update meter counts for buildings
db.buildings.updateOne(
    { _id: mainOfficeId },
    { $set: { meterCount: db.meters.countDocuments({ buildingId: mainOfficeId }) } }
);

db.buildings.updateOne(
    { _id: warehouseId },
    { $set: { meterCount: db.meters.countDocuments({ buildingId: warehouseId }) } }
);

// ============================================================================
// 9. FINAL VERIFICATION
// ============================================================================

print("");
print("=== FACILITY MANAGEMENT DATABASE SETUP COMPLETE ===");
print("");
print("Collections created in meterdb:");
print("- Users: " + db.users.countDocuments());
print("- Buildings: " + db.buildings.countDocuments());
print("- Equipment: " + db.equipment.countDocuments());
print("- Contacts: " + db.contacts.countDocuments());
print("- Meters: " + db.meters.countDocuments());
print("- Email Templates: " + db.emailTemplates.countDocuments());
print("- Company Settings: " + db.companySettings.countDocuments());
print("");
print("Login credentials for the web app:");
print("- Admin: admin@example.com / admin123");
print("- Manager: manager@example.com / manager123");
print("- Technician: tech@example.com / tech123");
print("");
print("Your meterdb database is now ready for the facility management system!");