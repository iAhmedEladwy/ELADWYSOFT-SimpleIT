/**
 * Notification Service
 * Centralized service for creating and managing notifications
 * This replaces client-side "smart" notification generation
 */

import { db } from '../db';
import * as schema from '@shared/schema';
import { createNotification } from '../routes/notifications';
import { eq, and, gte, sql } from 'drizzle-orm';

export interface NotificationTemplate {
  userId: number;
  title: string;
  message: string;
  type: 'Asset' | 'Ticket' | 'System' | 'Employee';
  entityId?: number;
}

/**
 * Create a notification for ticket assignment
 */
export async function notifyTicketAssignment(params: {
  ticketId: string | number;  // Accept ticket ID string (TKT-000008) or database ID
  assignedToUserId: number;
  ticketTitle: string;
  assignedByUsername?: string;
  entityId?: number;  // Optional: database ID for linking
}) {
  const { ticketId, assignedToUserId, ticketTitle, assignedByUsername, entityId } = params;
  
  const message = assignedByUsername 
    ? `${assignedByUsername} assigned you ticket ${ticketId}: ${ticketTitle}`
    : `You have been assigned ticket ${ticketId}: ${ticketTitle}`;

  return createNotification({
    userId: assignedToUserId,
    title: `Ticket ${ticketId} Assigned to You`,
    message,
    type: 'Ticket',
    entityId: entityId || (typeof ticketId === 'number' ? ticketId : undefined),
  });
}

/**
 * Create a notification for ticket status change
 */
export async function notifyTicketStatusChange(params: {
  ticketId: number;
  userId: number;
  oldStatus: string;
  newStatus: string;
  ticketTitle: string;
}) {
  const { ticketId, userId, oldStatus, newStatus, ticketTitle } = params;

  return createNotification({
    userId,
    title: `Ticket #${ticketId} Status Updated`,
    message: `Ticket "${ticketTitle}" status changed from ${oldStatus} to ${newStatus}`,
    type: 'Ticket',
    entityId: ticketId,
  });
}

/**
 * Create a notification for urgent ticket assignment
 */
export async function notifyUrgentTicket(params: {
  ticketId: string | number;  // Accept ticket ID string (TKT-000008) or database ID
  assignedToUserId: number;
  ticketTitle: string;
  priority: string;
  entityId?: number;  // Optional: database ID for linking
}) {
  const { ticketId, assignedToUserId, ticketTitle, priority, entityId } = params;

  return createNotification({
    userId: assignedToUserId,
    title: `🚨 Urgent: Ticket ${ticketId} Assigned`,
    message: `HIGH PRIORITY (${priority}): ${ticketTitle} - Please address immediately`,
    type: 'Ticket',
    entityId: entityId || (typeof ticketId === 'number' ? ticketId : undefined),
  });
}

/**
 * Create a notification for asset assignment
 */
export async function notifyAssetAssignment(params: {
  assetId: number;
  employeeId: number;
  userId: number;
  assetName: string;
  assetTag?: string;
}) {
  const { assetId, userId, assetName, assetTag } = params;

  const displayName = assetTag ? `${assetName} (${assetTag})` : assetName;

  return createNotification({
    userId,
    title: 'New Asset Assigned to You',
    message: `Asset "${displayName}" has been assigned to you`,
    type: 'Asset',
    entityId: assetId,
  });
}

/**
 * Create a notification for asset return/checkout
 */
export async function notifyAssetTransaction(params: {
  assetId: number;
  userId: number;
  assetName: string;
  transactionType: 'Check-Out' | 'Check-In';
}) {
  const { assetId, userId, assetName, transactionType } = params;

  const action = transactionType === 'Check-Out' ? 'checked out to you' : 'returned';

  return createNotification({
    userId,
    title: `Asset ${transactionType}`,
    message: `Asset "${assetName}" has been ${action}`,
    type: 'Asset',
    entityId: assetId,
  });
}

/**
 * Create a notification for scheduled maintenance
 */
export async function notifyMaintenanceScheduled(params: {
  assetId: number;
  userId: number;
  assetName: string;
  maintenanceDate: Date;
  maintenanceType: string;
}) {
  const { assetId, userId, assetName, maintenanceDate, maintenanceType } = params;

  const dateStr = maintenanceDate.toLocaleDateString();

  return createNotification({
    userId,
    title: 'Maintenance Scheduled on Your Asset',
    message: `${maintenanceType} maintenance scheduled for "${assetName}" on ${dateStr}`,
    type: 'Asset',
    entityId: assetId,
  });
}

