// Direct test using the actual auth route code
const express = require('express');
const authRouter = require('./src/routes/auth');
const db = require('./src/config/database');

async function testLogin() {
  try {
    await db.connect();
    console.log('Database connected\n');

    // Create a mock request and response
    const req = {
      body: {
        email: 'admin@example.com',
        password: 'admin123'
      }
    };

    const res = {
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        console.log('Response Status:', this.statusCode);
        console.log('Response Body:', JSON.stringify(data, null, 2));
        process.exit(0);
      }
    };

    // Manually execute the login logic
    const User = require('./src/models/UserWithSchema');
    const { email, password } = req.body;

    console.log('Finding user:', email);
    const user = await User.findByEmail(email);
    
    if (!user) {
      console.log('User not found');
      process.exit(1);
    }

    console.log('User found:', user.email);
    console.log('User status:', user.active, 'Type:', typeof user.active);
    console.log('User has passwordHash:', !!user.passwordHash);

    console.log('\nComparing password...');
    const isPasswordValid = await user.comparePassword(password);
    console.log('Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('Password invalid');
      process.exit(1);
    }

    console.log('\nChecking if user is active...');
    console.log('user.active:', user.active);
    console.log('!user.active:', !user.active);
    
    if (!user.active) {
      console.log('❌ User is inactive!');
      process.exit(1);
    }

    console.log('✅ All checks passed! Login would succeed.');
    process.exit(0);

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testLogin();
