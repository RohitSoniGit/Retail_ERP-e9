import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase/server';
import { getEmailService } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email, organizationId } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServiceClient();

    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, organization_id')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (userError) {
      console.error('Error checking user:', userError);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'If an account with this email exists, you will receive a password reset email.'
      });
    }

    // If organizationId is provided, verify it matches
    if (organizationId && user.organization_id !== organizationId) {
      return NextResponse.json({
        success: true,
        message: 'If an account with this email exists, you will receive a password reset email.'
      });
    }

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

    // Generate reset token
    const resetToken = crypto.randomUUID();

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

    // Get organization name for email
    const { data: organization } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', user.organization_id)
      .single();

    // Send email
    const emailService = getEmailService();
    const emailSent = await emailService.sendPasswordResetOTP(
      email,
      otp,
      organization?.name
    );

    if (!emailSent) {
      console.error('Failed to send email');
      // Don't return error to user, as this could be used for enumeration
    }

    return NextResponse.json({
      success: true,
      message: 'If an account with this email exists, you will receive a password reset email.',
      resetToken, // This will be used in the frontend to track the reset process
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}