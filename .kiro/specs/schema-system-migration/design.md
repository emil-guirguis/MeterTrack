# Design Document: Schema System Migration

## Overview

This design outlines the complete migration of the MeterItPro application to a single-source-of-truth schema system. The system eliminates duplicate schema definitions by defining schemas once in the backend and exposing them to the frontend via API endpoints.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         DATABASE                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │  meter   │  │  device  │  │ location │  │  contact │  ...   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js/Express)                     │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              SchemaDefinition.js (Framework)                │ │
│  │  - defineSchema()                                           │ │
│  │  - field()                                                  │ │
│  │  - relationship()                                           │ │
│  │  - FieldTypes, RelationshipTypes                           │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              ↓                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    Models (Single Source)                   │ │
│  │  MeterWithSchema.js    DeviceWithSchema.js                 │ │
│  │  LocationWithSchema.js ContactWithSchema.js                │ │
│  │  ... (16 models total)                                     │ │
│  │                                                             │ │
│  │  Each model:                                               │ │
│  │  - Defines schema once                                     │ │
│  │  - Auto-initializes fields                                 │ │
│  │  - Defines relationships                                   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              ↓                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                   Schema API Routes                         │ │
│  │  GET  /api/schema              → List all schemas          │ │
│  │  GET  /api/schema/:entity      → Get specific schema       │ │
│  │  POST /api/schema/:entity/validate → Validate data         │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ↓ HTTP/JSON
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React/TypeScript)                   │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              schemaLoader.ts (Framework)                    │ │
│  │  - fetchSchema()                                            │ │
│  │  - useSchema() hook                                         │ │
│  │  - Schema caching                                           │ │
│  │  - Type conversion                                          │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              ↓                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                   Dynamic Forms                             │ │
│  │  MeterFormDynamic.tsx   DeviceFormDynamic.tsx              │ │
│  │  LocationFormDynamic.tsx ContactFormDynamic.tsx            │ │
│  │                                                             │ │
│  │  Each form:                                                │ │
│  │  - Fetches schema from API                                 │ │
│  │  - Renders fields dynamically                              │ │
│  │  - Applies validation from schema                          │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. SchemaDefinition.js (Backend Framework)

**Purpose:** Core framework for defining entity schemas

**Interface:**
```javascript
// Field definition
function field(config: {
  type: FieldType,
  default: any,
  required?: boolean,
  readOnly?: boolean,
  label?: string,
  description?: string,
  placeholder?: string,
  dbField?: string,
  enumValues?: string[],
  minLength?: number,
  maxLength?: number,
  min?: number,
  max?: number,
  pattern?: string,
  validate?: (value, data) => string | null,
  toApi?: (value) => any,
  fromApi?: (value) => any,
}): FieldDefinition

// Relationship definition
function relationship(config: {
  type: RelationshipType,
  model: string,
  foreignKey: string,
  targetKey?: string,
  through?: string,
  autoLoad?: boolean,
  select?: string[],
  as?: string,
}): RelationshipDefinition

// Schema definition
function defineSchema(config: {
  entityName: string,
  tableName: string,
  description?: string,
  formFields: Record<string, FieldDefinition>,
  entityFields?: Record<string, FieldDefinition>,
  relationships?: Record<string, RelationshipDefinition>,
  validation?: object,
}): SchemaObject
```

**Methods:**
- `initializeFromData(instance, data)` - Auto-populate model fields
- `toJSON()` - Serialize schema for API
- `validate(data)` - Validate data against schema
- `toDatabase(formData)` - Transform to database format
- `fromDatabase(dbData)` - Transform from database format

### 2. Model Classes (Backend)

**Purpose:** Entity models with schema definitions

**Structure:**
```javascript
class Entity extends BaseModel {
  constructor(data = {}) {
    super(data);
    Entity.schema.initializeFromData(this, data);
  }
  
  static get tableName() { return 'table_name'; }
  static get primaryKey() { return 'id'; }
  
  static get schema() {
    return defineSchema({
      entityName: 'Entity',
      tableName: 'table_name',
      formFields: { /* ... */ },
      entityFields: { /* ... */ },
      relationships: { /* ... */ },
    });
  }
}
```

### 3. Schema API Routes (Backend)

**Purpose:** Expose schemas to frontend

**Endpoints:**

