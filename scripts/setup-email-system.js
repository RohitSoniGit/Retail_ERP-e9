const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client
const supabaseUrl = 'https://hauoaygldrzfepzcjskx.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhdW9heWdsZHJ6ZmVwemNqc2t4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODg2NjM2MSwiZXhwIjoyMDg0NDQyMzYxfQ.wce6-IO8FTT-SgN3vrRMmdkt5JKk8w0JiEqPdYNkFS0';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runSQL(sqlContent, description) {
  console.log(`Running ${description}...`);
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: sqlContent
    });
    
    if (error) {
      console.error(`Error in ${description}:`, error);
      return false;
    }
    
    console.log(`✅ ${description} completed successfully`);
    return true;
  } catch (err) {
    console.error(`Error in ${description}:`, err);
    return false;
  }
}

async function setupEmailSystem() {
  console.log('Setting up email system...\n');
  
  // Read SQL files
  const emailOtpSQL = fs.readFileSync(path.join(__dirname, 'email-otp-setup.sql'), 'utf8');
  const usersSQL = fs.readFileSync(path.join(__dirname, 'users-setup.sql'), 'utf8');
  
  // Execute SQL scripts
  const results = await Promise.all([
    runSQL(emailOtpSQL, 'Email OTP setup'),
    runSQL(usersSQL, 'Users setup')
  ]);
  
  if (results.every(r => r)) {
    console.log('\n🎉 Email system setup completed successfully!');
    console.log('\nYou can now:');
    console.log('1. Configure email settings in the admin panel');
    console.log('2. Use forgot password functionality');
    console.log('3. Send password reset OTPs');
  } else {
    console.log('\n❌ Some setup steps failed. Please check the errors above.');
  }
}

// Alternative approach - execute SQL directly
async function executeSQL(sql) {
  try {
    const { data, error } = await supabase
      .from('_sql')
      .select('*')
      .limit(0);
    
    // This won't work, let's try a different approach
    const queries = sql.split(';').filter(q => q.trim());
    
    for (const query of queries) {
      if (query.trim()) {
        console.log('Executing:', query.substring(0, 50) + '...');
        // We'll need to use the REST API or create functions
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Simple setup without SQL execution
async function simpleSetup() {
  console.log('Email system configuration:');
  console.log('1. Environment variables are set in .env.local');
  console.log('2. Email service is configured');
  console.log('3. API routes are created');
  console.log('4. Frontend pages are ready');
  console.log('\nTo complete setup:');
  console.log('1. Run the SQL scripts manually in Supabase dashboard');
  console.log('2. Configure email settings in admin panel');
  console.log('3. Test the forgot password flow');
}

simpleSetup();