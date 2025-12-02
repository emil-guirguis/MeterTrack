# Complete Migration Guide - All Models with Relationships

## 🎉 Migration Complete!

Successfully generated **16 models** with schema definitions from your database!

## 📦 Generated Models

All models are in `generated/models/`:

1. ✅ **Contact** (17 fields)
2. ✅ **Device** (10 fields)
3. ✅ **EmailLogs** (13 fields)
4. ✅ **EmailTemplates** (13 fields)
5. ✅ **Location** (16 fields)
6. ✅ **Meter** (20 fields)
7. ✅ **MeterMaintenance** (1 field)
8. ✅ **MeterMaps** (7 fields)
9. ✅ **MeterMonitoringAlerts** (8 fields)
10. ✅ **MeterReadings** (119 fields!)
11. ✅ **MeterStatusLog** (6 fields)
12. ✅ **MeterTriggers** (12 fields)
13. ✅ **MeterUsageAlerts** (8 fields)
14. ✅ **NotificationLogs** (13 fields)
15. ✅ **Tenant** (13 fields)
16. ✅ **Users** (46 fields)

## 🔗 Adding Relationships

### Relationship Types

```javascript
const { RelationshipTypes } = require('...SchemaDefinition');

RelationshipTypes.BELONGS_TO    // Many-to-one (Meter belongs to Device)
RelationshipTypes.HAS_MANY      // One-to-many (Device has many Meters)
RelationshipTypes.HAS_ONE       // One-to-one
RelationshipTypes.MANY_TO_MANY  // Many-to-many (through junction table)
```

### Example: Meter with Relationships

```javascript
relationships: {
    // Meter belongs to Device
    device: relationship({
        type: RelationshipTypes.BELONGS_TO,
        model: 'Device',
        foreignKey: 'device_id',
        targetKey: 'id',
        autoLoad: false,  // Set true to auto-load with queries
        select: ['id', 'manufacturer', 'model_number'], // Fields to load
        as: 'device', // Alias in results
    }),
    
    // Meter belongs to Location
    location: relationship({
        type: RelationshipTypes.BELONGS_TO,
        model: 'Location',
        foreignKey: 'location_id',
        autoLoad: false,
    }),
    
    // Meter has many Readings
    readings: relationship({
        type: RelationshipTypes.HAS_MANY,
        model: 'MeterReadings',
        foreignKey: 'meter_id',
        targetKey: 'id',
        autoLoad: false,
    }),
    
    // Meter has many Status Logs
    statusLogs: relationship({
        type: RelationshipTypes.HAS_MANY,
        model: 'MeterStatusLog',
        foreignKey: 'meter_id',
        autoLoad: false,
    }),
},
```

### Example: Device with Relationships

```javascript
relationships: {
    // Device has many Meters
    meters: relationship({
        type: RelationshipTypes.HAS_MANY,
        model: 'Meter',
        foreignKey: 'device_id',
        targetKey: 'id',
        autoLoad: false,
    }),
},
```

### Example: Location with Relationships

```javascript
relationships: {
    // Location has many Meters
    meters: relationship({
        type: RelationshipTypes.HAS_MANY,
        model: 'Meter',
        foreignKey: 'location_id',
        autoLoad: false,
    }),
},
```

## 📋 Recommended Relationships by Model

### Contact
```javascript
relationships: {
    // No direct relationships in current schema
    // Could add: tenant, createdByUser, updatedByUser
},
```

### Device
```javascript
relationships: {
    meters: relationship({
        type: RelationshipTypes.HAS_MANY,
        model: 'Meter',
        foreignKey: 'device_id',
    }),
    tenant: relationship({
        type: RelationshipTypes.BELONGS_TO,
        model: 'Tenant',
        foreignKey: 'tenant_id',
    }),
},
```

### Location
```javascript
relationships: {
    meters: relationship({
        type: RelationshipTypes.HAS_MANY,
        model: 'Meter',
        foreignKey: 'location_id',
    }),
    tenant: relationship({
        type: RelationshipTypes.BELONGS_TO,
        model: 'Tenant',
        foreignKey: 'tenant_id',
    }),
},
```

