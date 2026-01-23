import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServiceClient();

    const { data: settings, error } = await supabase
      .from('email_settings')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching email settings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch email settings' },
        { status: 500 }
      );
    }

    // Return default settings if none exist
    const defaultSettings = {
      smtp_host: process.env.SMTP_HOST || '',
      smtp_port: parseInt(process.env.SMTP_PORT || '587'),
      smtp_username: process.env.SMTP_USERNAME || '',
      smtp_from_email: process.env.SMTP_FROM_EMAIL || '',
      email_enabled: process.env.EMAIL_ENABLED === 'true',
    };

    return NextResponse.json({
      success: true,
      settings: settings || defaultSettings,
    });

  } catch (error) {
    console.error('Get email settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  console.log('POST /api/settings/email - Starting request');
  
  try {
    const body = await request.json();
    console.log('Request body received:', { ...body, smtpPassword: body.smtpPassword ? '***HIDDEN***' : undefined });

    const {
      organizationId,
      smtpHost,
      smtpPort,
      smtpUsername,
      smtpPassword,
      smtpFromEmail,
      emailEnabled
    } = body;

    if (!organizationId) {
      console.log('Missing organizationId');
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    console.log('Initializing Supabase client...');
    const supabase = getSupabaseServiceClient();

    console.log('Attempting to upsert email settings...');
    // Upsert email settings
    const { data: settings, error } = await supabase
      .from('email_settings')
      .upsert({
        organization_id: organizationId,
        smtp_host: smtpHost,
        smtp_port: smtpPort,
        smtp_username: smtpUsername,
        smtp_password: smtpPassword,
        smtp_from_email: smtpFromEmail,
        email_enabled: emailEnabled,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error saving email settings:', error);
      return NextResponse.json(
        { 
          error: 'Failed to save email settings',
          details: error.message,
          code: error.code 
        },
        { status: 500 }
      );
    }

    console.log('Email settings saved successfully');
    return NextResponse.json({
      success: true,
      message: 'Email settings saved successfully',
      settings,
    });

  } catch (error) {
    console.error('POST /api/settings/email - Unexpected error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  console.log('PUT /api/settings/email - Starting test email request');
  
  try {
    const body = await request.json();
    console.log('Request body:', body);

    const { organizationId } = body;

    if (!organizationId) {
      console.log('Missing organizationId');
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    console.log('Initializing Supabase client...');
    const supabase = getSupabaseServiceClient();

    console.log('Fetching email settings...');
    // Test email configuration by sending a test email
    const { data: settings, error: settingsError } = await supabase
      .from('email_settings')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    if (settingsError) {
      console.error('Error fetching email settings:', settingsError);
      return NextResponse.json(
        { 
          error: 'Email settings not found',
          details: settingsError.message 
        },
        { status: 404 }
      );
    }

    if (!settings.email_enabled) {
      console.log('Email is not enabled');
      return NextResponse.json(
        { error: 'Email is not enabled' },
        { status: 400 }
      );
    }

    console.log('Email settings found, attempting to send test email...');
    
    // Check if nodemailer is available
    try {
      console.log('Importing email service...');
      const { EmailService } = await import('@/lib/email');
      
      console.log('Creating email service instance...');
      const emailService = new EmailService({
        enabled: settings.email_enabled,
        host: settings.smtp_host,
        port: settings.smtp_port,
        username: settings.smtp_username,
        password: settings.smtp_password,
        fromEmail: settings.smtp_from_email,
      });

      console.log('Sending test email...');
      // Send test email
      const testEmailSent = await emailService.sendEmail(
        settings.smtp_from_email,
        'Test Email - Retail ERP',
        `
          <h2>Email Configuration Test</h2>
          <p>This is a test email to verify your email configuration is working correctly.</p>
          <p>If you received this email, your SMTP settings are configured properly.</p>
          <p>Sent at: ${new Date().toLocaleString()}</p>
        `,
        'Email Configuration Test - This is a test email to verify your email configuration is working correctly.'
      );

      if (!testEmailSent) {
        console.log('Test email failed to send');
        return NextResponse.json(
          { error: 'Failed to send test email. Please check your SMTP settings.' },
          { status: 400 }
        );
      }

      console.log('Test email sent successfully');
      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully',
      });

    } catch (emailError) {
      console.error('Email service error:', emailError);
      return NextResponse.json(
        { 
          error: 'Email service error',
          message: emailError instanceof Error ? emailError.message : 'Unknown email error',
          details: 'Make sure nodemailer is installed and configured properly'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('PUT /api/settings/email - Unexpected error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      },
      { status: 500 }
    );
  }
}