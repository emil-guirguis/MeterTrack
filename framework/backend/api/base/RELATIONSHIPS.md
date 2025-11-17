# BaseModel Relationship Support

This document describes how to use relationship support in BaseModel to load related data from other tables.

## Overview

BaseModel supports three types of relationships:
- **belongsTo**: Foreign key is in the current table (many-to-one)
- **hasOne**: Foreign key is in the related table (one-to-one)
- **hasMany**: Foreign key is in the related table (one-to-many)

## Defining Relationships

Define relationships in your model class using the static `relationships` getter:

```javascript
class Meter extends BaseModel {
  constructor(data = {}) {
    super(data);
    this.id = data.id;
    this.meterid = data.meterid;
    this.device_id = data.device_id;
    this.location_id = data.location_id;
    
    // Include relationship properties
    this.device = data.device;
    this.location = data.location;
  }

  static get tableName() {
    return 'meter';
  }

  static get primaryKey() {
    return 'id';
  }

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
}
```

## Relationship Types

### belongsTo

Use when the foreign key is in the current table.

**Example**: A meter belongs to a device (meter has device_id)

```javascript
device: {
  type: 'belongsTo',
  model: 'Device',
  foreignKey: 'device_id',  // Column in meter table
  targetKey: 'id'            // Column in device table
}
```

**Generated SQL**:
```sql
LEFT JOIN device AS device ON meter.device_id = device.id
```

### hasOne

Use when the foreign key is in the related table (one-to-one relationship).

**Example**: A user has one profile (profile has user_id)

```javascript
profile: {
  type: 'hasOne',
  model: 'Profile',
  foreignKey: 'user_id',  // Column in profile table
  targetKey: 'id'         // Column in user table
}
```

**Generated SQL**:
```sql
LEFT JOIN profile AS profile ON user.id = profile.user_id
```

### hasMany

Use when the foreign key is in the related table (one-to-many relationship).

**Example**: A user has many posts (post has user_id)

```javascript
posts: {
  type: 'hasMany',
  model: 'Post',
  foreignKey: 'user_id',  // Column in post table
  targetKey: 'id'         // Column in user table
}
```

**Generated SQL**:
```sql
LEFT JOIN post AS posts ON user.id = posts.user_id
```

**Note**: hasMany relationships will return an array of related objects.

## Loading Relationships

### Single Relationship

Load a single relationship using the `include` option:

```javascript
// Load meter with device
const meter = await Meter.findById(1, { include: ['device'] });

console.log(meter.device);
// { id: 10, manufacturer: 'Acme', model: 'X100' }
```

### Multiple Relationships

Load multiple relationships by passing an array:

```javascript
// Load meter with device and location
const meter = await Meter.findById(1, { include: ['device', 'location'] });

console.log(meter.device);
// { id: 10, manufacturer: 'Acme', model: 'X100' }

console.log(meter.location);
// { id: 20, name: 'Building A', floor: '1' }
```

### With findOne

```javascript
const meter = await Meter.findOne(
  { meterid: 'M001' },
  { include: ['device', 'location'] }
);
```

### With findAll

```javascript
const result = await Meter.findAll({
  where: { status: 'active' },
  include: ['device', 'location'],
  limit: 10
});

// Each row will have device and location data
result.rows.forEach(meter => {
  console.log(meter.name, meter.device.manufacturer);
});
```

## Nested Relationships

Nested relationship loading (includes within includes) is planned for future implementation:

```javascript
// Future feature (not yet supported)
const meter = await Meter.findById(1, {
  include: [
    'location',
    { device: ['manufacturer'] }
  ]
});
```

## Relationship Data Structure

### belongsTo and hasOne

Returns a single object or null:

```javascript
{
  id: 1,
  meterid: 'M001',
  device_id: 10,
  device: {
    id: 10,
    manufacturer: 'Acme',
    model: 'X100'
  }
}
```

### hasMany

Returns an array of objects:

```javascript
{
  id: 1,
  username: 'john',
  posts: [
    { id: 101, title: 'First Post', user_id: 1 },
    { id: 102, title: 'Second Post', user_id: 1 }
  ]
}
```

## Null Relationships

If a relationship doesn't exist (foreign key is null or no matching record), the relationship property will be:
- `null` for belongsTo and hasOne
- `[]` (empty array) for hasMany

