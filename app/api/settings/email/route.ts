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
  try {
    const {
      organizationId,
      smtpHost,
      smtpPort,
      smtpUsername,
      smtpPassword,
      smtpFromEmail,
      emailEnabled
    } = await request.json();

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServiceClient();

    // Upsert email settings
    const { data: settings, error } = await supabase
      .from('email_settings')
      .upsert({
        organization_id: organizationId,
        smtp_host: smtpHost,
        smtp_port: smtpPort,
        smtp_username: smtpUsername,
        smtp_password: smtpPassword, // In production, this should be encrypted
        smtp_from_email: smtpFromEmail,
        email_enabled: emailEnabled,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving email settings:', error);
      return NextResponse.json(
        { error: 'Failed to save email settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Email settings saved successfully',
      settings,
    });

  } catch (error) {
    console.error('Save email settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { organizationId } = await request.json();

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServiceClient();

    // Test email configuration by sending a test email
    const { data: settings, error: settingsError } = await supabase
      .from('email_settings')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    if (settingsError) {
      return NextResponse.json(
        { error: 'Email settings not found' },
        { status: 404 }
      );
    }

    if (!settings.email_enabled) {
      return NextResponse.json(
        { error: 'Email is not enabled' },
        { status: 400 }
      );
    }

    // Import email service dynamically to use organization-specific settings
    const { EmailService } = await import('@/lib/email');
    
    const emailService = new EmailService({
      enabled: settings.email_enabled,
      host: settings.smtp_host,
      port: settings.smtp_port,
      username: settings.smtp_username,
      password: settings.smtp_password,
      fromEmail: settings.smtp_from_email,
    });

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
      return NextResponse.json(
        { error: 'Failed to send test email. Please check your SMTP settings.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
    });

  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json(
      { error: 'Failed to send test email' },
      { status: 500 }
    );
  }
}