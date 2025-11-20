/**
 * Employee Self-Registration Service
 * 
 * Handles email verification and user account creation for employees
 * who already exist in the system.
 */

import crypto from 'crypto';
import { storage } from '../storage';
import { registrationTokens, type RegistrationToken, type InsertRegistrationToken } from '@shared/schema';
import { db } from '../db';
import { eq, and, gt } from 'drizzle-orm';
import { emailService } from '../emailService';

const TOKEN_EXPIRY_HOURS = 24;

export interface RegistrationRequest {
  email: string;
  corporateEmail?: string;
  personalEmail?: string;
}

export interface RegistrationVerification {
  token: string;
  username: string;
  password: string;
}

export interface RegistrationResult {
  success: boolean;
  message: string;
  employeeName?: string;
  tokenSent?: boolean;
}

/**
 * Initiates registration by verifying employee exists and sending verification email
 */
export async function initiateRegistration(request: RegistrationRequest): Promise<RegistrationResult> {
  try {
    const email = request.email.toLowerCase().trim();

    // Check if employee exists with this email
    const employee = await storage.getEmployeeByEmail(email);
    
    if (!employee) {
      return {
        success: false,
        message: 'No employee record found with this email address. Please contact your administrator.'
      };
    }

    // Check if employee already has a user account
    if (employee.userId) {
      return {
        success: false,
        message: 'This employee already has a user account. Please use the login page.'
      };
    }

    // Generate verification token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + TOKEN_EXPIRY_HOURS);

    // Save token to database
    await db.insert(registrationTokens).values({
      email,
      token,
      employeeId: employee.id,
      expiresAt,
      used: false
    });

    // Send verification email
    const verificationLink = `${process.env.APP_URL || 'http://localhost:5000'}/verify-email?token=${token}`;
    
    const html = `
      <!DOCTYPE html>
      <html dir="ltr" lang="en">
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f4f4f4;
            text-align: left;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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
            background-color: #22c55e;
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
          .info-box {
            margin: 20px 0;
            padding: 15px;
            background-color: #f0f9ff;
            border-radius: 5px;
            color: #0369a1;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 class="heading">Verify Your Email - SimpleIT Registration</h1>
          <p>Hello ${employee.englishName},</p>
          <p>Click the link below to complete your registration and create your account:</p>
          <div class="button-container">
            <a href="${verificationLink}" class="button">Verify Email & Create Account</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #3b82f6;">${verificationLink}</p>
          <p><strong>This link will expire in ${TOKEN_EXPIRY_HOURS} hours.</strong></p>
          <div class="info-box">
            If you didn't request this, please ignore this email
          </div>
          <div class="footer">
            <p>Thank you,<br>SimpleIT Team</p>
            <p>© ${new Date().getFullYear()} ELADWYSOFT SimpleIT</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Verify Your Email - SimpleIT Registration

Hello ${employee.englishName},

Click the link below to complete your registration and create your account:
${verificationLink}

This link will expire in ${TOKEN_EXPIRY_HOURS} hours.

If you didn't request this, please ignore this email.

Thank you,
SimpleIT Team
    `;

    const emailSent = await emailService.sendEmail({
      to: email,
      subject: 'Verify Your Email - SimpleIT Registration',
      html,
      text
    });

    if (!emailSent) {
      console.error('[Registration] Failed to send verification email - email service returned false');
      console.error('[Registration] Possible reasons: Email not configured, invalid SMTP settings, or network error');
      return {
        success: false,
        message: 'Failed to send verification email. Please ensure email settings are configured in System Config, or contact your administrator.'
      };
    }

    console.log(`[Registration] Verification email sent successfully to ${email} for employee ${employee.englishName}`);

    return {
      success: true,
      message: `Verification email sent to ${email}. Please check your inbox and spam folder.`,
      employeeName: employee.englishName,
      tokenSent: true
    };
  } catch (error) {
    console.error('[Registration] Error initiating registration:', error);
    return {
      success: false,
      message: 'Registration failed. Please try again later.'
    };
  }
}

