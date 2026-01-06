const db = require('./src/config/database');
const User = require('./src/models/UserWithSchema');

async function testAuth() {
  try {
    console.log('Connecting to database...');
    await db.connect();
    
    console.log('Checking users in database...');
    const users = await User.findAll({ limit: 5 });
    console.log('Users found:', users.rows?.length || 0);
    
    if (users.rows && users.rows.length > 0) {
      users.rows.forEach((user, idx) => {
        console.log(`User ${idx + 1}:`);
        console.log('  ID:', user.id);
        console.log('  Email:', user.email);
        console.log('  Name:', user.name);
        console.log('  Role:', user.role);
        console.log('  Active:', user.active);
        console.log('  Tenant ID:', user.tenant_id);
        console.log('  Has Password Hash:', !!user.passwordHash);
        console.log('  Password Hash Length:', user.passwordHash?.length || 0);
        console.log('---');
      });
      
      // Test login with first user
      const firstUser = users.rows[0];
      console.log(`\nTesting password comparison for user: ${firstUser.email}`);
      
      // Try some common passwords
      const testPasswords = ['password', 'admin', '123456', 'test', firstUser.email];
      
      for (const testPassword of testPasswords) {
        try {
          const isValid = await firstUser.comparePassword(testPassword);
          console.log(`  Password "${testPassword}": ${isValid ? '✅ VALID' : '❌ Invalid'}`);
          if (isValid) break;
        } catch (error) {
          console.log(`  Password "${testPassword}": ❌ Error - ${error.message}`);
        }
      }
    } else {
      console.log('No users found in database');
      console.log('You may need to create a user using the bootstrap endpoint');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await db.disconnect();
    process.exit(0);
  }
}

testAuth();