```javascript
// GET /api/schema
// Returns: { success: true, data: { schemas: [...], count: N } }

// GET /api/schema/:entity
// Returns: { success: true, data: { entityName, tableName, formFields, entityFields, relationships, version } }

// POST /api/schema/:entity/validate
// Body: { field1: value1, field2: value2, ... }
// Returns: { success: true, data: { isValid: boolean, errors: {} } }
```

### 4. schemaLoader.ts (Frontend Framework)

**Purpose:** Fetch and cache schemas from backend

**Interface:**
```typescript
// Fetch schema
async function fetchSchema(
  entityName: string,
  options?: { cache?: boolean, baseUrl?: string }
): Promise<BackendSchema>

// React hook
function useSchema(entityName: string): {
  schema: ConvertedSchema | null,
  loading: boolean,
  error: Error | null,
}

// Utilities
function clearSchemaCache(entityName?: string): void
async function prefetchSchemas(entityNames: string[]): Promise<BackendSchema[]>
async function getAvailableSchemas(): Promise<SchemaInfo[]>
```

### 5. Dynamic Forms (Frontend)

**Purpose:** Render forms based on fetched schemas

**Structure:**
```typescript
export const EntityFormDynamic: React.FC<Props> = ({ entity, onSubmit }) => {
  const { schema, loading, error } = useSchema('entity');
  
  // Initialize form data from schema
  useEffect(() => {
    if (schema) {
      const formSchema = createFormSchema(schema.formFields);
      setFormData(entity ? formSchema.fromApi(entity) : formSchema.getDefaults());
    }
  }, [schema, entity]);
  
  // Render fields dynamically
  return (
    <form onSubmit={handleSubmit}>
      {Object.entries(schema.formFields).map(([fieldName, fieldDef]) =>
        renderField(fieldName, fieldDef)
      )}
    </form>
  );
};
```

### 6. Migration Tool (Script)

**Purpose:** Automated migration of existing models

**Process:**
1. Query database for all tables
2. For each table, query column schema
3. Categorize fields (form vs entity)
4. Map PostgreSQL types to FieldTypes
5. Generate model class with schema
6. Output to generated directory
7. Provide registration code for schema routes

## Data Models

### FieldDefinition
```typescript
interface FieldDefinition {
  type: 'string' | 'number' | 'boolean' | 'date' | 'email' | 'phone' | 'url' | 'object' | 'array';
  default: any;
  required: boolean;
  readOnly: boolean;
  label: string;
  description: string;
  placeholder: string;
  dbField: string | null;
  enumValues: string[] | null;
  minLength: number | null;
  maxLength: number | null;
  min: number | null;
  max: number | null;
  pattern: string | null;
}
```

### RelationshipDefinition
```typescript
interface RelationshipDefinition {
  type: 'belongsTo' | 'hasMany' | 'hasOne' | 'manyToMany';
  model: string;
  foreignKey: string;
  targetKey: string;
  through: string | null;
  autoLoad: boolean;
  select: string[] | null;
  as: string | null;
}
```

