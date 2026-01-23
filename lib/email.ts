import nodemailer from 'nodemailer';

export interface EmailConfig {
  enabled: boolean;
  host: string;
  port: number;
  username: string;
  password: string;
  fromEmail: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private config: EmailConfig;

  constructor(config: EmailConfig) {
    this.config = config;
    if (config.enabled) {
      this.initializeTransporter();
    }
  }

  private initializeTransporter() {
    this.transporter = nodemailer.createTransporter({
      host: this.config.host,
      port: this.config.port,
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.config.username,
        pass: this.config.password,
      },
    });
  }

  async sendEmail(to: string, subject: string, html: string, text?: string) {
    if (!this.config.enabled || !this.transporter) {
      console.log('Email service is disabled or not configured');
      return false;
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.config.fromEmail,
        to,
        subject,
        text,
        html,
      });

      console.log('Email sent: %s', info.messageId);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  async sendPasswordResetOTP(email: string, otp: string, organizationName?: string) {
    const subject = 'Password Reset OTP - ' + (organizationName || 'Retail ERP');
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset OTP</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .otp-box { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
          .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset Request</h1>
            <p>${organizationName || 'Retail ERP'}</p>
          </div>
          <div class="content">
            <h2>Hello!</h2>
            <p>We received a request to reset your password. Use the OTP below to proceed with password reset:</p>
            
            <div class="otp-box">
              <p style="margin: 0; font-size: 16px; color: #666;">Your OTP Code:</p>
              <div class="otp-code">${otp}</div>
              <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">Valid for 10 minutes</p>
            </div>

            <div class="warning">
              <strong>⚠️ Security Notice:</strong>
              <ul style="margin: 10px 0;">
                <li>This OTP is valid for 10 minutes only</li>
                <li>Do not share this code with anyone</li>
                <li>If you didn't request this, please ignore this email</li>
              </ul>
            </div>

            <p>If you have any questions, please contact your system administrator.</p>
            
            <p>Best regards,<br>
            ${organizationName || 'Retail ERP'} Team</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Password Reset OTP - ${organizationName || 'Retail ERP'}

Hello!

We received a request to reset your password. Use the OTP below to proceed with password reset:

Your OTP Code: ${otp}
Valid for 10 minutes

Security Notice:
- This OTP is valid for 10 minutes only
- Do not share this code with anyone
- If you didn't request this, please ignore this email

If you have any questions, please contact your system administrator.

Best regards,
${organizationName || 'Retail ERP'} Team

This is an automated email. Please do not reply to this message.
    `;

    return await this.sendEmail(email, subject, html, text);
  }

  async sendWelcomeEmail(email: string, tempPassword: string, organizationName?: string) {
    const subject = 'Welcome to ' + (organizationName || 'Retail ERP');
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to ${organizationName || 'Retail ERP'}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .credentials-box { background: white; border: 2px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .password { font-family: monospace; font-size: 18px; font-weight: bold; color: #667eea; background: #f0f0f0; padding: 10px; border-radius: 4px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome!</h1>
            <p>${organizationName || 'Retail ERP'}</p>
          </div>
          <div class="content">
            <h2>Hello!</h2>
            <p>Welcome to ${organizationName || 'Retail ERP'}! Your account has been created successfully.</p>
            
            <div class="credentials-box">
              <h3>Your Login Credentials:</h3>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Temporary Password:</strong></p>
              <div class="password">${tempPassword}</div>
            </div>

            <div class="warning">
              <strong>🔒 Important Security Steps:</strong>
              <ol style="margin: 10px 0;">
                <li>Login with the temporary password above</li>
                <li>Change your password immediately after first login</li>
                <li>Keep your login credentials secure</li>
                <li>Do not share your password with anyone</li>
              </ol>
            </div>

            <p>If you have any questions or need assistance, please contact your system administrator.</p>
            
            <p>Best regards,<br>
            ${organizationName || 'Retail ERP'} Team</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Welcome to ${organizationName || 'Retail ERP'}!

Hello!

Welcome to ${organizationName || 'Retail ERP'}! Your account has been created successfully.

Your Login Credentials:
Email: ${email}
Temporary Password: ${tempPassword}

Important Security Steps:
1. Login with the temporary password above
2. Change your password immediately after first login
3. Keep your login credentials secure
4. Do not share your password with anyone

If you have any questions or need assistance, please contact your system administrator.

Best regards,
${organizationName || 'Retail ERP'} Team

This is an automated email. Please do not reply to this message.
    `;

    return await this.sendEmail(email, subject, html, text);
  }
}

// Create a singleton instance
let emailService: EmailService | null = null;

export function getEmailService(): EmailService {
  if (!emailService) {
    const config: EmailConfig = {
      enabled: process.env.EMAIL_ENABLED === 'true',
      host: process.env.SMTP_HOST || '',
      port: parseInt(process.env.SMTP_PORT || '587'),
      username: process.env.SMTP_USERNAME || '',
      password: process.env.SMTP_PASSWORD || '',
      fromEmail: process.env.SMTP_FROM_EMAIL || '',
    };
    emailService = new EmailService(config);
  }
  return emailService;
}