/**
 * Verifies token and creates user account
 */
export async function completeRegistration(verification: RegistrationVerification): Promise<RegistrationResult> {
  try {
    // Find and validate token
    const [tokenRecord] = await db
      .select()
      .from(registrationTokens)
      .where(
        and(
          eq(registrationTokens.token, verification.token),
          eq(registrationTokens.used, false),
          gt(registrationTokens.expiresAt, new Date())
        )
      );

    if (!tokenRecord) {
      return {
        success: false,
        message: 'Invalid or expired verification token. Please request a new one.'
      };
    }

    // Get employee record
    const employee = tokenRecord.employeeId 
      ? await storage.getEmployee(tokenRecord.employeeId)
      : await storage.getEmployeeByEmail(tokenRecord.email);

    if (!employee) {
      return {
        success: false,
        message: 'Employee record not found. Please contact your administrator.'
      };
    }

    // Check if employee already has a user account
    if (employee.userId) {
      await markTokenAsUsed(tokenRecord.id);
      return {
        success: false,
        message: 'This employee already has a user account. Please use the login page.'
      };
    }

    // Check if username already exists
    const existingUser = await storage.getUserByUsername(verification.username);
    if (existingUser) {
      return {
        success: false,
        message: 'Username already exists. Please choose a different username.'
      };
    }

    // Create user account using employee's existing name data
    const newUser = await storage.createUser({
      username: verification.username,
      password: verification.password, // Will be hashed in storage.createUser
      email: tokenRecord.email,
      firstName: employee.englishName.split(' ')[0] || employee.englishName, // Extract first name
      lastName: employee.englishName.split(' ').slice(1).join(' ') || '', // Extract last name
      role: 'employee',
      isActive: true
    });

    // Link user to employee
    await storage.updateEmployee(employee.id, { userId: newUser.id });

    // Mark token as used
    await markTokenAsUsed(tokenRecord.id);

    console.log(`[Registration] User account created and linked: ${newUser.username} -> Employee ${employee.englishName}`);

    return {
      success: true,
      message: 'Account created successfully! You can now log in.',
      employeeName: employee.englishName
    };
  } catch (error) {
    console.error('[Registration] Error completing registration:', error);
    return {
      success: false,
      message: 'Failed to create account. Please try again or contact support.'
    };
  }
}

/**
 * Validates a registration token without using it
 */
export async function validateToken(token: string): Promise<{ valid: boolean; employee?: any; message?: string }> {
  try {
    const [tokenRecord] = await db
      .select()
      .from(registrationTokens)
      .where(
        and(
          eq(registrationTokens.token, token),
          eq(registrationTokens.used, false),
          gt(registrationTokens.expiresAt, new Date())
        )
      );

    if (!tokenRecord) {
      return {
        valid: false,
        message: 'Invalid or expired verification token.'
      };
    }

    const employee = tokenRecord.employeeId 
      ? await storage.getEmployee(tokenRecord.employeeId)
      : await storage.getEmployeeByEmail(tokenRecord.email);

    if (!employee) {
      return {
        valid: false,
        message: 'Employee record not found.'
      };
    }

    if (employee.userId) {
      return {
        valid: false,
        message: 'This employee already has a user account.'
      };
    }

    return {
      valid: true,
      employee: {
        id: employee.id,
        englishName: employee.englishName,
        email: tokenRecord.email
      }
    };
  } catch (error) {
    console.error('[Registration] Error validating token:', error);
    return {
      valid: false,
      message: 'Failed to validate token.'
    };
  }
}

/**
 * Marks a registration token as used
 */
async function markTokenAsUsed(tokenId: number): Promise<void> {
  await db
    .update(registrationTokens)
    .set({ used: true })
    .where(eq(registrationTokens.id, tokenId));
}

/**
 * Cleanup expired tokens (should be run periodically)
 */
export async function cleanupExpiredTokens(): Promise<number> {
  const result = await db
    .delete(registrationTokens)
    .where(gt(new Date(), registrationTokens.expiresAt));
  
  return result.rowCount || 0;
}
