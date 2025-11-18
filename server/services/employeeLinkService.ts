/**
 * Employee Auto-Linking Service
 * 
 * Automatically links user accounts to employee records based on email matching.
 * Implements email-based auto-linking with fallback to manual selection UI.
 */

import type { User, Employee } from '@shared/schema';
import { storage } from '../storage';

export interface AutoLinkResult {
  success: boolean;
  employee?: Employee;
  method?: 'corporate_email' | 'personal_email' | 'manual';
  message?: string;
}

/**
 * Attempts to auto-link a user to an employee record based on email matching
 * @param user - The authenticated user
 * @returns AutoLinkResult indicating success or failure
 */
export async function autoLinkEmployeeToUser(user: User): Promise<AutoLinkResult> {
  try {
    // Skip if user already has an employee link
    if (user.id) {
      const employees = await storage.getAllEmployees();
      const existingLink = employees.find(emp => emp.userId === user.id);
      if (existingLink) {
        return {
          success: true,
          employee: existingLink,
          method: 'manual',
          message: 'User already linked to employee'
        };
      }
    }

    // Try to find employee by email
    const employee = await storage.getEmployeeByEmail(user.email);
    
    if (!employee) {
      return {
        success: false,
        message: 'No employee record found with matching email'
      };
    }

    // Check if employee is already linked to another user
    if (employee.userId && employee.userId !== user.id) {
      return {
        success: false,
        message: 'Employee is already linked to another user account'
      };
    }

    // Link employee to user
    const method = employee.corporateEmail === user.email ? 'corporate_email' : 'personal_email';
    await storage.updateEmployee(employee.id, { userId: user.id });

    console.log(`[Auto-Link] Successfully linked user ${user.id} (${user.email}) to employee ${employee.id} (${employee.englishName}) via ${method}`);

    return {
      success: true,
      employee: { ...employee, userId: user.id },
      method,
      message: `Auto-linked via ${method === 'corporate_email' ? 'corporate' : 'personal'} email`
    };
  } catch (error) {
    console.error('[Auto-Link] Error during auto-linking:', error);
    return {
      success: false,
      message: `Auto-link failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Checks if a user needs employee linking
 * @param userId - The user ID to check
 * @returns boolean indicating if linking is needed
 */
export async function needsEmployeeLink(userId: number): Promise<boolean> {
  try {
    const employees = await storage.getAllEmployees();
    const linkedEmployee = employees.find(emp => emp.userId === userId);
    return !linkedEmployee;
  } catch (error) {
    console.error('[Auto-Link] Error checking employee link:', error);
    return true; // Assume linking needed on error
  }
}
