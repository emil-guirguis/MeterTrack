const db = require('./src/config/database');
const User = require('./src/models/UserWithSchema');

async function testSpecificPassword() {
  try {
    console.log('Connecting to database...');
    await db.connect();
    
    console.log('Testing admin login with admin123...');
    const user = await User.findByEmail('admin@example.com');
    
    if (user) {
      console.log('User found:', user.email);
      console.log('Has password hash:', !!user.passwordHash);
      console.log('Password hash length:', user.passwordHash?.length || 0);
      
      const isValid = await user.comparePassword('admin123');
      console.log('Password "admin123" is valid:', isValid);
      
      if (isValid) {
        console.log('✅ SUCCESS! Authentication should work now.');
      } else {
        console.log('❌ Still failing. Let me try other common passwords...');
        
        const otherPasswords = ['password', 'admin', '123456', 'test123', 'admin@example.com'];
        for (const pwd of otherPasswords) {
          const result = await user.comparePassword(pwd);
          console.log(`  "${pwd}": ${result ? '✅ VALID' : '❌ Invalid'}`);
          if (result) break;
        }
      }
    } else {
      console.log('❌ User not found');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await db.disconnect();
    process.exit(0);
  }
}

testSpecificPassword();