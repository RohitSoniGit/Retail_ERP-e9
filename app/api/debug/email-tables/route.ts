import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServiceClient();

    // Get organization details
    const { data: organizations, error: orgError } = await supabase
      .from('organizations')
      .select('*');

    // Check if email_settings table exists
    const { data: emailSettings, error: emailError } = await supabase
      .from('email_settings')
      .select('*');

    // Check if users table exists
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');

    // Check if otp_tokens table exists
    const { data: otpTokens, error: otpError } = await supabase
      .from('otp_tokens')
      .select('*')
      .limit(1);

    return NextResponse.json({
      success: true,
      organizations: organizations || [],
      tables: {
        email_settings: {
          exists: !emailError,
          error: emailError?.message,
          count: emailSettings?.length || 0,
          data: emailSettings || []
        },
        users: {
          exists: !usersError,
          error: usersError?.message,
          count: users?.length || 0,
          data: users || []
        },
        otp_tokens: {
          exists: !otpError,
          error: otpError?.message,
          count: otpTokens?.length || 0
        }
      },
      environment: {
        EMAIL_ENABLED: process.env.EMAIL_ENABLED,
        SMTP_HOST: process.env.SMTP_HOST,
        SMTP_PORT: process.env.SMTP_PORT,
        SMTP_USERNAME: process.env.SMTP_USERNAME,
        SMTP_FROM_EMAIL: process.env.SMTP_FROM_EMAIL,
        SMTP_PASSWORD: process.env.SMTP_PASSWORD ? '***SET***' : 'NOT SET'
      }
    });

  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json(
      { 
        error: 'Debug failed', 
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}