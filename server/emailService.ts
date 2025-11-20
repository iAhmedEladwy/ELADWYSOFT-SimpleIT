import nodemailer from 'nodemailer';
import { SystemConfig } from '@shared/schema';
import { storage } from './storage';

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Email service that uses the system configuration to send emails
 */
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private config: SystemConfig | null = null;
  private initialized = false;

  /**
   * Initialize the email service with the system configuration
   */
  async initialize(): Promise<boolean> {
    try {
      // Get the system configuration from storage
      this.config = await storage.getSystemConfig();
      
      if (!this.config) {
        console.error('Email service initialization failed: No system configuration found');
        return false;
      }

      // Check if email configuration is set
      if (!this.isEmailConfigured()) {
        console.log('Email service not configured: Missing required email settings');
        return false;
      }

      // Create the transporter
      this.transporter = nodemailer.createTransport({
        host: this.config.emailHost,
        port: this.config.emailPort || 465,
        secure: this.config.emailSecure, // true for 465, false for other ports
        auth: {
          user: this.config.emailUser,
          pass: this.config.emailPassword
        },
        tls: {
          rejectUnauthorized: false // Required for some Gmail configurations
        }
      });

      // Verify connection
      await this.transporter.verify();
      
      this.initialized = true;
      console.log('Email service initialized successfully');
      return true;
    } catch (error) {
      console.error('Email service initialization failed:', error);
      this.initialized = false;
      return false;
    }
  }

  /**
   * Check if email configuration is set
   */
  isEmailConfigured(): boolean {
    if (!this.config) return false;
    
    return !!(
      this.config.emailHost && 
      this.config.emailPort && 
      this.config.emailUser && 
      this.config.emailPassword &&
      this.config.emailFromAddress
    );
  }

  /**
   * Send an email
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      // Always reinitialize to get latest config (in case settings were updated)
      console.log('[EmailService] Reinitializing to fetch latest email configuration...');
      const initialized = await this.initialize();
      if (!initialized) {
        console.error('[EmailService] Failed to initialize. Email settings may not be configured.');
        console.error('[EmailService] Please configure email settings in System Config > Email tab');
        return false;
      }

      if (!this.config || !this.transporter) {
        console.error('[EmailService] Missing config or transporter after initialization');
        return false;
      }

      console.log(`[EmailService] Sending email to ${options.to} with subject: ${options.subject}`);

      // Send the email
      await this.transporter.sendMail({
        from: `"${this.config.emailFromName || 'SimpleIT'}" <${this.config.emailFromAddress}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html
      });

      console.log(`[EmailService] Email sent successfully to ${options.to}`);
      return true;
    } catch (error) {
      console.error('[EmailService] Failed to send email:', error);
      if (error instanceof Error) {
        console.error('[EmailService] Error details:', error.message);
      }
      return false;
    }
  }

  /**
   * Send a password reset email
   */
  async sendPasswordResetEmail(email: string, resetToken: string, username: string, language: string = 'English'): Promise<boolean> {
    try {
      // Use the system configuration to determine the reset URL
      const resetUrl = `${process.env.APP_URL || 'http://localhost:5000'}/reset-password?token=${resetToken}`;
      
      const translations = {
        subject: language === 'English' ? 'Password Reset Request - SimpleIT' : 'طلب إعادة تعيين كلمة المرور - SimpleIT',
        heading: language === 'English' ? 'Password Reset Request' : 'طلب إعادة تعيين كلمة المرور',
        greeting: language === 'English' ? `Hello ${username},` : `مرحباً ${username}،`,
        message: language === 'English' 
          ? 'You have requested to reset your password. Click the button below to reset your password:' 
          : 'لقد طلبت إعادة تعيين كلمة المرور الخاصة بك. انقر على الزر أدناه لإعادة تعيين كلمة المرور:',
        button: language === 'English' ? 'Reset Password' : 'إعادة تعيين كلمة المرور',
        expiry: language === 'English' 
          ? 'This link will expire in 1 hour for security purposes.' 
          : 'سينتهي صلاحية هذا الرابط خلال ساعة واحدة لأغراض أمنية.',
        ignore: language === 'English'
          ? 'If you did not request this password reset, please ignore this email or contact support if you have concerns.'
          : 'إذا لم تطلب إعادة تعيين كلمة المرور هذه، يرجى تجاهل هذا البريد الإلكتروني أو الاتصال بالدعم إذا كان لديك مخاوف.',
        signature: language === 'English' ? 'Thank you,<br>SimpleIT Team' : 'شكراً لك،<br>فريق SimpleIT'
      };
      
      const html = `
        <!DOCTYPE html>
        <html dir="${language === 'English' ? 'ltr' : 'rtl'}" lang="${language === 'English' ? 'en' : 'ar'}">
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              margin: 0;
              padding: 20px;
              background-color: #f4f4f4;
              text-align: ${language === 'English' ? 'left' : 'right'};
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: white;
              padding: 30px;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .logo {
              text-align: center;
              margin-bottom: 30px;
            }
            .heading {
              color: #3b82f6;
              margin: 0 0 20px;
              text-align: center;
            }
            .button-container {
              text-align: center;
              margin: 30px 0;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #3b82f6;
              color: white !important;
              text-decoration: none;
              border-radius: 5px;
              font-weight: bold;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #eee;
              font-size: 0.9em;
              color: #666;
              text-align: center;
            }
            .warning {
              margin: 20px 0;
              padding: 15px;
              background-color: #fff5f5;
              border-radius: 5px;
              color: #e53e3e;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="heading">${translations.heading}</h1>
            <p>${translations.greeting}</p>
            <p>${translations.message}</p>
            <div class="button-container">
              <a href="${resetUrl}" class="button">${translations.button}</a>
            </div>
            <p><strong>${translations.expiry}</strong></p>
            <div class="warning">
              ${translations.ignore}
            </div>
            <div class="footer">
              <p>${translations.signature}</p>
              <p>© ${new Date().getFullYear()} ELADWYSOFT SimpleIT</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const text = `
        ${translations.heading}
        
        ${translations.greeting}
        
        ${translations.message}
        
        ${resetUrl}
        
        ${translations.expiry}
        
        ${translations.ignore}
        
        ${translations.signature.replace('<br>', '\n')}
      `;

      return await this.sendEmail({
        to: email,
        subject: translations.subject,
        html,
        text
      });
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      return false;
    }
  }

  /**
   * Send a notification email
   */
  async sendNotificationEmail(options: {
    to: string;
    subject: string;
    message: string;
    title?: string;
  }): Promise<boolean> {
    try {
      const { to, subject, message, title } = options;
      
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">${title || 'SimpleIT Notification'}</h2>
          <div style="padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; margin: 20px 0;">
            ${message}
          </div>
          <p>Thank you,<br>SimpleIT Team</p>
        </div>
      `;

      const text = `
        ${title || 'SimpleIT Notification'}
        
        ${message}
        
        Thank you,
        SimpleIT Team
      `;

      return await this.sendEmail({
        to,
        subject,
        html,
        text
      });
    } catch (error) {
      console.error('Failed to send notification email:', error);
      return false;
    }
  }
}

// Create singleton instance
export const emailService = new EmailService();