### Meter
```javascript
relationships: {
    device: relationship({
        type: RelationshipTypes.BELONGS_TO,
        model: 'Device',
        foreignKey: 'device_id',
    }),
    location: relationship({
        type: RelationshipTypes.BELONGS_TO,
        model: 'Location',
        foreignKey: 'location_id',
    }),
    readings: relationship({
        type: RelationshipTypes.HAS_MANY,
        model: 'MeterReadings',
        foreignKey: 'meter_id',
    }),
    statusLogs: relationship({
        type: RelationshipTypes.HAS_MANY,
        model: 'MeterStatusLog',
        foreignKey: 'meter_id',
    }),
    maintenanceRecords: relationship({
        type: RelationshipTypes.HAS_MANY,
        model: 'MeterMaintenance',
        foreignKey: 'meter_id',
    }),
    triggers: relationship({
        type: RelationshipTypes.HAS_MANY,
        model: 'MeterTriggers',
        foreignKey: 'meter_id',
    }),
    usageAlerts: relationship({
        type: RelationshipTypes.HAS_MANY,
        model: 'MeterUsageAlerts',
        foreignKey: 'meter_id',
    }),
    monitoringAlerts: relationship({
        type: RelationshipTypes.HAS_MANY,
        model: 'MeterMonitoringAlerts',
        foreignKey: 'meter_id',
    }),
},
```

### MeterReadings
```javascript
relationships: {
    meter: relationship({
        type: RelationshipTypes.BELONGS_TO,
        model: 'Meter',
        foreignKey: 'meter_id',
    }),
},
```

### Users
```javascript
relationships: {
    tenant: relationship({
        type: RelationshipTypes.BELONGS_TO,
        model: 'Tenant',
        foreignKey: 'tenant_id',
    }),
},
```

### Tenant
```javascript
relationships: {
    users: relationship({
        type: RelationshipTypes.HAS_MANY,
        model: 'Users',
        foreignKey: 'tenant_id',
    }),
    meters: relationship({
        type: RelationshipTypes.HAS_MANY,
        model: 'Meter',
        foreignKey: 'tenant_id',
    }),
    devices: relationship({
        type: RelationshipTypes.HAS_MANY,
        model: 'Device',
        foreignKey: 'tenant_id',
    }),
    locations: relationship({
        type: RelationshipTypes.HAS_MANY,
        model: 'Location',
        foreignKey: 'tenant_id',
    }),
},
```

## 🚀 Step-by-Step Migration

### Step 1: Review Generated Models

```bash
# Check generated models
ls generated/models/

# Review a specific model
code generated/models/MeterWithSchema.js
```

### Step 2: Add Relationships

For each model, add appropriate relationships in the `relationships` section.

**Example for Meter:**

```javascript
// In generated/models/MeterWithSchema.js
relationships: {
    device: relationship({
        type: RelationshipTypes.BELONGS_TO,
        model: 'Device',
        foreignKey: 'device_id',
        autoLoad: false,
    }),
    location: relationship({
        type: RelationshipTypes.BELONGS_TO,
        model: 'Location',
        foreignKey: 'location_id',
        autoLoad: false,
    }),
    readings: relationship({
        type: RelationshipTypes.HAS_MANY,
        model: 'MeterReadings',
        foreignKey: 'meter_id',
        autoLoad: false,
    }),
},
```

### Step 3: Copy Models to Project

```bash
# Copy all models
cp generated/models/*WithSchema.js client/backend/src/models/

# Or copy individually
cp generated/models/DeviceWithSchema.js client/backend/src/models/
cp generated/models/LocationWithSchema.js client/backend/src/models/
cp generated/models/MeterWithSchema.js client/backend/src/models/
```

### Step 4: Update Schema Routes

Add all models to `client/backend/src/routes/schema.js`:

