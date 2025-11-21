# Database Schema to Code Generator Tool

## 🎯 Overview

I've created a comprehensive tool that reads your PostgreSQL database schema and automatically generates:
1. **Backend Model** (BaseModel-compatible JavaScript class)
2. **Frontend Schema** (defineEntitySchema TypeScript configuration)
3. **Summary Report** (Next steps and column details)

This eliminates manual synchronization errors and ensures your backend and frontend stay in sync with your database.

## 📦 What Was Created

### Core Tool
- **`scripts/schema-generator.js`** - Main generator script (400+ lines)

### Documentation
- **`scripts/README-SCHEMA-GENERATOR.md`** - Complete documentation
- **`scripts/QUICK-START-SCHEMA-GENERATOR.md`** - Quick reference guide

### Helper Scripts
- **`scripts/generate-schema.bat`** - Windows batch launcher
- **`scripts/generate-schema.ps1`** - PowerShell launcher with colors

### Generated Output (Example)
- **`generated/Meter.js`** - Backend model for meter table
- **`generated/meterConfig.ts`** - Frontend schema for meter table
- **`generated/meter_schema_summary.txt`** - Summary and next steps

## 🚀 Quick Start

### Basic Usage

```bash
# Generate from any table
node scripts/schema-generator.js <table_name>

# Example: Generate meter schema
node scripts/schema-generator.js meter
```

### Using Helper Scripts

```powershell
# PowerShell (recommended for Windows)
.\scripts\generate-schema.ps1 meter

# Batch file
scripts\generate-schema.bat meter
```

## 📋 What It Does

### 1. Queries Database Schema
```
Connects to PostgreSQL → Reads information_schema → Gets all columns
```

### 2. Generates Backend Model
```javascript
class Meter extends BaseModel {
  constructor(meterData = {}) {
    super(meterData);
    this.id = meterData.id;
    this.name = meterData.name;
    this.type = meterData.type;
    // ... all fields from database
  }
  
  static get tableName() { return 'meter'; }
  static get primaryKey() { return 'id'; }
  // ... CRUD methods inherited from BaseModel
}
```

### 3. Generates Frontend Schema
```typescript
export const meterSchema = defineEntitySchema({
  formFields: {
    name: field({ type: 'string', default: '', required: true, label: 'Name' }),
    type: field({ type: 'string', default: '', required: true, label: 'Type' }),
    // ... all editable fields
  },
  entityFields: {
    id: { type: 'number', default: 0, readOnly: true },
    createdAt: { type: 'date', default: new Date(), readOnly: true },
    // ... read-only fields
  }
});
```

## 🎨 Features

✅ **Automatic Type Mapping** - PostgreSQL → JavaScript/TypeScript types  
✅ **Smart Field Categorization** - Form fields vs entity fields  
✅ **Required Field Detection** - Based on NOT NULL constraints  
✅ **CamelCase Conversion** - snake_case → camelCase  
✅ **Label Generation** - Readable labels from column names  
✅ **Export Configuration** - CSV export setup included  
✅ **List Columns** - Basic column definitions  
✅ **Summary Report** - Next steps and metadata  

## 📊 Type Mapping

| PostgreSQL | JavaScript/TypeScript |
|------------|----------------------|
| integer, bigint, smallint | number |
| varchar, char, text | string |
| boolean | boolean |
| date, timestamp | date |
| json, jsonb | object |
| uuid, inet | string |

## 🔄 Typical Workflow

```
1. Design Database Schema
         ↓
2. Create & Run Migration
         ↓
3. Generate Code (this tool)
         ↓
4. Review Generated Files
         ↓
5. Customize as Needed
         ↓
6. Copy to Project
         ↓
7. Update Components
         ↓
8. Test
```

## 📝 Example Output

### Running the Tool

```bash
$ node scripts/schema-generator.js meter

🔍 Querying schema for table: meter

✅ Found 20 columns

=== TABLE SCHEMA ===

  id: bigint NOT NULL
  name: character varying(200) NOT NULL
  type: character varying(50) NOT NULL
  serial_number: character varying(200) NULL
  installation_date: timestamp with time zone NULL
  device_id: bigint NULL
  location_id: bigint NULL
  ip: character varying(15) NULL
  port: integer NULL
  protocol: character varying(255) NULL
  status: character varying(20) NOT NULL DEFAULT 'active'
  register_map: json NULL
  notes: text NULL
  active: boolean NULL DEFAULT true
  created_at: timestamp with time zone NOT NULL
  updated_at: timestamp with time zone NOT NULL

====================

📝 Generating backend model...
✅ Backend model saved to: generated/Meter.js

📝 Generating frontend schema...
✅ Frontend schema saved to: generated/meterConfig.ts

📄 Summary saved to: generated/meter_schema_summary.txt

✨ Generation complete!
```

