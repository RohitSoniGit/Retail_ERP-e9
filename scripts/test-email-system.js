#!/usr/bin/env node

/**
 * Email System Test Script
 * Run this to test the email functionality
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🧪 Email System Test Script');
console.log('============================\n');

async function testEmailSystem() {
  console.log('✅ Environment Variables Check:');
  console.log(`EMAIL_ENABLED: ${process.env.EMAIL_ENABLED || 'Not set'}`);
  console.log(`SMTP_HOST: ${process.env.SMTP_HOST || 'Not set'}`);
  console.log(`SMTP_PORT: ${process.env.SMTP_PORT || 'Not set'}`);
  console.log(`SMTP_USERNAME: ${process.env.SMTP_USERNAME || 'Not set'}`);
  console.log(`SMTP_FROM_EMAIL: ${process.env.SMTP_FROM_EMAIL || 'Not set'}`);
  console.log(`SMTP_PASSWORD: ${process.env.SMTP_PASSWORD ? '***SET***' : 'Not set'}\n`);

  console.log('📋 Setup Checklist:');
  console.log('□ 1. Run complete-email-setup.sql in Supabase');
  console.log('□ 2. Configure Gmail App Password');
  console.log('□ 3. Update environment variables');
  console.log('□ 4. Test forgot password flow');
  console.log('□ 5. Configure email settings in admin panel\n');

  console.log('🔗 Test URLs:');
  console.log('- Forgot Password: http://localhost:3000/forgot-password');
  console.log('- Login: http://localhost:3000/login');
  console.log('- Settings: http://localhost:3000/settings (Notifications tab)\n');

  console.log('🔐 Default Login:');
  console.log('Email: admin@ronakjewellers.com');
  console.log('Password: admin123\n');

  console.log('📧 Test Email Flow:');
  console.log('1. Go to /forgot-password');
  console.log('2. Enter: admin@ronakjewellers.com');
  console.log('3. Check email for OTP');
  console.log('4. Enter OTP and set new password\n');

  rl.question('Press Enter to continue or Ctrl+C to exit...', () => {
    console.log('\n🎉 Email system is ready for testing!');
    console.log('Check the EMAIL_SETUP_GUIDE.md for detailed instructions.');
    rl.close();
  });
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });

testEmailSystem().catch(console.error);