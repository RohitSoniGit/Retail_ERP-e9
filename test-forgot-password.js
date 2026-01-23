// Test script for forgot password functionality
const testForgotPassword = async () => {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🧪 Testing Forgot Password Flow...\n');
  
  try {
    console.log('1. Testing forgot password API...');
    const response = await fetch(`${baseUrl}/api/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@ronakjewellers.com'
      }),
    });
    
    const data = await response.json();
    console.log('   Status:', response.status);
    console.log('   Response:', data);
    
    if (data.success) {
      console.log('   ✅ Forgot password API working!');
      console.log('   📧 OTP should be sent to email');
      console.log('   🔑 Reset token:', data.resetToken);
      
      console.log('\n2. Next steps:');
      console.log('   - Check email for 6-digit OTP');
      console.log('   - Go to: http://localhost:3000/forgot-password');
      console.log('   - Enter email: admin@ronakjewellers.com');
      console.log('   - Enter the OTP from email');
      console.log('   - Set new password');
      
    } else {
      console.log('   ❌ Forgot password API failed:', data.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Run the test
testForgotPassword();