```javascript
{
  id: 1,
  meterid: 'M001',
  device_id: null,
  device: null  // No device associated
}
```

## Performance Considerations

### JOIN vs Separate Queries

The current implementation uses SQL JOINs to load relationships in a single query. This is efficient for belongsTo and hasOne relationships.

For hasMany relationships, JOINs can cause row duplication (one row per related record). The framework handles this by grouping results, but be aware of potential performance impacts with large datasets.

### Selective Loading

Only include relationships when needed:

```javascript
// Good - only load what you need
const meter = await Meter.findById(1, { include: ['device'] });

// Avoid - loading unnecessary data
const meter = await Meter.findById(1, { include: ['device', 'location', 'readings'] });
```

### Pagination with hasMany

When using hasMany relationships with pagination, be aware that the LIMIT applies to the joined result set, not the parent records:

```javascript
// This may return fewer than 10 parent records if they have multiple children
const result = await User.findAll({
  include: ['posts'],
  limit: 10
});
```

## Error Handling

### Undefined Relationship

If you try to include a relationship that isn't defined, an error will be thrown:

```javascript
try {
  const meter = await Meter.findById(1, { include: ['nonexistent'] });
} catch (error) {
  // Error: Relationship 'nonexistent' not defined in meter
}
```

### Invalid Relationship Configuration

Ensure all required fields are present in the relationship definition:
- `type`: 'belongsTo', 'hasOne', or 'hasMany'
- `model`: Name of the related model
- `foreignKey`: Foreign key column name
- `targetKey`: Primary key column name in related table

## Examples

### Complete Example: Meter with Device and Location

```javascript
const BaseModel = require('../../../../framework/backend/api/base/BaseModel');

class Meter extends BaseModel {
  constructor(data = {}) {
    super(data);
    this.id = data.id;
    this.meterid = data.meterid;
    this.name = data.name;
    this.device_id = data.device_id;
    this.location_id = data.location_id;
    
    // Relationship properties
    this.device = data.device;
    this.location = data.location;
  }

  static get tableName() {
    return 'meter';
  }

  static get primaryKey() {
    return 'id';
  }

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
}

// Usage
async function example() {
  // Load meter with relationships
  const meter = await Meter.findById(1, { include: ['device', 'location'] });
  
  console.log(`Meter: ${meter.name}`);
  console.log(`Device: ${meter.device.manufacturer} ${meter.device.model}`);
  console.log(`Location: ${meter.location.name}, Floor ${meter.location.floor}`);
}
```

### Example: User with Posts (hasMany)

```javascript
class User extends BaseModel {
  constructor(data = {}) {
    super(data);
    this.id = data.id;
    this.username = data.username;
    this.posts = data.posts;
  }

  static get tableName() {
    return 'user';
  }

  static get primaryKey() {
    return 'id';
  }

  static get relationships() {
    return {
      posts: {
        type: 'hasMany',
        model: 'Post',
        foreignKey: 'user_id',
        targetKey: 'id'
      }
    };
  }
}

// Usage
async function example() {
  const user = await User.findById(1, { include: ['posts'] });
  
  console.log(`User: ${user.username}`);
  console.log(`Posts: ${user.posts.length}`);
  
  user.posts.forEach(post => {
    console.log(`- ${post.title}`);
  });
}
```

## Implementation Details

### SQL Generation

The framework uses PostgreSQL's `row_to_json()` function to package related data:

```sql
SELECT meter.*, 
       row_to_json(device) AS device_data,
       row_to_json(location) AS location_data
FROM meter
LEFT JOIN device AS device ON meter.device_id = device.id
LEFT JOIN location AS location ON meter.location_id = location.id
WHERE meter.id = $1
```

### Data Mapping

The `mapJoinedResults()` function transforms the flat result set into nested objects:

1. Groups rows by primary key (handles hasMany duplicates)
2. Extracts relationship data from `*_data` columns
3. Assigns relationship data to the appropriate property
4. Returns clean objects with nested relationships

## Future Enhancements

Planned features for relationship support:

1. **Nested Includes**: Load relationships of relationships
2. **Eager Loading Optimization**: Separate queries for hasMany to avoid row duplication
3. **Relationship Filtering**: Filter related records in the JOIN
4. **Relationship Ordering**: Order related records
5. **Polymorphic Relationships**: Support for polymorphic associations
6. **Through Relationships**: Many-to-many via junction tables
