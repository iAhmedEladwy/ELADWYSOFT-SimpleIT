/**
 * Centralized Notification Middleware
 * 
 * This module provides unified notification handlers for all entity types.
 * Instead of duplicating notification logic across routes, call these helpers
 * to ensure consistent notification behavior system-wide.
 */

import * as notificationService from '../services/notificationService';
import type * as schema from '@shared/schema';
import type { Storage } from '../storage';

// Note: storage must be passed as parameter to avoid circular dependencies

/**
 * Handle all ticket-related notifications
 * Covers: assignment changes, status changes, urgent tickets
 */
export async function handleTicketNotifications(
  storage: Storage,
  params: {
    operation: 'create' | 'update';
    newTicket: any; // Using any to handle both Drizzle and raw SQL results
    oldTicket?: any;
    performedBy?: { id: number; username: string };
  }
) {
  const { operation, newTicket, oldTicket, performedBy } = params;
  
  try {
    // Extract values handling both camelCase and snake_case
    const ticketIdString = newTicket.ticketId || newTicket.ticket_id || `#${newTicket.id}`;
    const newAssignedId = newTicket.assignedToId || newTicket.assigned_to_id;
    const oldAssignedId = oldTicket?.assignedToId || oldTicket?.assigned_to_id;
    const newStatus = newTicket.status;
    const oldStatus = oldTicket?.status;
    const submittedById = newTicket.submittedById || newTicket.submitted_by_id;
    const priority = newTicket.priority || 'Medium';

    // ASSIGNMENT CHANGED (newly assigned or re-assigned)
    if (newAssignedId && newAssignedId !== oldAssignedId) {
      const isUrgent = ['Critical', 'High', 'Urgent'].includes(priority);

      if (isUrgent) {
        await notificationService.notifyUrgentTicket({
          ticketId: ticketIdString,
          assignedToUserId: newAssignedId,
          ticketTitle: newTicket.title || 'Support Ticket',
          priority,
          entityId: newTicket.id,
        });
      } else {
        await notificationService.notifyTicketAssignment({
          ticketId: ticketIdString,
          assignedToUserId: newAssignedId,
          ticketTitle: newTicket.title || 'Support Ticket',
          assignedByUsername: performedBy?.username,
          entityId: newTicket.id,
        });
      }

      console.log(`[Notifications] ✓ Ticket ${ticketIdString} assignment notification sent to user ${newAssignedId}`);
    }

    // STATUS CHANGED (only for updates)
    if (operation === 'update' && oldStatus && newStatus !== oldStatus) {
      // Notify submitter
      if (submittedById) {
        const employee = await storage.getEmployee(submittedById);
        if (employee?.userId) {
          await notificationService.notifyTicketStatusChange({
            ticketId: ticketIdString,
            userId: employee.userId,
            oldStatus,
            newStatus,
            ticketTitle: newTicket.title || 'Support Ticket',
            entityId: newTicket.id,
          });
          console.log(`[Notifications] ✓ Ticket ${ticketIdString} status change notification sent to submitter`);
        }
      }

      // Also notify assigned user if different from submitter
      if (newAssignedId && newAssignedId !== submittedById) {
        await notificationService.notifyTicketStatusChange({
          ticketId: ticketIdString,
          userId: newAssignedId,
          oldStatus,
          newStatus,
          ticketTitle: newTicket.title || 'Support Ticket',
          entityId: newTicket.id,
        });
        console.log(`[Notifications] ✓ Ticket ${ticketIdString} status change notification sent to assignee`);
      }
    }
  } catch (error) {
    console.error('[Notifications] Failed to send ticket notification:', error);
    // Don't throw - notifications shouldn't break main operations
  }
}

/**
 * Handle all asset-related notifications
 * Covers: assignment, check-out, check-in
 */
export async function handleAssetNotifications(params: {
  operation: 'create' | 'update' | 'check-out' | 'check-in';
  newAsset: any;
  oldAsset?: any;
  performedBy?: { id: number; username: string };
}) {
  const { operation, newAsset, oldAsset, performedBy } = params;
  
  try {
    const newEmployeeId = newAsset.assignedEmployeeId || newAsset.assigned_employee_id;
    const oldEmployeeId = oldAsset?.assignedEmployeeId || oldAsset?.assigned_employee_id;
    const assetIdString = newAsset.assetId || newAsset.asset_id || `Asset #${newAsset.id}`;

    // ASSET ASSIGNED (assignment changed)
    if (newEmployeeId && newEmployeeId !== oldEmployeeId) {
      const employee = await storage.getEmployee(newEmployeeId);
      if (employee?.userId) {
        await notificationService.notifyAssetAssignment({
          assetId: newAsset.id,
          employeeId: newEmployeeId,
          userId: employee.userId,
          assetName: newAsset.name,
          assetTag: assetIdString,
        });
        console.log(`[Notifications] ✓ Asset ${assetIdString} assignment notification sent`);
      }
    }

    // TRANSACTION (Check-out/Check-in)
    if ((operation === 'check-out' || operation === 'check-in') && newEmployeeId) {
      const employee = await storage.getEmployee(newEmployeeId);
      if (employee?.userId) {
        await notificationService.notifyAssetTransaction({
          assetId: newAsset.id,
          userId: employee.userId,
          assetName: newAsset.name,
          transactionType: operation === 'check-out' ? 'assigned' : 'returned',
          performedBy: performedBy?.username,
        });
        console.log(`[Notifications] ✓ Asset ${assetIdString} ${operation} notification sent`);
      }
    }
  } catch (error) {
    console.error('[Notifications] Failed to send asset notification:', error);
  }
}