## 🎯 Use Cases

### 1. New Feature Development
```bash
# Create database table via migration
npm run db:migrate

# Generate code
node scripts/schema-generator.js users

# Copy to project
cp generated/User.js client/backend/src/models/
cp generated/userConfig.ts client/frontend/src/features/users/
```

### 2. Schema Changes
```bash
# After modifying database
npm run db:migrate

# Regenerate
node scripts/schema-generator.js meter

# Compare and merge
code --diff client/backend/src/models/Meter.js generated/Meter.js
```

### 3. Sync Frontend with Backend
```bash
# Database is source of truth
node scripts/schema-generator.js meter

# Update frontend to match
cp generated/meterConfig.ts client/frontend/src/features/meters/
```

### 4. Bulk Generation
```bash
# Generate for multiple tables
node scripts/schema-generator.js users
node scripts/schema-generator.js devices
node scripts/schema-generator.js locations
node scripts/schema-generator.js meters
```

## 🔧 Customization Points

### Backend Model

After generation, you typically add:

1. **Relationships**
```javascript
static get relationships() {
  return {
    device: {
      type: 'belongsTo',
      model: 'Device',
      foreignKey: 'device_id',
      targetKey: 'id'
    },
    location: {
      type: 'belongsTo',
      model: 'Location',
      foreignKey: 'location_id',
      targetKey: 'id'
    }
  };
}
```

2. **Custom Methods**
```javascript
static async findBySerialNumber(serialNumber) {
  return this.findOne({ serial_number: serialNumber });
}

static async getActiveMeters() {
  return this.findAll({ active: true, status: 'active' });
}
```

3. **Validation**
```javascript
validate() {
  if (!this.name) throw new Error('Name is required');
  if (!this.type) throw new Error('Type is required');
  if (this.port && (this.port < 1 || this.port > 65535)) {
    throw new Error('Port must be between 1 and 65535');
  }
}
```

### Frontend Schema

After generation, you typically customize:

1. **Field Validation**
```typescript
name: field({ 
  type: 'string', 
  default: '', 
  required: true, 
  label: 'Meter Name',
  minLength: 3,
  maxLength: 100,
  pattern: /^[a-zA-Z0-9\s-]+$/
}),
```

2. **List Columns**
```typescript
{
  key: 'name',
  label: 'Meter',
  sortable: true,
  render: (value, meter) => (
    <div className="meter-cell">
      <strong>{value}</strong>
      <span className="meter-type">{meter.type}</span>
    </div>
  )
}
```

3. **Filters**
```typescript
{
  key: 'type',
  label: 'Type',
  type: 'select',
  options: [
    { label: 'Electric', value: 'electric' },
    { label: 'Gas', value: 'gas' },
    { label: 'Water', value: 'water' }
  ]
}
```

## 📚 Documentation

- **Full Documentation**: `scripts/README-SCHEMA-GENERATOR.md`
- **Quick Reference**: `scripts/QUICK-START-SCHEMA-GENERATOR.md`
- **This Summary**: `SCHEMA-GENERATOR-TOOL.md`

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Cannot find module 'pg'" | `cd client/backend && npm install` |
| "Table not found" | Check table name (case-sensitive) |
| "Connection refused" | Verify .env database credentials |
| Wrong types | Check PG_TO_JS_TYPE mapping in script |
| Missing columns | Verify database connection and permissions |

## ⚙️ Configuration

The tool uses your `.env` file:

```env
POSTGRES_HOST=your-host
POSTGRES_PORT=5432
POSTGRES_DB=your-database
POSTGRES_USER=your-user
POSTGRES_PASSWORD=your-password
```

## 🎁 Benefits

1. **Eliminates Manual Errors** - No more typos or missed fields
2. **Saves Time** - Generate in seconds vs hours of manual coding
3. **Ensures Consistency** - Backend and frontend always match database
4. **Easy Updates** - Regenerate after schema changes
5. **Type Safety** - Proper TypeScript types generated
6. **Documentation** - Summary file documents the schema
7. **Customizable** - Generated code is a starting point

## 🔮 Future Enhancements

Potential improvements:
- Auto-detect relationships from foreign keys
- Generate API routes
- Generate test files
- Support for enums
- Interactive mode
- Diff and merge tool
- Generate migrations from model changes

## 📞 Support

For help:
1. Check `scripts/QUICK-START-SCHEMA-GENERATOR.md`
2. Review `scripts/README-SCHEMA-GENERATOR.md`
3. Check generated summary file
4. Verify database connection

## ✅ Success!

You now have a powerful tool to keep your database, backend, and frontend in perfect sync. Just run it whenever your schema changes!

```bash
# That's it!
node scripts/schema-generator.js <table_name>
```