### SchemaDefinition
```typescript
interface SchemaDefinition {
  entityName: string;
  tableName: string;
  description: string;
  formFields: Record<string, FieldDefinition>;
  entityFields: Record<string, FieldDefinition>;
  relationships: Record<string, RelationshipDefinition>;
  validation: object;
  version: string;
  generatedAt: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Schema Completeness
*For any* entity model with a schema definition, all database columns should be represented in either formFields or entityFields.
**Validates: Requirements 1.2, 1.3**

### Property 2: Field Initialization Consistency
*For any* model instance created with data, all fields defined in the schema should be initialized on the instance.
**Validates: Requirements 1.9**

### Property 3: Schema API JSON Validity
*For any* schema returned by the API, the JSON should be valid and parseable by the frontend.
**Validates: Requirements 3.7**

### Property 4: Field Type Mapping Consistency
*For any* PostgreSQL column type, the migration tool should consistently map it to the same FieldType.
**Validates: Requirements 6.6**

### Property 5: Validation Rule Application
*For any* field with validation rules in the schema, form validation should apply those exact rules.
**Validates: Requirements 5.8**

### Property 6: Database Field Mapping Round-Trip
*For any* form data transformed to database format and back, the original field names should be preserved.
**Validates: Requirements 5.10**

### Property 7: Relationship Foreign Key Validity
*For any* defined relationship, the foreign key field should exist in the model's schema.
**Validates: Requirements 7.8**

### Property 8: Schema Cache Consistency
*For any* cached schema, subsequent fetches should return the same schema until cache is cleared.
**Validates: Requirements 4.2**

### Property 9: Dynamic Form Field Completeness
*For any* schema with N formFields, the dynamic form should render exactly N input fields.
**Validates: Requirements 5.2**

### Property 10: Backward Compatibility Preservation
*For any* migrated model, the same API interface should work as before migration.
**Validates: Requirements 8.4**

## Error Handling

### Backend Errors
- **Schema Not Found**: Return 404 with list of available entities
- **Validation Failure**: Return 400 with field-specific error messages
- **Database Query Error**: Return 500 with generic error message
- **Invalid Field Type**: Throw error during schema definition
- **Circular Relationship**: Detect and prevent during relationship loading

### Frontend Errors
- **Schema Fetch Failure**: Display error message, provide retry option
- **Network Error**: Show connection error, cache last successful schema
- **Invalid Schema Format**: Log error, fallback to manual form
- **Validation Error**: Display field-specific errors inline
- **Missing Required Field**: Prevent form submission, highlight field

### Migration Tool Errors
- **Database Connection Failure**: Exit with clear error message
- **Table Not Found**: Skip table, continue with others
- **Invalid Column Type**: Use STRING as fallback, log warning
- **File Write Error**: Report error, continue with other models

## Testing Strategy

### Unit Tests
- Schema definition validation
- Field initialization from schema
- Type mapping (PostgreSQL → FieldTypes)
- Validation rule application
- Database field mapping (snake_case ↔ camelCase)
- Relationship definition validation

### Integration Tests
- Schema API endpoints (GET, POST)
- Frontend schema fetching
- Dynamic form rendering
- Form submission with schema transformation
- Relationship loading
- Cache behavior

### Property-Based Tests
- Property 1: Schema completeness check
- Property 2: Field initialization consistency
- Property 3: JSON validity
- Property 4: Type mapping consistency
- Property 5: Validation rule application
- Property 6: Round-trip field mapping
- Property 7: Foreign key validity
- Property 8: Cache consistency
- Property 9: Form field completeness
- Property 10: Backward compatibility

### End-to-End Tests
- Complete migration workflow
- Create entity via dynamic form
- Update entity via dynamic form
- Load entity with relationships
- Validate data via schema API
- Cache invalidation and refresh

## Migration Strategy

### Phase 1: Foundation (Complete)
- ✅ SchemaDefinition.js framework
- ✅ Auto-initialization support
- ✅ Relationship types
- ✅ Schema API routes
- ✅ Frontend schema loader
- ✅ Migration tool

### Phase 2: Model Migration (In Progress)
- ✅ Contact model migrated
- ✅ Meter model migrated
- ⏳ Device model (add relationships)
- ⏳ Location model (add relationships)
- ⏳ Remaining 12 models

### Phase 3: Relationship Implementation
- Add BELONGS_TO relationships
- Add HAS_MANY relationships
- Test relationship loading
- Optimize query performance

### Phase 4: Frontend Migration
- Create dynamic forms for each entity
- Replace static configs with schema fetching
- Test form rendering and validation
- Update list components

### Phase 5: Testing and Validation
- Run property-based tests
- Run integration tests
- Performance testing
- User acceptance testing

### Phase 6: Cleanup and Documentation
- Remove old model files
- Remove duplicate frontend configs
- Update all documentation
- Create training materials

## Performance Considerations

- **Schema Caching**: Cache schemas in frontend to minimize API calls
- **Lazy Loading**: Don't auto-load relationships by default
- **Selective Field Loading**: Only load specified fields from relationships
- **Batch Schema Loading**: Prefetch multiple schemas on app startup
- **Database Indexing**: Ensure foreign keys are indexed
- **API Response Size**: Minimize schema JSON size

## Security Considerations

- **Schema Access Control**: Require authentication for schema API
- **Field-Level Permissions**: Support read-only fields
- **Validation on Backend**: Always validate on backend, not just frontend
- **SQL Injection Prevention**: Use parameterized queries
- **XSS Prevention**: Sanitize field values
- **CSRF Protection**: Use CSRF tokens for form submissions
