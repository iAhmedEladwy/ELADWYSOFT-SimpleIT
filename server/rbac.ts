import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: string;
    employeeId?: number;
    managerId?: number;
  };
}

// Role hierarchy and permissions
export const ROLES = {
  ADMIN: 'Admin',
  MANAGER: 'Manager', 
  AGENT: 'Agent',
  EMPLOYEE: 'Employee'
} as const;

// Role hierarchy levels (higher number = higher privilege) 
export const ROLE_HIERARCHY = {
  'admin': 4,
  'manager': 3, 
  'agent': 2,
  'employee': 1
} as const;

// Permission definitions
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

  // System permissions
  SYSTEM_CONFIG: 'system:config',
  REPORTS_VIEW: 'reports:view',
  AUDIT_LOGS: 'audit:logs'
} as const;

// Role-based permission mapping
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    // Full access to everything
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
  const rolePermissions = ROLE_PERMISSIONS[userRole as keyof typeof ROLE_PERMISSIONS];
  return rolePermissions?.includes(permission as any) || false;
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
  // Admin can access everything
  if (userRole === ROLES.ADMIN) return true;
  
  // Owner can access their own resources
  if (resourceOwnerId === userId) return true;
  
  // Manager can access subordinates' resources
  if (userRole === ROLES.MANAGER && resourceManagerId === userId) return true;
  
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
        message: 'Insufficient permissions',
        required: permission,
        userRole: req.user.role 
      });
    }

    next();
  };
}

/**
 * Middleware to check role level
 */
export function requireRole(minRole: string) {
  const roleHierarchy = {
    [ROLES.EMPLOYEE]: 4,
    [ROLES.AGENT]: 3,
    [ROLES.MANAGER]: 2,
    [ROLES.ADMIN]: 1
  };

  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userLevel = roleHierarchy[req.user.role as keyof typeof roleHierarchy] || 5;
    const requiredLevel = roleHierarchy[minRole as keyof typeof roleHierarchy] || 1;

    if (userLevel > requiredLevel) {
      return res.status(403).json({ 
        message: 'Insufficient role level',
        required: minRole,
        userRole: req.user.role 
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
  if (userRole === ROLES.ADMIN) return data;
  
  if (userRole === ROLES.EMPLOYEE) {
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
 */
export function getUserRoleLevel(user: any): number {
  if (!user || !user.role) return 0;
  
  switch (user.role.toLowerCase()) {
    case 'admin': return 4;
    case 'manager': return 3;
    case 'agent': return 2;
    case 'employee': return 1;
    default: return 0;
  }
}

/**
 * Check if user has minimum role level (hierarchical check)
 */
export function hasMinimumRoleLevel(user: any, minLevel: number): boolean {
  return getUserRoleLevel(user) >= minLevel;
}