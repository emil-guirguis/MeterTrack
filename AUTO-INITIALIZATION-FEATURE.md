# Auto-Initialization from Schema ✨

## Overview

The schema system now **automatically initializes** all model fields from the schema definition, eliminating the need to manually list every field in the constructor!

## The Problem (Before)

You had to define fields **twice**:

```javascript
class Contact extends BaseModel {
    constructor(contactData = {}) {
        super(contactData);
        
        // Manual field assignments (DUPLICATE!)
        this.id = contactData.id;
        this.name = contactData.name;
        this.company = contactData.company;
        this.role = contactData.role;
        this.email = contactData.email;
        this.phone = contactData.phone;
        this.street = contactData.street;
        this.street2 = contactData.street2;
        this.city = contactData.city;
        this.state = contactData.state;
        this.zip = contactData.zip;
        this.country = contactData.country;
        this.active = contactData.active;
        this.notes = contactData.notes;
        this.created_at = contactData.created_at;
        this.updated_at = contactData.updated_at;
        this.tenant_id = contactData.tenant_id;
        // ... 17 fields manually listed!
    }
    
    static get schema() {
        return defineSchema({
            formFields: {
                name: field({ ... }),
                company: field({ ... }),
                // ... same fields defined AGAIN!
            }
        });
    }
}
```

## The Solution (After)

Define fields **once** in the schema, constructor auto-initializes:

```javascript
class Contact extends BaseModel {
    constructor(contactData = {}) {
        super(contactData);
        
        // Auto-initialize all fields from schema
        // That's it! No manual field listing needed!
        Contact.schema.initializeFromData(this, contactData);
    }
    
    static get schema() {
        return defineSchema({
            formFields: {
                name: field({ type: FieldTypes.STRING, ... }),
                company: field({ type: FieldTypes.STRING, ... }),
                email: field({ type: FieldTypes.EMAIL, ... }),
                // ... all fields defined ONCE!
            },
            entityFields: {
                id: field({ type: FieldTypes.NUMBER, ... }),
                createdAt: field({ type: FieldTypes.DATE, ... }),
                // ... system fields
            }
        });
    }
}
```

## How It Works

The `initializeFromData()` method:

1. **Reads all fields** from `formFields` and `entityFields` in the schema
2. **Maps database columns** to model properties (handles snake_case → camelCase)
3. **Assigns values** from the input data to the instance
4. **Handles missing fields** gracefully (undefined if not provided)

### Field Mapping

```javascript
// Schema defines:
formFields: {
    name: field({ dbField: 'name' }),
    email: field({ dbField: 'email' }),
}

entityFields: {
    createdAt: field({ dbField: 'created_at' }),  // Maps created_at → createdAt
    updatedAt: field({ dbField: 'updated_at' }),  // Maps updated_at → updatedAt
}

// Constructor receives:
const data = {
    name: 'John',
    email: 'john@example.com',
    created_at: '2024-01-01',  // Snake case from database
    updated_at: '2024-01-02',
};

// Instance gets:
contact.name = 'John'
contact.email = 'john@example.com'
contact.createdAt = '2024-01-01'  // Camel case in model
contact.updatedAt = '2024-01-02'
```

## Benefits

✅ **No Duplication** - Fields defined once in schema  
✅ **Less Code** - 17 lines → 1 line in constructor  
✅ **Fewer Errors** - Can't forget to add a field  
✅ **Easier Maintenance** - Add field to schema, done!  
✅ **Automatic Mapping** - Handles database column names  
✅ **Type Safe** - Schema defines types  

## Comparison

| Aspect | Manual (Before) | Auto (After) |
|--------|----------------|--------------|
| **Constructor Lines** | 17+ lines | 1 line |
| **Field Definitions** | 2 places | 1 place |
| **Maintenance** | Update 2 places | Update 1 place |
| **Error Prone** | Yes (easy to forget) | No (automatic) |
| **Database Mapping** | Manual | Automatic |

## Code Generation Helper

The schema can also generate the constructor code for you:

