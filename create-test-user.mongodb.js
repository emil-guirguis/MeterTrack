// Create a test user in facility-management database
// Connection: mongodb+srv://emil_user:db2424@cluster0.tveleqd.mongodb.net/

use('facility-management');

print("Creating test user...");

// Create a test admin user
db.users.insertOne({
  _id: ObjectId(),
  email: 'admin@example.com',
  name: 'Test Administrator',
  password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3QJgusgqSu', // password: admin123
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
});

// Create index
db.users.createIndex({ email: 1 }, { unique: true });

print("✅ Test user created successfully!");
print("Login credentials:");
print("- Email: admin@example.com");
print("- Password: admin123");

// Verify user was created
const userCount = db.users.countDocuments();
print("Total users in database: " + userCount);