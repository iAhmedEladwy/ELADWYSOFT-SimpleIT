import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import {
  ROLE_IDS,
  getRoleLevel,
  hasPermission as checkRolePermission,
  normalizeRoleId,
  isValidRoleId,
  PERMISSIONS as SHARED_PERMISSIONS,
} from '@shared/roles.config';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: string;
    employeeId?: number;
    managerId?: number;
  };
}

// Re-export for backward compatibility
export const ROLES = {
  SUPER_ADMIN: ROLE_IDS.SUPER_ADMIN,
  ADMIN: ROLE_IDS.ADMIN,
  MANAGER: ROLE_IDS.MANAGER,
  AGENT: ROLE_IDS.AGENT,
  EMPLOYEE: ROLE_IDS.EMPLOYEE,
} as const;

// Legacy permission definitions (keeping for backward compatibility during migration)
export const PERMISSIONS = {
  // Asset permissions
  ASSETS_VIEW_ALL: 'assets:view:all',
  ASSETS_VIEW_OWN: 'assets:view:own',
  ASSETS_VIEW_SUBORDINATES: 'assets:view:subordinates',
  ASSETS_CREATE: 'assets:create',
  ASSETS_UPDATE: 'assets:update',
  ASSETS_DELETE: 'assets:delete',
  ASSETS_ASSIGN: 'assets:assign',

  // User permissions
  USERS_VIEW_ALL: 'users:view:all',
  USERS_VIEW_SUBORDINATES: 'users:view:subordinates',
  USERS_CREATE: 'users:create',
  USERS_UPDATE: 'users:update',
  USERS_DELETE: 'users:delete',

  // Employee permissions
  EMPLOYEES_VIEW_ALL: 'employees:view:all',
  EMPLOYEES_VIEW_SUBORDINATES: 'employees:view:subordinates',
  EMPLOYEES_CREATE: 'employees:create',
  EMPLOYEES_UPDATE: 'employees:update',
  EMPLOYEES_DELETE: 'employees:delete',

  // Ticket permissions
  TICKETS_VIEW_ALL: 'tickets:view:all',
  TICKETS_VIEW_OWN: 'tickets:view:own',
  TICKETS_VIEW_SUBORDINATES: 'tickets:view:subordinates',
  TICKETS_CREATE: 'tickets:create',
  TICKETS_UPDATE: 'tickets:update',
  TICKETS_DELETE: 'tickets:delete',
  TICKETS_ASSIGN: 'tickets:assign',
  TICKETS_CLOSE: 'tickets:close',

  // System permissions (now using shared config)
  SYSTEM_CONFIG: SHARED_PERMISSIONS.SYSTEM_CONFIG,
  SYSTEM_LOGS: SHARED_PERMISSIONS.SYSTEM_LOGS,
  SYSTEM_HEALTH: SHARED_PERMISSIONS.SYSTEM_HEALTH,
  SYSTEM_BACKUP: SHARED_PERMISSIONS.SYSTEM_BACKUP,
  REPORTS_VIEW: 'reports:view',
  AUDIT_LOGS: 'audit:logs',
  
  // Additional shared permissions
  MANAGE_USERS: SHARED_PERMISSIONS.MANAGE_USERS,
  VIEW_USERS: SHARED_PERMISSIONS.VIEW_USERS,
  MANAGE_ASSETS: SHARED_PERMISSIONS.MANAGE_ASSETS,
  VIEW_ASSETS: SHARED_PERMISSIONS.VIEW_ASSETS,
} as const;

