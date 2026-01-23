import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase/server';
import { getEmailService } from '@/lib/email';

// Generate UUID compatible with older Node.js versions
function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback UUID generation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export async function POST(request: NextRequest) {
  console.log('POST /api/auth/forgot-password - Starting request');
  
  try {
    const body = await request.json();
    console.log('Request body:', { email: body.email, organizationId: body.organizationId });

    const { email, organizationId } = body;

    if (!email) {
      console.log('Missing email');
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    console.log('Initializing Supabase client...');
    const supabase = getSupabaseServiceClient();

    console.log('Checking if user exists...');
    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, organization_id')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (userError) {
      console.error('Error checking user:', userError);
      return NextResponse.json(
        { error: 'Database error while checking user' },
        { status: 500 }
      );
    }

    console.log('User found:', !!user);

    // Always return success to prevent email enumeration
    if (!user) {
      console.log('User not found, returning success for security');
      return NextResponse.json({
        success: true,
        message: 'If an account with this email exists, you will receive a password reset email.',
        resetToken: generateUUID() // Fake token for consistency
      });
    }

    // If organizationId is provided, verify it matches
    if (organizationId && user.organization_id !== organizationId) {
      console.log('Organization ID mismatch');
      return NextResponse.json({
        success: true,
        message: 'If an account with this email exists, you will receive a password reset email.',
        resetToken: generateUUID() // Fake token for consistency
      });
    }

    console.log('Generating OTP...');
    // Generate OTP
    const { data: otpData, error: otpError } = await supabase
      .rpc('generate_otp');

    if (otpError || !otpData) {
      console.error('Error generating OTP:', otpError);
      return NextResponse.json(
        { error: 'Failed to generate OTP' },
        { status: 500 }
      );
    }

    const otp = otpData;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    console.log('Generated OTP:', otp);

    console.log('Storing OTP in database...');
    // Store OTP in database
    const { data: otpToken, error: otpTokenError } = await supabase
      .from('otp_tokens')
      .insert({
        email: email.toLowerCase(),
        otp_code: otp,
        otp_type: 'password_reset',
        organization_id: user.organization_id,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (otpTokenError) {
      console.error('Error storing OTP:', otpTokenError);
      return NextResponse.json(
        { error: 'Failed to create password reset request' },
        { status: 500 }
      );
    }

    console.log('Generating reset token...');
    // Generate reset token
    const resetToken = generateUUID();

    console.log('Storing password reset request...');
    // Store password reset request
    const { error: resetError } = await supabase
      .from('password_reset_requests')
      .insert({
        email: email.toLowerCase(),
        organization_id: user.organization_id,
        otp_token_id: otpToken.id,
        reset_token: resetToken,
        expires_at: expiresAt.toISOString(),
      });

    if (resetError) {
      console.error('Error storing reset request:', resetError);
      return NextResponse.json(
        { error: 'Failed to create password reset request' },
        { status: 500 }
      );
    }

    console.log('Getting organization name...');
    // Get organization name for email
    const { data: organization } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', user.organization_id)
      .single();

    console.log('Sending email...');
    // Send email
    try {
      const emailService = getEmailService();
      const emailSent = await emailService.sendPasswordResetOTP(
        email,
        otp,
        organization?.name
      );

      if (!emailSent) {
        console.error('Failed to send email');
        // Don't return error to user, as this could be used for enumeration
      } else {
        console.log('Email sent successfully');
      }
    } catch (emailError) {
      console.error('Email service error:', emailError);
      // Don't return error to user, as this could be used for enumeration
    }

    console.log('Password reset request completed successfully');
    return NextResponse.json({
      success: true,
      message: 'If an account with this email exists, you will receive a password reset email.',
      resetToken, // This will be used in the frontend to track the reset process
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}