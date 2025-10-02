const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const userSchema = new mongoose.Schema({
  email: String,
  name: String,
  password: String,
  role: String,
  permissions: [String],
  status: String,
  lastLogin: Date
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);

async function fixUserPasswords() {
  try {
    console.log('🔧 Fixing user passwords...');

    // Hash the correct passwords
    const adminPassword = await bcrypt.hash('admin123', 12);
    const managerPassword = await bcrypt.hash('manager123', 12);
    const techPassword = await bcrypt.hash('tech123', 12);

    // Update users with properly hashed passwords
    await User.updateOne(
      { email: 'admin@example.com' },
      { password: adminPassword }
    );

    await User.updateOne(
      { email: 'manager@example.com' },
      { password: managerPassword }
    );

    await User.updateOne(
      { email: 'tech@example.com' },
      { password: techPassword }
    );

    console.log('✅ User passwords updated successfully!');
    console.log('');
    console.log('Login credentials:');
    console.log('- Admin: admin@example.com / admin123');
    console.log('- Manager: manager@example.com / manager123');
    console.log('- Technician: tech@example.com / tech123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing passwords:', error);
    process.exit(1);
  }
}

fixUserPasswords();