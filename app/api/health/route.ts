import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    console.log('Health check starting...');
    
    // Check environment variables
    const envCheck = {
      EMAIL_ENABLED: !!process.env.EMAIL_ENABLED,
      SMTP_HOST: !!process.env.SMTP_HOST,
      SMTP_PORT: !!process.env.SMTP_PORT,
      SMTP_USERNAME: !!process.env.SMTP_USERNAME,
      SMTP_PASSWORD: !!process.env.SMTP_PASSWORD,
      SMTP_FROM_EMAIL: !!process.env.SMTP_FROM_EMAIL,
      SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    };

    console.log('Environment check:', envCheck);

    // Check database connection
    let dbCheck = { connected: false, error: null };
    try {
      const supabase = getSupabaseServiceClient();
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name')
        .limit(1);
      
      if (error) {
        dbCheck = { connected: false, error: error.message };
      } else {
        dbCheck = { connected: true, error: null };
      }
    } catch (error) {
      dbCheck = { 
        connected: false, 
        error: error instanceof Error ? error.message : 'Unknown database error' 
      };
    }

    console.log('Database check:', dbCheck);

    // Check if nodemailer is available
    let emailServiceCheck = { available: false, error: null };
    try {
      await import('nodemailer');
      await import('@/lib/email');
      emailServiceCheck = { available: true, error: null };
    } catch (error) {
      emailServiceCheck = { 
        available: false, 
        error: error instanceof Error ? error.message : 'Email service not available' 
      };
    }

    console.log('Email service check:', emailServiceCheck);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      checks: {
        environment: envCheck,
        database: dbCheck,
        emailService: emailServiceCheck,
      }
    });

  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Health check failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}