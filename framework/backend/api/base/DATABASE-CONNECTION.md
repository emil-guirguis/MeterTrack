# Database Connection Integration

This document explains how BaseModel integrates with the PostgreSQL database connection and how to use database features in your models.

## Overview

BaseModel automatically manages database connections for all CRUD operations. It uses the PostgreSQL connection pool from `client/backend/src/config/database.js` to execute queries efficiently.

## Automatic Connection Management

All built-in CRUD methods automatically use the database connection:

```javascript
// These methods automatically handle database connections
const meter = await Meter.create({ name: 'New Meter' });
const meters = await Meter.findAll();
const meter = await Meter.findById(5);
await meter.update({ name: 'Updated' });
await meter.delete();
```

## Custom Queries with getDb()

For custom queries in your model classes, use the `getDb()` static method:

```javascript
class Meter extends BaseModel {
  // ... constructor and configuration ...

  // Custom static method with database query
  static async getStats() {
    const db = this.getDb();
    const query = `
      SELECT
        COUNT(*) as total_meters,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_meters
      FROM ${this.tableName}
    `;
    const result = await db.query(query);
    return result.rows[0];
  }

  // Custom method with parameters
  static async findByStatus(status) {
    const db = this.getDb();
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE status = $1
      ORDER BY created_at DESC
    `;
    const result = await db.query(query, [status]);
    return result.rows.map(row => new this(row));
  }
}

// Usage
const stats = await Meter.getStats();
const activeMeters = await Meter.findByStatus('active');
```

## Transaction Support

Use the `transaction()` method to execute multiple operations atomically:

```javascript
// Transfer operation with transaction
await Meter.transaction(async (client) => {
  // All queries within this callback use the same transaction
  await client.query(
    'UPDATE meter SET status = $1 WHERE id = $2',
    ['inactive', 1]
  );
  await client.query(
    'UPDATE meter SET status = $1 WHERE id = $2',
    ['active', 2]
  );
  // If any query fails, all changes are rolled back
});
```

### Creating Related Records in a Transaction

```javascript
// Create device and meters together
const result = await Device.transaction(async (client) => {
  // Create device
  const deviceResult = await client.query(
    'INSERT INTO device (name, manufacturer) VALUES ($1, $2) RETURNING *',
    ['New Device', 'Acme Corp']
  );
  const device = deviceResult.rows[0];

  // Create meters for the device
  await client.query(
    'INSERT INTO meter (device_id, name, type) VALUES ($1, $2, $3)',
    [device.id, 'Meter 1', 'electric']
  );
  await client.query(
    'INSERT INTO meter (device_id, name, type) VALUES ($1, $2, $3)',
    [device.id, 'Meter 2', 'gas']
  );

  return device;
});
```

### Transaction Error Handling

Transactions automatically roll back on errors:

```javascript
try {
  await Meter.transaction(async (client) => {
    await client.query('UPDATE meter SET status = $1 WHERE id = $2', ['active', 1]);
    // This will fail and trigger rollback
    await client.query('UPDATE meter SET invalid_column = $1 WHERE id = $2', ['value', 2]);
  });
} catch (error) {
  // Transaction was rolled back
  console.error('Transaction failed:', error.message);
}
```

## Connection Error Handling

BaseModel automatically handles connection errors gracefully:

```javascript
try {
  const meters = await Meter.findAll();
} catch (error) {
  if (error.name === 'ConnectionError') {
    console.error('Database connection failed:', error.message);
    // Handle connection error (retry, show user message, etc.)
  }
}
```

### Connection Error Types

The following connection errors are automatically detected and handled:

- **ECONNREFUSED**: Database server is not running
- **ENOTFOUND**: Database host not found
- **ETIMEDOUT**: Connection timeout
- **ECONNRESET**: Connection was reset
- **PostgreSQL 08000**: Connection exception
- **PostgreSQL 08003**: Connection does not exist
- **PostgreSQL 08006**: Connection failure

All connection errors are converted to `ConnectionError` with descriptive messages.

## Database Connection Pool

The database connection uses a connection pool with the following configuration:

- **Max connections**: 20
- **Idle timeout**: 30 seconds
- **Connection timeout**: 10 seconds

The pool automatically manages connections, so you don't need to worry about opening or closing connections.

## Best Practices

### 1. Use Built-in Methods When Possible

Prefer built-in CRUD methods over custom queries:

```javascript
// Good - uses built-in method
const meters = await Meter.findAll({ where: { status: 'active' } });

// Avoid - custom query for simple operations
const db = Meter.getDb();
const result = await db.query('SELECT * FROM meter WHERE status = $1', ['active']);
```

### 2. Always Use Parameterized Queries

Never concatenate user input into SQL queries:

```javascript
// Good - parameterized query
const result = await db.query(
  'SELECT * FROM meter WHERE status = $1',
  [userInput]
);

// BAD - SQL injection vulnerability
const result = await db.query(
  `SELECT * FROM meter WHERE status = '${userInput}'`
);
```

### 3. Use Transactions for Related Operations

When multiple operations must succeed or fail together, use transactions:

```javascript
// Good - atomic operation
await Device.transaction(async (client) => {
  await client.query('DELETE FROM meter WHERE device_id = $1', [deviceId]);
  await client.query('DELETE FROM device WHERE id = $1', [deviceId]);
});

// Avoid - non-atomic operations
await db.query('DELETE FROM meter WHERE device_id = $1', [deviceId]);
await db.query('DELETE FROM device WHERE id = $1', [deviceId]);
// If second query fails, meters are deleted but device remains
```

### 4. Handle Connection Errors

Always handle potential connection errors in production code:

```javascript
try {
  const meters = await Meter.findAll();
  return meters;
} catch (error) {
  if (error.name === 'ConnectionError') {
    // Log error and return graceful response
    logger.error('Database connection failed', error);
    return { error: 'Service temporarily unavailable' };
  }
  throw error;
}
```

## Database Connection API Reference

### getDb()

Returns the database connection instance.

**Returns:** `Object` - Database connection with `query()` and `transaction()` methods

**Example:**
```javascript
const db = Meter.getDb();
const result = await db.query('SELECT COUNT(*) FROM meter');
```

### transaction(callback)

Executes a function within a database transaction.

**Parameters:**
- `callback` (Function): Async function that receives a database client

**Returns:** `Promise<*>` - Result from the callback function

**Throws:** `ConnectionError` if transaction fails

**Example:**
```javascript
const result = await Meter.transaction(async (client) => {
  const res = await client.query('INSERT INTO meter (name) VALUES ($1) RETURNING *', ['New Meter']);
  return res.rows[0];
});
```

## Troubleshooting

### "Database not connected" Error

If you see this error, ensure the database connection is initialized before using models:

```javascript
// In your server startup
const db = require('./config/database');
await db.connect();

// Now you can use models
const meters = await Meter.findAll();
```

### Connection Pool Exhausted

If you see connection pool errors, check for:
- Unreleased database clients
- Long-running queries blocking connections
- Too many concurrent requests

Monitor pool status:
```javascript
const db = require('./config/database');
const status = db.getStatus();
console.log('Pool status:', status);
```

### Transaction Deadlocks

If transactions are timing out or deadlocking:
- Keep transactions short
- Always access tables in the same order
- Use appropriate isolation levels
- Add proper indexes to reduce lock contention
