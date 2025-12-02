# Schema System Migration Spec

## Overview

This spec defines the complete migration of the MeterItPro application from duplicate schema definitions to a single-source-of-truth schema system.

## Problem Statement

Currently, entity schemas are defined in two places:
1. **Backend**: Model constructors with manual field assignments
2. **Frontend**: Config files with field definitions

This leads to:
- ❌ Duplicate code
- ❌ Sync issues
- ❌ Maintenance burden
- ❌ Potential bugs

## Solution

Define schemas **once** in the backend, expose via API, frontend fetches dynamically.

## Benefits

- ✅ Single source of truth
- ✅ No duplication
- ✅ Automatic sync
- ✅ Less code
- ✅ Fewer bugs
- ✅ Easier maintenance

## Scope

### Entities to Migrate (16 total)

1. Contact (17 fields)
2. Device (10 fields)
3. EmailLogs (13 fields)
4. EmailTemplates (13 fields)
5. Location (16 fields)
6. Meter (20 fields)
7. MeterMaintenance (1 field)
8. MeterMaps (7 fields)
9. MeterMonitoringAlerts (8 fields)
10. MeterReadings (119 fields)
11. MeterStatusLog (6 fields)
12. MeterTriggers (12 fields)
13. MeterUsageAlerts (8 fields)
14. NotificationLogs (13 fields)
15. Tenant (13 fields)
16. Users (46 fields)

### Components

**Backend:**
- SchemaDefinition.js framework
- Model classes with schemas
- Schema API routes
- Relationship support

**Frontend:**
- Schema loader utility
- Dynamic form components
- Schema caching
- Type conversion

**Tools:**
- Migration tool (auto-generate models)
- Testing framework
- Documentation

## Documents

- **[requirements.md](./requirements.md)** - Complete requirements with acceptance criteria
- **[design.md](./design.md)** - Architecture, components, data models, correctness properties
- **[tasks.md](./tasks.md)** - Step-by-step implementation plan

## Current Status

### ✅ Completed
- SchemaDefinition.js framework
- Auto-initialization support
- Relationship types
- Schema API routes
- Frontend schema loader
- Migration tool
- Contact model migrated
- Meter model migrated
- All 16 models generated

### ⏳ In Progress
- Adding relationships to models
- Creating dynamic forms
- Testing migrations

### 📋 Remaining
- Migrate remaining 14 models
- Update all API routes
- Update all frontend components
- Implement relationship loading
- Comprehensive testing
- Documentation
- Deployment

## Key Features

### 1. Single Source Schema Definition

```javascript
class Meter extends BaseModel {
  constructor(data = {}) {
    super(data);
    Meter.schema.initializeFromData(this, data);
  }
  
  static get schema() {
    return defineSchema({
      entityName: 'Meter',
      formFields: { /* defined once */ },
      entityFields: { /* defined once */ },
      relationships: { /* defined once */ },
    });
  }
}
```

### 2. Relationship Support

```javascript
relationships: {
  device: relationship({
    type: RelationshipTypes.BELONGS_TO,
    model: 'Device',
    foreignKey: 'device_id',
    autoLoad: false,
  }),
  readings: relationship({
    type: RelationshipTypes.HAS_MANY,
    model: 'MeterReadings',
    foreignKey: 'meter_id',
  }),
}
```

### 3. Schema API

```bash
GET /api/schema              # List all schemas
GET /api/schema/meter        # Get meter schema
POST /api/schema/meter/validate  # Validate data
```

### 4. Dynamic Forms

```typescript
const { schema, loading } = useSchema('meter');

// Form renders dynamically from schema
{Object.entries(schema.formFields).map(([name, field]) =>
  <Input key={name} {...field} />
)}
```

### 5. Auto-Generated Models

```bash
node scripts/migrate-all-models.js
# Generates all 16 models from database
```

## Success Criteria

- [ ] All 16 models migrated
- [ ] All relationships defined
- [ ] All API routes updated
- [ ] All frontend forms dynamic
- [ ] All tests passing
- [ ] Documentation complete
- [ ] Zero duplicate schemas
- [ ] Performance acceptable

## Timeline

- **Phase 1**: Foundation (✅ Complete)
- **Phase 2**: Model Migration (⏳ In Progress)
- **Phase 3**: Relationships (📋 Planned)
- **Phase 4**: Frontend Migration (📋 Planned)
- **Phase 5**: Testing (📋 Planned)
- **Phase 6**: Cleanup & Docs (📋 Planned)

## Getting Started

### For Developers

1. Read [requirements.md](./requirements.md)
2. Review [design.md](./design.md)
3. Follow [tasks.md](./tasks.md)

### Quick Start

```bash
# Generate all models
node scripts/migrate-all-models.js

# Review generated models
ls generated/models/

# Add relationships to a model
code generated/models/MeterWithSchema.js

# Copy to project
cp generated/models/MeterWithSchema.js client/backend/src/models/

# Register in schema routes
# Add to client/backend/src/routes/schema.js

# Test schema API
curl http://localhost:3001/api/schema/meter

# Create dynamic form
# Use useSchema('meter') hook in frontend
```

## Resources

- **Migration Tool**: `scripts/migrate-all-models.js`
- **Generated Models**: `generated/models/`
- **Schema Framework**: `framework/backend/api/base/SchemaDefinition.js`
- **Schema Loader**: `framework/frontend/forms/utils/schemaLoader.ts`
- **Example Models**: `client/backend/src/models/ContactWithSchema.js`
- **Example Form**: `client/frontend/src/features/meters/MeterFormDynamic.tsx`

## Support

For questions or issues:
1. Review the spec documents
2. Check generated model examples
3. Review existing migrations (Contact, Meter)
4. Consult the design document

## License

Internal project specification