// Legacy role-based permission mapping (keeping structure but using centralized config where possible)
export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: [
    // Super Admin has ALL permissions including system logs
    PERMISSIONS.SYSTEM_LOGS,
    PERMISSIONS.SYSTEM_HEALTH,
    PERMISSIONS.SYSTEM_BACKUP,
    PERMISSIONS.SYSTEM_CONFIG,
    PERMISSIONS.ASSETS_VIEW_ALL,
    PERMISSIONS.ASSETS_CREATE,
    PERMISSIONS.ASSETS_UPDATE,
    PERMISSIONS.ASSETS_DELETE,
    PERMISSIONS.ASSETS_ASSIGN,
    PERMISSIONS.USERS_VIEW_ALL,
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_UPDATE,
    PERMISSIONS.USERS_DELETE,
    PERMISSIONS.EMPLOYEES_VIEW_ALL,
    PERMISSIONS.EMPLOYEES_CREATE,
    PERMISSIONS.EMPLOYEES_UPDATE,
    PERMISSIONS.EMPLOYEES_DELETE,
    PERMISSIONS.TICKETS_VIEW_ALL,
    PERMISSIONS.TICKETS_CREATE,
    PERMISSIONS.TICKETS_UPDATE,
    PERMISSIONS.TICKETS_DELETE,
    PERMISSIONS.TICKETS_ASSIGN,
    PERMISSIONS.TICKETS_CLOSE,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.AUDIT_LOGS,
  ],
  [ROLES.ADMIN]: [
    // Full access to everything EXCEPT system logs
    PERMISSIONS.ASSETS_VIEW_ALL,
    PERMISSIONS.ASSETS_CREATE,
    PERMISSIONS.ASSETS_UPDATE,
    PERMISSIONS.ASSETS_DELETE,
    PERMISSIONS.ASSETS_ASSIGN,
    PERMISSIONS.USERS_VIEW_ALL,
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_UPDATE,
    PERMISSIONS.USERS_DELETE,
    PERMISSIONS.EMPLOYEES_VIEW_ALL,
    PERMISSIONS.EMPLOYEES_CREATE,
    PERMISSIONS.EMPLOYEES_UPDATE,
    PERMISSIONS.EMPLOYEES_DELETE,
    PERMISSIONS.TICKETS_VIEW_ALL,
    PERMISSIONS.TICKETS_CREATE,
    PERMISSIONS.TICKETS_UPDATE,
    PERMISSIONS.TICKETS_DELETE,
    PERMISSIONS.TICKETS_ASSIGN,
    PERMISSIONS.TICKETS_CLOSE,
    PERMISSIONS.SYSTEM_CONFIG,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.AUDIT_LOGS
  ],
  [ROLES.MANAGER]: [
    // View all assets, manage subordinates
    PERMISSIONS.ASSETS_VIEW_ALL,
    PERMISSIONS.ASSETS_CREATE,
    PERMISSIONS.ASSETS_UPDATE,
    PERMISSIONS.ASSETS_ASSIGN,
    PERMISSIONS.USERS_VIEW_SUBORDINATES,
    PERMISSIONS.EMPLOYEES_VIEW_SUBORDINATES,
    PERMISSIONS.EMPLOYEES_UPDATE,
    PERMISSIONS.TICKETS_VIEW_ALL,
    PERMISSIONS.TICKETS_CREATE,
    PERMISSIONS.TICKETS_UPDATE,
    PERMISSIONS.TICKETS_DELETE,
    PERMISSIONS.TICKETS_ASSIGN,
    PERMISSIONS.TICKETS_CLOSE,
    PERMISSIONS.REPORTS_VIEW
  ],
  [ROLES.AGENT]: [
    // View all assets, manage all tickets
    PERMISSIONS.ASSETS_VIEW_ALL,
    PERMISSIONS.TICKETS_VIEW_ALL,
    PERMISSIONS.TICKETS_CREATE,
    PERMISSIONS.TICKETS_UPDATE,
    PERMISSIONS.TICKETS_ASSIGN,
    PERMISSIONS.TICKETS_CLOSE
  ],
  [ROLES.EMPLOYEE]: [
    // View only own assets and tickets, create tickets
    PERMISSIONS.ASSETS_VIEW_OWN,
    PERMISSIONS.TICKETS_VIEW_OWN,
    PERMISSIONS.TICKETS_CREATE
  ]
} as const;

/**
 * Check if user has specific permission
 */
