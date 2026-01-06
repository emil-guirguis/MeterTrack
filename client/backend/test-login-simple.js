/**
 * Simple login test to debug tenant_id flow
 * Run: node test-login-simple.js
 */

require('dotenv').config();
const User = require('./src/models/UserWithSchema');
const jwt = require('jsonwebtoken');
const db = require('./src/config/database');

async function testLogin() {
  try {
    console.log('\n=== TESTING LOGIN FLOW ===\n');

    // Step 0: Connect to database
    console.log('Step 0: Connecting to database...');
    await db.connect();
    console.log('✓ Database connected');

    // Step 1: Load user
    console.log('\nStep 1: Loading user...');
    const user = await User.findByEmail('admin@example.com');
    
    if (!user) {
      console.log('❌ User not found');
      await db.disconnect();
      process.exit(1);
    }

    console.log('✓ User loaded');
    console.log(`  - ID: ${user.id}`);
    console.log(`  - Email: ${user.email}`);
    console.log(`  - tenant_id: ${user.tenant_id}`);
    console.log(`  - tenant_id type: ${typeof user.tenant_id}`);

    // Step 2: Generate token
    console.log('\nStep 2: Generating token...');
    const token = jwt.sign(
      { userId: user.id, tenant_id: user.tenant_id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    console.log('✓ Token generated');

    // Step 3: Decode token
    console.log('\nStep 3: Decoding token...');
    const decoded = jwt.decode(token);
    console.log('✓ Token decoded');
    console.log(`  - userId: ${decoded.userId}`);
    console.log(`  - tenant_id: ${decoded.tenant_id}`);
    console.log(`  - tenant_id type: ${typeof decoded.tenant_id}`);

    // Step 4: Verify token
    console.log('\nStep 4: Verifying token...');
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✓ Token verified');
    console.log(`  - userId: ${verified.userId}`);
    console.log(`  - tenant_id: ${verified.tenant_id}`);

    console.log('\n=== RESULT ===');
    if (verified.tenant_id) {
      console.log('✓ tenant_id is present in token');
    } else {
      console.log('❌ tenant_id is MISSING from token');
    }

    await db.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    try {
      await db.disconnect();
    } catch (e) {
      // ignore
    }
    process.exit(1);
  }
}

testLogin();