```javascript
const schema = Contact.schema;
console.log(schema.getConstructorCode('Contact', 'contactData'));
```

**Output:**
```javascript
constructor(contactData = {}) {
    super(contactData);
    
    this.name = contactData.name;
    this.company = contactData.company;
    this.role = contactData.role;
    this.email = contactData.email;
    this.phone = contactData.phone;
    // ... all fields
}
```

This is useful if you ever need to see what the manual version would look like.

## Migration Guide

### Step 1: Ensure Schema is Defined

Make sure your model has a complete schema definition:

```javascript
static get schema() {
    return defineSchema({
        formFields: {
            // All user-editable fields
        },
        entityFields: {
            // All system/read-only fields
        }
    });
}
```

### Step 2: Replace Constructor

**Before:**
```javascript
constructor(data = {}) {
    super(data);
    this.id = data.id;
    this.name = data.name;
    // ... 15 more lines
}
```

**After:**
```javascript
constructor(data = {}) {
    super(data);
    Contact.schema.initializeFromData(this, data);
}
```

### Step 3: Test

Create an instance and verify all fields are populated:

```javascript
const contact = new Contact({
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    // ... more data
});

console.log(contact.id);    // 1
console.log(contact.name);  // 'John Doe'
console.log(contact.email); // 'john@example.com'
```

## Examples

### Contact Model

```javascript
class Contact extends BaseModel {
    constructor(contactData = {}) {
        super(contactData);
        Contact.schema.initializeFromData(this, contactData);
    }
    
    static get schema() {
        return defineSchema({
            entityName: 'Contact',
            tableName: 'contact',
            formFields: {
                name: field({ type: FieldTypes.STRING, required: true }),
                email: field({ type: FieldTypes.EMAIL, required: true }),
                phone: field({ type: FieldTypes.PHONE }),
                // ... 9 more fields
            },
            entityFields: {
                id: field({ type: FieldTypes.NUMBER, readOnly: true }),
                createdAt: field({ type: FieldTypes.DATE, readOnly: true }),
                // ... 6 more fields
            }
        });
    }
}
```

### Meter Model

```javascript
class Meter extends BaseModel {
    constructor(meterData = {}) {
        super(meterData);
        Meter.schema.initializeFromData(this, meterData);
    }
    
    static get schema() {
        return defineSchema({
            entityName: 'Meter',
            tableName: 'meter',
            formFields: {
                meterId: field({ type: FieldTypes.STRING, required: true }),
                serialNumber: field({ type: FieldTypes.STRING, required: true }),
                // ... 10 more fields
            },
            entityFields: {
                id: field({ type: FieldTypes.NUMBER, readOnly: true }),
                status: field({ type: FieldTypes.STRING, enumValues: ['active', 'inactive'] }),
                // ... 12 more fields
            }
        });
    }
}
```

## Technical Details

### Implementation

The `initializeFromData()` method in `SchemaDefinition.js`:

```javascript
function initializeFromData(instance, data) {
    // Initialize form fields
    Object.entries(schema.formFields).forEach(([fieldName, fieldDef]) => {
        const dbField = fieldDef.dbField || fieldName;
        instance[fieldName] = data[dbField] !== undefined ? data[dbField] : data[fieldName];
    });

    // Initialize entity fields
    Object.entries(schema.entityFields).forEach(([fieldName, fieldDef]) => {
        const dbField = fieldDef.dbField || fieldName;
        instance[fieldName] = data[dbField] !== undefined ? data[dbField] : data[fieldName];
    });

    return instance;
}
```

### Field Resolution Order

1. Check if data has the database field name (e.g., `created_at`)
2. If not, check if data has the model field name (e.g., `createdAt`)
3. If neither, field remains undefined

This allows the model to work with both:
- Database results (snake_case)
- API requests (camelCase)

## Success! 🎉

You now have **zero duplication** in your model definitions:

- ✅ Fields defined once in schema
- ✅ Constructor auto-initializes from schema
- ✅ Database mapping handled automatically
- ✅ Less code to maintain
- ✅ Fewer bugs

**Define once, use everywhere!**