```javascript
const models = {
  contact: require('../models/ContactWithSchema'),
  device: require('../models/DeviceWithSchema'),
  email_logs: require('../models/EmailLogsWithSchema'),
  email_templates: require('../models/EmailTemplatesWithSchema'),
  location: require('../models/LocationWithSchema'),
  meter: require('../models/MeterWithSchema'),
  meter_maintenance: require('../models/MeterMaintenanceWithSchema'),
  meter_maps: require('../models/MeterMapsWithSchema'),
  meter_monitoring_alerts: require('../models/MeterMonitoringAlertsWithSchema'),
  meter_readings: require('../models/MeterReadingsWithSchema'),
  meter_status_log: require('../models/MeterStatusLogWithSchema'),
  meter_triggers: require('../models/MeterTriggersWithSchema'),
  meter_usage_alerts: require('../models/MeterUsageAlertsWithSchema'),
  notification_logs: require('../models/NotificationLogsWithSchema'),
  tenant: require('../models/TenantWithSchema'),
  users: require('../models/UsersWithSchema'),
};
```

### Step 5: Test Each Model

```bash
# Test schema API for each model
curl http://localhost:3001/api/schema/device
curl http://localhost:3001/api/schema/location
curl http://localhost:3001/api/schema/meter
```

### Step 6: Update Frontend

For each entity, update the frontend to use dynamic schemas:

```typescript
// Example: DeviceForm.tsx
import { useSchema } from '@framework/forms/utils/schemaLoader';

export const DeviceForm = ({ device, onSubmit }) => {
  const { schema, loading, error } = useSchema('device');
  
  // Form renders dynamically from schema
};
```

## 📊 Benefits Summary

### Before Migration
- ❌ Fields defined in 2 places (backend + frontend)
- ❌ Manual field listing in constructors
- ❌ No relationship definitions
- ❌ Duplicate validation logic
- ❌ Hard to maintain

### After Migration
- ✅ Fields defined once in schema
- ✅ Auto-initialization from schema
- ✅ Relationships defined and documented
- ✅ Shared validation logic
- ✅ Easy to maintain
- ✅ Frontend fetches schema via API
- ✅ Single source of truth

## 🎯 Quick Reference

### Field Types
```javascript
FieldTypes.STRING
FieldTypes.NUMBER
FieldTypes.BOOLEAN
FieldTypes.DATE
FieldTypes.EMAIL
FieldTypes.PHONE
FieldTypes.URL
FieldTypes.OBJECT
FieldTypes.ARRAY
```

### Relationship Types
```javascript
RelationshipTypes.BELONGS_TO    // Many-to-one
RelationshipTypes.HAS_MANY      // One-to-many
RelationshipTypes.HAS_ONE       // One-to-one
RelationshipTypes.MANY_TO_MANY  // Many-to-many
```

### Auto-Load Relationships
```javascript
// Set autoLoad: true to automatically load related data
device: relationship({
    type: RelationshipTypes.BELONGS_TO,
    model: 'Device',
    foreignKey: 'device_id',
    autoLoad: true,  // ← Automatically loads device data
    select: ['id', 'manufacturer', 'model_number'], // Only these fields
}),
```

## 🔧 Troubleshooting

### Model Not Found
```
Error: Schema not found for entity: device
```
**Solution:** Make sure model is registered in `schema.js`

### Circular Dependencies
```
Error: Circular dependency detected
```
**Solution:** Use lazy loading for relationships:
```javascript
autoLoad: false  // Load manually when needed
```

### Field Not Populating
```
contact.name is undefined
```
**Solution:** Check `dbField` mapping in schema:
```javascript
name: field({
    dbField: 'name',  // Must match database column
}),
```

## ✨ Success!

You now have:
- ✅ 16 models with schema definitions
- ✅ Auto-initialization from schema
- ✅ Relationship support
- ✅ Single source of truth
- ✅ API endpoints for all schemas
- ✅ Ready for frontend integration

**Next:** Add relationships and start using the schemas!
