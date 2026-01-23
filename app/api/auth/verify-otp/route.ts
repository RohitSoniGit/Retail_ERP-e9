import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { email, otp, resetToken, otpType = 'password_reset' } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServiceClient();

    // Validate OTP using the database function
    const { data: validationResult, error: validationError } = await supabase
      .rpc('validate_otp', {
        p_email: email.toLowerCase(),
        p_otp_code: otp,
        p_otp_type: otpType
      })
      .single();

    if (validationError) {
      console.error('Error validating OTP:', validationError);
      return NextResponse.json(
        { error: 'Failed to validate OTP' },
        { status: 500 }
      );
    }

    if (!validationResult.is_valid) {
      return NextResponse.json(
        { error: validationResult.message },
        { status: 400 }
      );
    }

    // If this is for password reset, verify the reset token
    if (otpType === 'password_reset' && resetToken) {
      const { data: resetRequest, error: resetError } = await supabase
        .from('password_reset_requests')
        .select('*')
        .eq('email', email.toLowerCase())
        .eq('reset_token', resetToken)
        .eq('is_active', true)
        .eq('otp_token_id', validationResult.token_id)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (resetError || !resetRequest) {
        return NextResponse.json(
          { error: 'Invalid or expired reset token' },
          { status: 400 }
        );
      }
    }

    // Generate a temporary session token for password reset
    const sessionToken = crypto.randomUUID();
    const sessionExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Get user info
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, organization_id')
      .eq('email', email.toLowerCase())
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Create temporary session
    const { error: sessionError } = await supabase
      .from('user_sessions')
      .insert({
        user_id: user.id,
        organization_id: user.organization_id,
        email: email.toLowerCase(),
        session_token: sessionToken,
        expires_at: sessionExpiry.toISOString(),
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
      });

    if (sessionError) {
      console.error('Error creating session:', sessionError);
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully',
      sessionToken,
      expiresAt: sessionExpiry.toISOString(),
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}