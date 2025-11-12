#!/usr/bin/env node

/**
 * Password Hash Generator for SimpleIT
 * 
 * Usage:
 *   node scripts/generate-password-hash.js "YourPassword123"
 * 
 * This script generates a bcrypt hash for use in SQL migrations
 * or manual user creation.
 */

const bcrypt = require('bcrypt');

// Get password from command line argument
const password = process.argv[2];

if (!password) {
  console.error('❌ Error: Please provide a password as an argument');
  console.log('\nUsage:');
  console.log('  node scripts/generate-password-hash.js "YourPassword123"');
  console.log('\nExample:');
  console.log('  node scripts/generate-password-hash.js "SuperDev@2025!"');
  process.exit(1);
}

// Validate password strength (optional but recommended)
const isStrongPassword = (pwd) => {
  // At least 8 characters, contains uppercase, lowercase, number, and special char
  const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return strongRegex.test(pwd);
};

if (!isStrongPassword(password)) {
  console.warn('⚠️  WARNING: Weak password detected!');
  console.warn('   Recommended: 8+ chars, uppercase, lowercase, number, special character');
  console.warn('   Example: SuperDev@2025!\n');
}

// Generate bcrypt hash (salt rounds: 10)
bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error('❌ Error generating hash:', err.message);
    process.exit(1);
  }

  console.log('\n✅ Password Hash Generated Successfully!\n');
  console.log('Password:', password);
  console.log('Hash:    ', hash);
  console.log('\n📋 SQL Insert Statement:\n');
  console.log(`INSERT INTO users (username, full_name, email, password_hash, role, access_level, is_active)`);
  console.log(`VALUES (`);
  console.log(`  'your_username',`);
  console.log(`  'Full Name',`);
  console.log(`  'email@example.com',`);
  console.log(`  '${hash}',`);
  console.log(`  'super_admin'::role,`);
  console.log(`  '5'::access_level,`);
  console.log(`  true`);
  console.log(`);\n`);
  
  console.log('⚠️  Security Reminder:');
  console.log('   - Store this hash in SQL migration files only');
  console.log('   - Never commit plain-text passwords to version control');
  console.log('   - Change default passwords after first login\n');
});
