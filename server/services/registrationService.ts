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
  firstName: string;
  lastName: string;
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
    
    const emailSent = await emailService.sendEmail({
      to: email,
      subject: 'Verify Your Email - SimpleIT Registration',
      html: `
        <h2>Welcome to SimpleIT!</h2>
        <p>Hello ${employee.englishName},</p>
        <p>Click the link below to complete your registration and create your account:</p>
        <p><a href="${verificationLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email & Create Account</a></p>
        <p>Or copy and paste this link into your browser:</p>
        <p>${verificationLink}</p>
        <p>This link will expire in ${TOKEN_EXPIRY_HOURS} hours.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <hr>
        <p style="font-size: 12px; color: #666;">SimpleIT - IT Asset Management System</p>
      `,
      text: `
Welcome to SimpleIT!

Hello ${employee.englishName},

Click the link below to complete your registration and create your account:
${verificationLink}

This link will expire in ${TOKEN_EXPIRY_HOURS} hours.

If you didn't request this, please ignore this email.
      `
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

    // Create user account
    const newUser = await storage.createUser({
      username: verification.username,
      password: verification.password, // Will be hashed in storage.createUser
      email: tokenRecord.email,
      firstName: verification.firstName,
      lastName: verification.lastName,
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