export function hasPermission(userRole: string, permission: string): boolean {
  // Use centralized role permission check with normalized role
  const normalized = normalizeRoleId(userRole);
  return checkRolePermission(normalized, permission);
}

/**
 * Check if user can access resource based on ownership or hierarchy
 */
export function canAccessResource(
  userRole: string,
  userId: number,
  resourceOwnerId?: number,
  resourceManagerId?: number
): boolean {
  // Normalize and check role level
  const normalizedRole = normalizeRoleId(userRole);
  
  // Super Admin and Admin can access everything
  if (normalizedRole === ROLES.SUPER_ADMIN || normalizedRole === ROLES.ADMIN) return true;
  
  // Owner can access their own resources
  if (resourceOwnerId === userId) return true;
  
  // Manager can access subordinates' resources
  if (normalizedRole === ROLES.MANAGER && resourceManagerId === userId) return true;
  
  return false;
}

/**
 * Middleware to check authentication
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  next();
}

/**
 * Middleware to check specific permission
 */
export function requirePermission(permission: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!hasPermission(req.user.role, permission)) {
      return res.status(403).json({ 
        message: 'You do not have permission to perform this action',
      });
    }

    next();
  };
}

/**
 * Middleware to check role level
 * Handles both capitalized ('Admin') and lowercase ('admin') role strings from database
 */
export function requireRole(minRole: string) {
  // Use getUserRoleLevel which handles case-insensitive comparison
  const minLevel = getUserRoleLevel({ role: minRole });

  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userLevel = getUserRoleLevel(req.user);

    if (userLevel < minLevel) {
      return res.status(403).json({ 
        message: 'Insufficient role level',
        required: minRole,
        userRole: req.user.role,
        userLevel,
        requiredLevel: minLevel
      });
    }

    next();
  };
}

/**
 * Middleware to attach user info to request
 */
export async function attachUserInfo(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (req.session?.userId) {
    try {
      const user = await storage.getUser(req.session.userId);
      if (user) {
        req.user = {
          id: user.id,
          username: user.username,
          role: user.role || ROLES.EMPLOYEE,

          employeeId: user.employeeId || undefined,
          managerId: user.managerId || undefined
        };
      }
    } catch (error) {
      console.error('Error attaching user info:', error);
    }
  }
  next();
}

/**
 * Filter data based on user permissions
 */
export function filterByPermissions(data: any[], userRole: string, userId: number, field: string = 'id') {
  // Normalize role and check level
  const normalizedRole = normalizeRoleId(userRole);
  
  // Super Admin and Admin can see all data
  if (normalizedRole === ROLES.SUPER_ADMIN || normalizedRole === ROLES.ADMIN) return data;
  
  if (normalizedRole === ROLES.EMPLOYEE) {
    return data.filter(item => item.submittedById === userId || item.assignedToId === userId || item[field] === userId);
  }
  
  // Agent and Manager can see all for now, but could be filtered based on departments/teams
  return data;
}

/**
 * Get subordinate user IDs for managers
 */
export async function getSubordinateIds(managerId: number): Promise<number[]> {
  try {
    const users = await storage.getAllUsers();
    return users
      .filter(user => user.managerId === managerId)
      .map(user => user.id);
  } catch (error) {
    console.error('Error getting subordinates:', error);
    return [];
  }
}

/**
 * Get user's role level for hierarchical checks
 * Now uses centralized role configuration
 */
export function getUserRoleLevel(user: any): number {
  if (!user) return 0;
  
  // Use centralized getRoleLevel function
  if (user.role) {
    return getRoleLevel(user.role);
  }
  
  // Fall back to accessLevel if role is not available
  if (user.accessLevel) {
    const level = typeof user.accessLevel === 'string' ? parseInt(user.accessLevel) : user.accessLevel;
    return level || 0;
  }
  
  return 0;
}

/**
 * Check if user has minimum role level (hierarchical check)
 */
export function hasMinimumRoleLevel(user: any, minLevel: number): boolean {
  return getUserRoleLevel(user) >= minLevel;
}