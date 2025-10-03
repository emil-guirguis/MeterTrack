// Copy users from facility-management database to meterdb
// Connection: mongodb+srv://emil_user:db2424@cluster0.tveleqd.mongodb.net/

print("Copying users from facility-management to meterdb...");

// First, get users from facility-management database
use('facility-management');
const users = db.users.find({}).toArray();

print("Found " + users.length + " users in facility-management database");

// Switch to meterdb and insert users
use('meterdb');

// Drop existing users collection if it exists
db.users.drop();

// Insert users into meterdb
if (users.length > 0) {
    db.users.insertMany(users);
    
    // Create indexes for users collection
    db.users.createIndex({ email: 1 }, { unique: true });
    db.users.createIndex({ role: 1 });
    db.users.createIndex({ status: 1 });
    
    print("Successfully copied " + users.length + " users to meterdb");
    print("");
    print("Users available in meterdb:");
    db.users.find({}, { email: 1, name: 1, role: 1, permissions: 1 }).forEach(function(user) {
        print("- " + user.email + " (" + user.role + ") - Permissions: " + user.permissions.length);
    });
} else {
    print("No users found to copy");
}

print("");
print("=== USER COPY COMPLETE ===");
print("Users are now available in meterdb for authentication");