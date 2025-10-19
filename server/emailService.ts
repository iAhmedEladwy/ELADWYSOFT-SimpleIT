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
      // Initialize if not already initialized
      if (!this.initialized || !this.transporter) {
        const initialized = await this.initialize();
        if (!initialized) {
          return false;
        }
      }

      if (!this.config || !this.transporter) {
        return false;
      }

      // Send the email
      await this.transporter.sendMail({
        from: `"${this.config.emailFromName || 'SimpleIT'}" <${this.config.emailFromAddress}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html
      });

      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  /**
   * Send a password reset email
   */
  async sendPasswordResetEmail(email: string, resetToken: string, username: string): Promise<boolean> {
    try {
      // Use the system configuration to determine the reset URL
      const resetUrl = `${process.env.APP_URL || 'http://localhost:5000'}/reset-password?token=${resetToken}`;
      
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">SimpleIT Password Reset</h2>
          <p>Hello ${username},</p>
          <p>You have requested to reset your password. Please use the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
          </div>
          <p>If you did not request a password reset, please ignore this email or contact your administrator.</p>
          <p>Thank you,<br>SimpleIT Team</p>
        </div>
      `;

      const text = `
        SimpleIT Password Reset
        
        Hello ${username},
        
        You have requested to reset your password. Please visit the following link to reset your password:
        
        ${resetUrl}
        
        If you did not request a password reset, please ignore this email or contact your administrator.
        
        Thank you,
        SimpleIT Team
      `;

      return await this.sendEmail({
        to: email,
        subject: 'Password Reset Request',
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