import nodemailer from 'nodemailer';
import { db } from '../db';
import { systemConfig } from '../../shared/schema';
import { eq } from 'drizzle-orm';

export interface EmailConfig {
  emailHost: string;
  emailPort: number;
  emailUser: string;
  emailPassword: string;
  emailFromAddress: string;
  emailFromName: string;
  emailSecure: boolean;
}

export interface TestEmailOptions {
  to: string;
  subject?: string;
  text?: string;
  html?: string;
}

export class EmailService {
  private static instance: EmailService;
  private transporter: nodemailer.Transporter | null = null;
  private currentConfig: EmailConfig | null = null;

  private constructor() {}

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  /**
   * Load email configuration from database and initialize transporter
   */
  public async loadConfiguration(): Promise<EmailConfig | null> {
    try {
      const configResult = await db.select().from(systemConfig).limit(1);
      
      if (configResult.length === 0) {
        console.log('No system configuration found');
        return null;
      }

      const config = configResult[0];
      
      // Check if all required email fields are present
      if (!config.emailHost || !config.emailPort || !config.emailUser || !config.emailPassword) {
        console.log('Email configuration incomplete - missing required fields');
        return null;
      }

      const emailConfig: EmailConfig = {
        emailHost: config.emailHost,
        emailPort: config.emailPort,
        emailUser: config.emailUser,
        emailPassword: config.emailPassword,
        emailFromAddress: config.emailFromAddress || config.emailUser,
        emailFromName: config.emailFromName || 'SimpleIT System',
        emailSecure: config.emailSecure !== false // Default to true if not specified
      };

      this.currentConfig = emailConfig;
      await this.initializeTransporter(emailConfig);
      
      return emailConfig;
    } catch (error) {
      console.error('Failed to load email configuration:', error);
      return null;
    }
  }

  /**
   * Initialize the email transporter with given configuration
   */
  private async initializeTransporter(config: EmailConfig): Promise<void> {
    try {
      this.transporter = nodemailer.createTransporter({
        host: config.emailHost,
        port: config.emailPort,
        secure: config.emailSecure, // true for 465, false for other ports
        auth: {
          user: config.emailUser,
          pass: config.emailPassword,
        },
        // Add some additional options for better compatibility
        tls: {
          rejectUnauthorized: false // Allow self-signed certificates for development
        }
      });

      console.log('Email transporter initialized successfully');
    } catch (error) {
      console.error('Failed to initialize email transporter:', error);
      this.transporter = null;
      throw error;
    }
  }

  /**
   * Save email configuration to database
   */
  public async saveConfiguration(config: EmailConfig): Promise<void> {
    try {
      // Check if configuration exists
      const existingConfig = await db.select().from(systemConfig).limit(1);
      
      if (existingConfig.length === 0) {
        // Create new configuration
        await db.insert(systemConfig).values({
          emailHost: config.emailHost,
          emailPort: config.emailPort,
          emailUser: config.emailUser,
          emailPassword: config.emailPassword,
          emailFromAddress: config.emailFromAddress,
          emailFromName: config.emailFromName,
          emailSecure: config.emailSecure,
          updatedAt: new Date()
        });
      } else {
        // Update existing configuration
        await db.update(systemConfig)
          .set({
            emailHost: config.emailHost,
            emailPort: config.emailPort,
            emailUser: config.emailUser,
            emailPassword: config.emailPassword,
            emailFromAddress: config.emailFromAddress,
            emailFromName: config.emailFromName,
            emailSecure: config.emailSecure,
            updatedAt: new Date()
          })
          .where(eq(systemConfig.id, existingConfig[0].id));
      }

      // Update current configuration and reinitialize transporter
      this.currentConfig = config;
      await this.initializeTransporter(config);
      
      console.log('Email configuration saved successfully');
    } catch (error) {
      console.error('Failed to save email configuration:', error);
      throw error;
    }
  }

  /**
   * Test email configuration by sending a test email
   */
  public async testConfiguration(config: EmailConfig, testEmail: TestEmailOptions): Promise<{ success: boolean; error?: string }> {
    try {
      // Create a temporary transporter for testing
      const testTransporter = nodemailer.createTransporter({
        host: config.emailHost,
        port: config.emailPort,
        secure: config.emailSecure,
        auth: {
          user: config.emailUser,
          pass: config.emailPassword,
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      // Verify the connection
      await testTransporter.verify();

      // Send test email
      const mailOptions = {
        from: `"${config.emailFromName}" <${config.emailFromAddress}>`,
        to: testEmail.to,
        subject: testEmail.subject || 'SimpleIT Email Configuration Test',
        text: testEmail.text || 'This is a test email to verify your email configuration is working correctly.',
        html: testEmail.html || `
          <h2>SimpleIT Email Configuration Test</h2>
          <p>This is a test email to verify your email configuration is working correctly.</p>
          <p><strong>Configuration Details:</strong></p>
          <ul>
            <li>SMTP Host: ${config.emailHost}</li>
            <li>SMTP Port: ${config.emailPort}</li>
            <li>Secure Connection: ${config.emailSecure ? 'Yes' : 'No'}</li>
            <li>From Address: ${config.emailFromAddress}</li>
          </ul>
          <p>If you received this email, your configuration is working correctly!</p>
        `
      };

      const result = await testTransporter.sendMail(mailOptions);
      console.log('Test email sent successfully:', result.messageId);

      return { success: true };
    } catch (error) {
      console.error('Email test failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Send an email using the current configuration
   */
  public async sendEmail(options: {
    to: string | string[];
    subject: string;
    text?: string;
    html?: string;
    cc?: string | string[];
    bcc?: string | string[];
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!this.transporter || !this.currentConfig) {
        await this.loadConfiguration();
        if (!this.transporter || !this.currentConfig) {
          throw new Error('Email service not configured');
        }
      }

      const mailOptions = {
        from: `"${this.currentConfig.emailFromName}" <${this.currentConfig.emailFromAddress}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        cc: options.cc,
        bcc: options.bcc
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);

      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Failed to send email:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Get current email configuration (without password for security)
   */
  public async getCurrentConfiguration(): Promise<Omit<EmailConfig, 'emailPassword'> | null> {
    try {
      const config = await this.loadConfiguration();
      if (!config) return null;

      const { emailPassword, ...safeConfig } = config;
      return safeConfig;
    } catch (error) {
      console.error('Failed to get current email configuration:', error);
      return null;
    }
  }

  /**
   * Check if email service is properly configured
   */
  public async isConfigured(): Promise<boolean> {
    try {
      const config = await this.loadConfiguration();
      return config !== null;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const emailService = EmailService.getInstance();