// Simple test script to verify email API endpoints
const testEmailAPI = async () => {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🧪 Testing Email API Endpoints...\n');
  
  try {
    // Test 1: Forgot Password API
    console.log('1. Testing Forgot Password API...');
    const forgotResponse = await fetch(`${baseUrl}/api/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@ronakjewellers.com'
      }),
    });
    
    const forgotData = await forgotResponse.json();
    console.log('   Status:', forgotResponse.status);
    console.log('   Response:', forgotData);
    
    if (forgotData.success) {
      console.log('   ✅ Forgot password API working!');
      console.log('   📧 Check email for OTP');
      
      // Prompt for OTP
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      rl.question('\n   Enter the OTP from email (or press Enter to skip): ', async (otp) => {
        if (otp && otp.length === 6) {
          console.log('\n2. Testing OTP Verification...');
          
          const otpResponse = await fetch(`${baseUrl}/api/auth/verify-otp`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: 'admin@ronakjewellers.com',
              otp: otp,
              resetToken: forgotData.resetToken,
              otpType: 'password_reset'
            }),
          });
          
          const otpData = await otpResponse.json();
          console.log('   Status:', otpResponse.status);
          console.log('   Response:', otpData);
          
          if (otpData.success) {
            console.log('   ✅ OTP verification working!');
            console.log('   🔑 Session token received');
          } else {
            console.log('   ❌ OTP verification failed');
          }
        } else {
          console.log('   ⏭️  Skipping OTP test');
        }
        
        console.log('\n🎉 Email system test completed!');
        console.log('\nNext steps:');
        console.log('1. Go to http://localhost:3000/forgot-password');
        console.log('2. Test the complete flow in browser');
        console.log('3. Configure email settings in admin panel');
        
        rl.close();
      });
      
    } else {
      console.log('   ❌ Forgot password API failed');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\nMake sure:');
    console.log('1. Development server is running (npm run dev)');
    console.log('2. Database setup is complete');
    console.log('3. Environment variables are set');
  }
};

// Run the test
testEmailAPI();