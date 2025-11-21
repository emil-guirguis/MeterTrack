# Single Source of Truth Schema System

## 🎯 Overview

This system eliminates duplicate schema definitions between backend and frontend by defining schemas **once in the backend** and exposing them via API for the frontend to consume dynamically.

## ✨ Benefits

✅ **No Duplication** - Define schema once, use everywhere  
✅ **Automatic Sync** - Frontend always uses latest schema  
✅ **Type Safety** - Full TypeScript support  
✅ **Validation** - Consistent validation rules  
✅ **Less Code** - Eliminate redundant definitions  
✅ **Single Source of Truth** - Backend is the authority  

## 📦 What Was Created

### Backend Components

1. **`framework/backend/api/base/SchemaDefinition.js`**
   - Core schema definition system
   - `defineSchema()` - Define entity schemas
   - `field()` - Define individual fields
   - Built-in validation

2. **`client/backend/src/models/MeterWithSchema.js`**
   - Example model with schema definition
   - Shows how to define schemas in models

3. **`client/backend/src/routes/schema.js`**
   - API endpoints to expose schemas
   - `GET /api/schema` - List all schemas
   - `GET /api/schema/:entity` - Get specific schema
   - `POST /api/schema/:entity/validate` - Validate data

### Frontend Components

4. **`framework/frontend/forms/utils/schemaLoader.ts`**
   - Fetches schemas from backend API
   - Converts to frontend format
   - Caching support
   - React hook: `useSchema()`

5. **`client/frontend/src/features/meters/MeterFormDynamic.tsx`**
   - Example form using dynamic schema
   - Renders fields based on schema
   - Automatic validation

## 🚀 How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│  1. Define Schema ONCE in Backend Model                      │
│     ↓                                                         │
│  2. Expose via API Endpoint (/api/schema/meter)              │
│     ↓                                                         │
│  3. Frontend Fetches Schema                                  │
│     ↓                                                         │
│  4. Frontend Renders Form Dynamically                        │
│     ↓                                                         │
│  5. Frontend Validates Using Schema Rules                    │
│     ↓                                                         │
│  6. Frontend Submits Data (transformed by schema)            │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## 📝 Usage Guide

### Step 1: Define Schema in Backend Model

```javascript
// client/backend/src/models/Meter.js
const { defineSchema, field, FieldTypes } = require('../../../../framework/backend/api/base/SchemaDefinition');

class Meter extends BaseModel {
  static get schema() {
    return defineSchema({
      entityName: 'Meter',
      tableName: 'meter',
      description: 'Meter entity for managing utility meters',
      
      formFields: {
        meterId: field({
          type: FieldTypes.STRING,
          default: '',
          required: true,
          label: 'Meter ID',
          dbField: 'name',
          minLength: 3,
          maxLength: 100,
        }),
        
        serialNumber: field({
          type: FieldTypes.STRING,
          default: '',
          required: true,
          label: 'Serial Number',
          dbField: 'serial_number',
        }),
        
        ip: field({
          type: FieldTypes.STRING,
          default: '',
          required: true,
          label: 'IP Address',
          pattern: '^(?:[0-9]{1,3}\\.){3}[0-9]{1,3}$',
        }),
        
        portNumber: field({
          type: FieldTypes.NUMBER,
          default: 502,
          required: true,
          label: 'Port Number',
          dbField: 'port',
          min: 1,
          max: 65535,
        }),
        
        type: field({
          type: FieldTypes.STRING,
          default: 'electric',
          required: true,
          label: 'Meter Type',
          enumValues: ['electric', 'gas', 'water', 'steam', 'other'],
        }),
      },
      
      entityFields: {
        id: field({
          type: FieldTypes.NUMBER,
          default: null,
          readOnly: true,
          label: 'ID',
        }),
        
        createdAt: field({
          type: FieldTypes.DATE,
          default: null,
          readOnly: true,
          label: 'Created At',
          dbField: 'created_at',
        }),
      },
    });
  }
}
```