/**
 * Handle all maintenance-related notifications
 * Covers: scheduled, completed
 */
export async function handleMaintenanceNotifications(params: {
  operation: 'schedule' | 'complete';
  maintenance: any;
  asset?: any;
}) {
  const { operation, maintenance, asset } = params;
  
  try {
    // Get asset if not provided
    const assetData = asset || await storage.getAsset(maintenance.assetId || maintenance.asset_id);
    if (!assetData) {
      console.log('[Notifications] Asset not found for maintenance notification');
      return;
    }

    const employeeId = assetData.assignedEmployeeId || assetData.assigned_employee_id;
    if (!employeeId) {
      console.log('[Notifications] No employee assigned to asset for maintenance notification');
      return;
    }

    const employee = await storage.getEmployee(employeeId);
    if (!employee?.userId) {
      console.log('[Notifications] Employee user not found for maintenance notification');
      return;
    }

    if (operation === 'schedule') {
      await notificationService.notifyMaintenanceScheduled({
        maintenanceId: maintenance.id,
        userId: employee.userId,
        assetName: assetData.name,
        scheduledDate: maintenance.scheduledDate || maintenance.scheduled_date,
      });
      console.log(`[Notifications] ✓ Maintenance scheduled notification sent for ${assetData.name}`);
    } else if (operation === 'complete') {
      await notificationService.notifyMaintenanceCompleted({
        maintenanceId: maintenance.id,
        userId: employee.userId,
        assetName: assetData.name,
      });
      console.log(`[Notifications] ✓ Maintenance completed notification sent for ${assetData.name}`);
    }
  } catch (error) {
    console.error('[Notifications] Failed to send maintenance notification:', error);
  }
}

/**
 * Handle all upgrade-related notifications
 * Covers: request, approval, rejection
 */
export async function handleUpgradeNotifications(params: {
  operation: 'request' | 'decision';
  upgrade: any;
  decision?: 'approved' | 'rejected';
  asset?: any;
}) {
  const { operation, upgrade, decision, asset } = params;
  
  try {
    const createdById = upgrade.createdById || upgrade.created_by_id;
    const assetId = upgrade.assetId || upgrade.asset_id;

    if (operation === 'request') {
      // Notify managers/admins about new upgrade request
      await notificationService.notifyUpgradeRequest({
        upgradeId: upgrade.id,
        assetId,
        requestedBy: createdById,
      });
      console.log(`[Notifications] ✓ Upgrade request notification sent to managers`);
    } else if (operation === 'decision' && decision) {
      // Notify requester about decision
      const employee = await storage.getEmployee(createdById);
      if (employee?.userId) {
        const assetData = asset || await storage.getAsset(assetId);
        await notificationService.notifyUpgradeDecision({
          upgradeId: upgrade.id,
          userId: employee.userId,
          decision,
          assetName: assetData?.name || 'Asset',
        });
        console.log(`[Notifications] ✓ Upgrade ${decision} notification sent to requester`);
      }
    }
  } catch (error) {
    console.error('[Notifications] Failed to send upgrade notification:', error);
  }
}

/**
 * Handle all employee-related notifications
 * Covers: onboarding, offboarding
 */
export async function handleEmployeeNotifications(params: {
  operation: 'onboard' | 'offboard';
  employee: any;
}) {
  const { operation, employee } = params;
  
  try {
    const employeeName = employee.englishName || employee.english_name || 'Employee';

    if (operation === 'onboard') {
      await notificationService.notifyEmployeeOnboarding({
        employeeId: employee.id,
        employeeName,
      });
      console.log(`[Notifications] ✓ Employee onboarding notification sent for ${employeeName}`);
    } else if (operation === 'offboard') {
      await notificationService.notifyEmployeeOffboarding({
        employeeId: employee.id,
        employeeName,
      });
      console.log(`[Notifications] ✓ Employee offboarding notification sent for ${employeeName}`);
    }
  } catch (error) {
    console.error('[Notifications] Failed to send employee notification:', error);
  }
}