/**
 * Create a notification for completed maintenance
 */
export async function notifyMaintenanceCompleted(params: {
  assetId: number;
  userId: number;
  assetName: string;
  maintenanceType: string;
}) {
  const { assetId, userId, assetName, maintenanceType } = params;

  return createNotification({
    userId,
    title: 'Maintenance Completed',
    message: `${maintenanceType} maintenance completed for your asset "${assetName}"`,
    type: 'Asset',
    entityId: assetId,
  });
}

/**
 * Create a notification for upgrade request
 */
export async function notifyUpgradeRequest(params: {
  upgradeId: number;
  managerId: number;
  assetName: string;
  requestedBy: string;
  upgradeCost?: number;
}) {
  const { upgradeId, managerId, assetName, requestedBy, upgradeCost } = params;

  const costStr = upgradeCost ? ` (Est. Cost: $${upgradeCost.toFixed(2)})` : '';

  return createNotification({
    userId: managerId,
    title: 'Asset Upgrade Request Pending Approval',
    message: `${requestedBy} requested an upgrade for "${assetName}"${costStr}`,
    type: 'Asset',
    entityId: upgradeId,
  });
}

/**
 * Create a notification for upgrade approval/rejection
 */
export async function notifyUpgradeDecision(params: {
  upgradeId: number;
  requesterId: number;
  assetName: string;
  approved: boolean;
  approvedBy: string;
}) {
  const { upgradeId, requesterId, assetName, approved, approvedBy } = params;

  const decision = approved ? 'approved' : 'rejected';
  const emoji = approved ? '✅' : '❌';

  return createNotification({
    userId: requesterId,
    title: `${emoji} Upgrade Request ${approved ? 'Approved' : 'Rejected'}`,
    message: `Your upgrade request for "${assetName}" was ${decision} by ${approvedBy}`,
    type: 'Asset',
    entityId: upgradeId,
  });
}

/**
 * Create a notification for new employee onboarding
 */
export async function notifyEmployeeOnboarding(params: {
  employeeId: number;
  userId: number;
  employeeName: string;
  department: string;
  startDate: Date;
}) {
  const { employeeId, userId, employeeName, department, startDate } = params;

  const dateStr = startDate.toLocaleDateString();

  return createNotification({
    userId,
    title: 'New Employee Onboarding',
    message: `${employeeName} joining ${department} on ${dateStr}. Please prepare onboarding checklist.`,
    type: 'Employee',
    entityId: employeeId,
  });
}

/**
 * Create a notification for employee offboarding
 */
export async function notifyEmployeeOffboarding(params: {
  employeeId: number;
  userId: number;
  employeeName: string;
  lastDay: Date;
}) {
  const { employeeId, userId, employeeName, lastDay } = params;

  const dateStr = lastDay.toLocaleDateString();

  return createNotification({
    userId,
    title: 'Employee Offboarding Required',
    message: `${employeeName} leaving on ${dateStr}. Please initiate asset recovery and offboarding process.`,
    type: 'Employee',
    entityId: employeeId,
  });
}

/**
 * Create system notification (version updates, maintenance windows, etc.)
 */
export async function notifySystem(params: {
  userIds: number[];
  title: string;
  message: string;
}) {
  const { userIds, title, message } = params;

  const notifications = userIds.map(userId =>
    createNotification({
      userId,
      title,
      message,
      type: 'System',
    })
  );

  return Promise.all(notifications);
}

/**
 * Bulk notify all users with a specific role
 */
export async function notifyByRole(params: {
  role: string;
  title: string;
  message: string;
  type: 'Asset' | 'Ticket' | 'System' | 'Employee';
  entityId?: number;
}) {
  const { role, title, message, type, entityId } = params;

  // Get all users with the specified role
  const users = await db.select()
    .from(schema.users)
    .where(eq(schema.users.role, role));

  const notifications = users.map(user =>
    createNotification({
      userId: user.id,
      title,
      message,
      type,
      entityId,
    })
  );

  return Promise.all(notifications);
}

/**
 * Clean up old read notifications (retention policy)
 * Run this as a scheduled job
 */
export async function cleanupOldNotifications(retentionDays: number = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  await db.delete(schema.notifications)
    .where(
      and(
        eq(schema.notifications.isRead, true),
        sql`${schema.notifications.createdAt} < ${cutoffDate}`
      )
    );
}