### Step 2: Register Model in Schema Routes

```javascript
// client/backend/src/routes/schema.js
const models = {
  meter: require('../models/Meter'),
  location: require('../models/Location'),
  device: require('../models/Device'),
  // Add more models here
};
```

### Step 3: Add Schema Routes to Server

```javascript
// client/backend/src/server.js
const schemaRoutes = require('./routes/schema');
app.use('/api/schema', schemaRoutes);
```

### Step 4: Use in Frontend Component

```typescript
// client/frontend/src/features/meters/MeterForm.tsx
import { useSchema } from '@framework/forms/utils/schemaLoader';
import { createFormSchema } from '@framework/forms/utils/formSchema';

export const MeterForm: React.FC<Props> = ({ meter, onSubmit }) => {
  // Load schema from backend
  const { schema, loading, error } = useSchema('meter');
  
  const [formData, setFormData] = useState({});

  // Initialize form data when schema loads
  useEffect(() => {
    if (schema) {
      const formSchema = createFormSchema(schema.formFields);
      
      if (meter) {
        setFormData(formSchema.fromApi(meter));
      } else {
        setFormData(formSchema.getDefaults());
      }
    }
  }, [schema, meter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Transform to API format
    const formSchema = createFormSchema(schema.formFields);
    const apiData = formSchema.toApi(formData);
    
    await onSubmit(apiData);
  };

  // Render fields dynamically from schema
  return (
    <form onSubmit={handleSubmit}>
      {Object.entries(schema.formFields).map(([fieldName, fieldDef]) => (
        <div key={fieldName}>
          <label>{fieldDef.label}</label>
          <input
            type={fieldDef.type}
            value={formData[fieldName]}
            onChange={(e) => setFormData({...formData, [fieldName]: e.target.value})}
            required={fieldDef.required}
          />
        </div>
      ))}
      <button type="submit">Submit</button>
    </form>
  );
};
```

## 🔧 Field Types

```javascript
FieldTypes.STRING   // Text input
FieldTypes.NUMBER   // Number input
FieldTypes.BOOLEAN  // Checkbox
FieldTypes.DATE     // Date picker
FieldTypes.EMAIL    // Email input with validation
FieldTypes.PHONE    // Phone input
FieldTypes.URL      // URL input with validation
FieldTypes.OBJECT   // JSON object
FieldTypes.ARRAY    // Array
```

## 📋 Field Options

```javascript
field({
  type: FieldTypes.STRING,
  default: '',                    // Default value
  required: true,                 // Is required?
  readOnly: false,                // Is read-only?
  label: 'Field Label',           // Display label
  description: 'Help text',       // Help text
  placeholder: 'Enter value...',  // Placeholder
  dbField: 'database_column',     // Database column name
  enumValues: ['a', 'b', 'c'],    // Enum options
  minLength: 3,                   // Min string length
  maxLength: 100,                 // Max string length
  min: 1,                         // Min number value
  max: 100,                       // Max number value
  pattern: '^[A-Z]+$',            // Regex pattern
  validate: (value) => {...},     // Custom validation
  toApi: (value) => {...},        // Transform to API
  fromApi: (value) => {...},      // Transform from API
})
```

## 🔄 Migration Path

### Before (Duplicate Definitions)

```typescript
// Backend: client/backend/src/models/Meter.js
class Meter {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.type = data.type;
    // ... 20 more fields
  }
}

// Frontend: client/frontend/src/features/meters/meterConfig.ts
export const meterSchema = defineEntitySchema({
  formFields: {
    meterId: field({ type: 'string', default: '', required: true }),
    serialNumber: field({ type: 'string', default: '', required: true }),
    // ... 20 more fields (DUPLICATE!)
  }
});
```

### After (Single Source)

```javascript
// Backend ONLY: client/backend/src/models/Meter.js
class Meter {
  static get schema() {
    return defineSchema({
      formFields: {
        meterId: field({ type: FieldTypes.STRING, default: '', required: true }),
        serialNumber: field({ type: FieldTypes.STRING, default: '', required: true }),
        // ... 20 more fields (DEFINED ONCE!)
      }
    });
  }
}

// Frontend: Just fetch and use!
const { schema } = useSchema('meter');
```

## 🎯 API Endpoints

### GET /api/schema
List all available schemas

**Response:**
```json
{
  "success": true,
  "data": {
    "schemas": [
      {
        "entityName": "Meter",
        "tableName": "meter",
        "description": "Meter entity...",
        "endpoint": "/api/schema/meter"
      }
    ],
    "count": 1
  }
}
```

### GET /api/schema/:entity
Get schema for specific entity

**Response:**
```json
{
  "success": true,
  "data": {
    "entityName": "Meter",
    "tableName": "meter",
    "description": "Meter entity...",
    "formFields": {
      "meterId": {
        "type": "string",
        "default": "",
        "required": true,
        "label": "Meter ID",
        "minLength": 3,
        "maxLength": 100
      }
    },
    "entityFields": {...},
    "version": "1.0.0"
  }
}
```

### POST /api/schema/:entity/validate
Validate data against schema

**Request:**
```json
{
  "meterId": "M-001",
  "serialNumber": "SN123",
  "ip": "192.168.1.100",
  "portNumber": 502
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "errors": {}
  }
}
```

## 💡 Advanced Features

### Schema Caching

```typescript
// Prefetch schemas on app startup
import { prefetchSchemas } from '@framework/forms/utils/schemaLoader';

// In your app initialization
await prefetchSchemas(['meter', 'location', 'device']);
```

### Clear Cache

```typescript
import { clearSchemaCache } from '@framework/forms/utils/schemaLoader';

// Clear specific schema
clearSchemaCache('meter');

// Clear all schemas
clearSchemaCache();
```

### Custom Validation

```javascript
field({
  type: FieldTypes.STRING,
  validate: (value, allData) => {
    if (value.includes('invalid')) {
      return 'Value cannot contain "invalid"';
    }
    return null; // No error
  }
})
```

### Field Transformations

```javascript
field({
  type: FieldTypes.STRING,
  dbField: 'name',
  // Transform when sending to API
  toApi: (value) => value.toUpperCase(),
  // Transform when receiving from API
  fromApi: (value) => value.toLowerCase(),
})
```

## 🔍 Comparison

| Aspect | Old Way (Duplicate) | New Way (Single Source) |
|--------|---------------------|-------------------------|
| **Schema Location** | Backend + Frontend | Backend Only |
| **Maintenance** | Update 2 places | Update 1 place |
| **Sync Issues** | Common | Impossible |
| **Code Volume** | 2x definitions | 1x definition |
| **Type Safety** | Manual | Automatic |
| **Validation** | Duplicate logic | Shared logic |
| **API Changes** | Manual frontend update | Automatic |

## 📚 Examples

See these files for complete examples:
- Backend Model: `client/backend/src/models/MeterWithSchema.js`
- API Routes: `client/backend/src/routes/schema.js`
- Frontend Hook: `framework/frontend/forms/utils/schemaLoader.ts`
- Dynamic Form: `client/frontend/src/features/meters/MeterFormDynamic.tsx`

## 🚦 Getting Started

1. **Define schema in your model**
2. **Register model in schema routes**
3. **Add schema routes to server**
4. **Use `useSchema()` hook in frontend**
5. **Render form dynamically**

That's it! No more duplicate definitions!

## 🎉 Result

- ✅ Define schema once in backend
- ✅ Frontend fetches and uses it
- ✅ Always in sync
- ✅ Less code to maintain
- ✅ Fewer bugs
- ✅ Faster development

**Single Source of Truth = Happy Developers!** 🎊
