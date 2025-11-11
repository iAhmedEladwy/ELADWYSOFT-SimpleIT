/**
 * Centralized Role Configuration
 * Single source of truth for all role definitions, permissions, and helpers
 * Used by both frontend and backend for consistency
 */

// ============================================================================
// Role Definitions
// ============================================================================

export const ROLE_IDS = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  AGENT: 'agent',
  EMPLOYEE: 'employee',
} as const;

export const ROLE_LEVELS = {
  [ROLE_IDS.SUPER_ADMIN]: 5,
  [ROLE_IDS.ADMIN]: 4,
  [ROLE_IDS.MANAGER]: 3,
  [ROLE_IDS.AGENT]: 2,
  [ROLE_IDS.EMPLOYEE]: 1,
} as const;

export const ROLE_DISPLAY_NAMES = {
  [ROLE_IDS.SUPER_ADMIN]: {
    en: 'Super Admin',
    ar: 'مسؤول عام',
  },
  [ROLE_IDS.ADMIN]: {
    en: 'Admin',
    ar: 'مشرف',
  },
  [ROLE_IDS.MANAGER]: {
    en: 'Manager',
    ar: 'مدير',
  },
  [ROLE_IDS.AGENT]: {
    en: 'Agent',
    ar: 'وكيل',
  },
  [ROLE_IDS.EMPLOYEE]: {
    en: 'Employee',
    ar: 'موظف',
  },
} as const;

// ============================================================================
// Permission Definitions
// ============================================================================

export const PERMISSIONS = {
  // System Administration
  SYSTEM_LOGS: 'system_logs',
  SYSTEM_HEALTH: 'system_health',
  SYSTEM_BACKUP: 'system_backup',
  SYSTEM_CONFIG: 'system_config',
  
  // User Management
  MANAGE_USERS: 'manage_users',
  VIEW_USERS: 'view_users',
  EDIT_USER_ROLES: 'edit_user_roles',
  
  // Asset Management
  MANAGE_ASSETS: 'manage_assets',
  VIEW_ASSETS: 'view_assets',
  ASSIGN_ASSETS: 'assign_assets',
  DELETE_ASSETS: 'delete_assets',
  
  // Employee Management
  MANAGE_EMPLOYEES: 'manage_employees',
  VIEW_EMPLOYEES: 'view_employees',
  
  // Ticket Management
  MANAGE_TICKETS: 'manage_tickets',
  VIEW_TICKETS: 'view_tickets',
  ASSIGN_TICKETS: 'assign_tickets',
  
  // Reports
  VIEW_REPORTS: 'view_reports',
  EXPORT_DATA: 'export_data',
  
  // Maintenance
  SCHEDULE_MAINTENANCE: 'schedule_maintenance',
  VIEW_MAINTENANCE: 'view_maintenance',
  
  // Audit Logs
  VIEW_AUDIT_LOGS: 'view_audit_logs',
  
  // Notifications
  MANAGE_NOTIFICATIONS: 'manage_notifications',
} as const;

// ============================================================================
// Role-Permission Mapping
// ============================================================================

export const ROLE_PERMISSIONS: Record<string, readonly string[]> = {
  [ROLE_IDS.SUPER_ADMIN]: [
    // System (exclusive to super admin)
    PERMISSIONS.SYSTEM_LOGS,
    PERMISSIONS.SYSTEM_HEALTH,
    PERMISSIONS.SYSTEM_BACKUP,
    PERMISSIONS.SYSTEM_CONFIG,
    
    // All other permissions
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.EDIT_USER_ROLES,
    PERMISSIONS.MANAGE_ASSETS,
    PERMISSIONS.VIEW_ASSETS,
    PERMISSIONS.ASSIGN_ASSETS,
    PERMISSIONS.DELETE_ASSETS,
    PERMISSIONS.MANAGE_EMPLOYEES,
    PERMISSIONS.VIEW_EMPLOYEES,
    PERMISSIONS.MANAGE_TICKETS,
    PERMISSIONS.VIEW_TICKETS,
    PERMISSIONS.ASSIGN_TICKETS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.EXPORT_DATA,
    PERMISSIONS.SCHEDULE_MAINTENANCE,
    PERMISSIONS.VIEW_MAINTENANCE,
    PERMISSIONS.VIEW_AUDIT_LOGS,
    PERMISSIONS.MANAGE_NOTIFICATIONS,
  ],
  
  [ROLE_IDS.ADMIN]: [
    // System (shared with super admin, except SYSTEM_LOGS)
    PERMISSIONS.SYSTEM_HEALTH,
    PERMISSIONS.SYSTEM_BACKUP,
    PERMISSIONS.SYSTEM_CONFIG,
    
    // User Management
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.EDIT_USER_ROLES,
    
    // Asset Management
    PERMISSIONS.MANAGE_ASSETS,
    PERMISSIONS.VIEW_ASSETS,
    PERMISSIONS.ASSIGN_ASSETS,
    PERMISSIONS.DELETE_ASSETS,
    
    // Employee Management
    PERMISSIONS.MANAGE_EMPLOYEES,
    PERMISSIONS.VIEW_EMPLOYEES,
    
    // Ticket Management
    PERMISSIONS.MANAGE_TICKETS,
    PERMISSIONS.VIEW_TICKETS,
    PERMISSIONS.ASSIGN_TICKETS,
    
    // Reports
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.EXPORT_DATA,
    
    // Maintenance
    PERMISSIONS.SCHEDULE_MAINTENANCE,
    PERMISSIONS.VIEW_MAINTENANCE,
    
    // Audit
    PERMISSIONS.VIEW_AUDIT_LOGS,
    PERMISSIONS.MANAGE_NOTIFICATIONS,
  ],
  
  [ROLE_IDS.MANAGER]: [
    // User Management
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_USERS,
    
    // Asset Management
    PERMISSIONS.MANAGE_ASSETS,
    PERMISSIONS.VIEW_ASSETS,
    PERMISSIONS.ASSIGN_ASSETS,
    PERMISSIONS.DELETE_ASSETS,
    
    // Employee Management
    PERMISSIONS.MANAGE_EMPLOYEES,
    PERMISSIONS.VIEW_EMPLOYEES,
    
    // Ticket Management
    PERMISSIONS.MANAGE_TICKETS,
    PERMISSIONS.VIEW_TICKETS,
    PERMISSIONS.ASSIGN_TICKETS,
    
    // Reports
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.EXPORT_DATA,
    
    // Maintenance
    PERMISSIONS.SCHEDULE_MAINTENANCE,
    PERMISSIONS.VIEW_MAINTENANCE,
    
    // Audit
    PERMISSIONS.VIEW_AUDIT_LOGS,
    PERMISSIONS.MANAGE_NOTIFICATIONS,
  ],
  
  [ROLE_IDS.AGENT]: [
    // Asset Management
    PERMISSIONS.VIEW_ASSETS,
    PERMISSIONS.ASSIGN_ASSETS,
    
    // Employee Management
    PERMISSIONS.VIEW_EMPLOYEES,
    
    // Ticket Management
    PERMISSIONS.MANAGE_TICKETS,
    PERMISSIONS.VIEW_TICKETS,
    PERMISSIONS.ASSIGN_TICKETS,
    
    // Reports
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.EXPORT_DATA,
    
    // Maintenance
    PERMISSIONS.SCHEDULE_MAINTENANCE,
    PERMISSIONS.VIEW_MAINTENANCE,
    
    // Audit
    PERMISSIONS.VIEW_AUDIT_LOGS,
  ],
  
  [ROLE_IDS.EMPLOYEE]: [
    // Basic viewing
    PERMISSIONS.VIEW_ASSETS,
    PERMISSIONS.VIEW_TICKETS,
    PERMISSIONS.VIEW_MAINTENANCE,
  ],
} as const;

// ============================================================================
// TypeScript Types
// ============================================================================

export type RoleId = typeof ROLE_IDS[keyof typeof ROLE_IDS];
export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];
export type RoleLevel = typeof ROLE_LEVELS[keyof typeof ROLE_LEVELS];

export interface RoleConfig {
  id: RoleId;
  level: RoleLevel;
  displayName: {
    en: string;
    ar: string;
  };
  permissions: readonly Permission[];
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get role level by role ID
 */
export function getRoleLevel(roleId: string): number {
  const normalizedRole = normalizeRoleId(roleId);
  return ROLE_LEVELS[normalizedRole as RoleId] || 0;
}

/**
 * Get display name for a role
 */
export function getRoleDisplayName(roleId: string, language: 'en' | 'ar' = 'en'): string {
  const normalizedRole = normalizeRoleId(roleId);
  return ROLE_DISPLAY_NAMES[normalizedRole as RoleId]?.[language] || roleId;
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(roleId: string): readonly string[] {
  const normalizedRole = normalizeRoleId(roleId);
  return ROLE_PERMISSIONS[normalizedRole] || [];
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(roleId: string, permission: string): boolean {
  const permissions = getRolePermissions(roleId);
  return permissions.includes(permission);
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(roleId: string, permissions: string[]): boolean {
  return permissions.some(permission => hasPermission(roleId, permission));
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(roleId: string, permissions: string[]): boolean {
  return permissions.every(permission => hasPermission(roleId, permission));
}

/**
 * Check if roleA has higher or equal level than roleB
 */
export function hasHigherOrEqualRole(roleA: string, roleB: string): boolean {
  return getRoleLevel(roleA) >= getRoleLevel(roleB);
}

/**
 * Check if roleA has strictly higher level than roleB
 */
export function hasHigherRole(roleA: string, roleB: string): boolean {
  return getRoleLevel(roleA) > getRoleLevel(roleB);
}

/**
 * Normalize role ID to standard format (lowercase with underscore)
 */
export function normalizeRoleId(roleId: string): string {
  if (!roleId) return '';
  
  // Convert to lowercase and replace spaces/hyphens with underscores
  return roleId
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, '_');
}

/**
 * Get all available roles
 */
export function getAllRoles(): RoleConfig[] {
  return Object.values(ROLE_IDS).map(roleId => ({
    id: roleId,
    level: ROLE_LEVELS[roleId],
    displayName: ROLE_DISPLAY_NAMES[roleId],
    permissions: ROLE_PERMISSIONS[roleId] as readonly Permission[],
  }));
}

/**
 * Get roles sorted by level (highest to lowest)
 */
export function getRolesByLevel(): RoleConfig[] {
  return getAllRoles().sort((a, b) => b.level - a.level);
}

/**
 * Get roles accessible by a given role (same level or lower)
 */
export function getAccessibleRoles(roleId: string): RoleConfig[] {
  const currentLevel = getRoleLevel(roleId);
  return getAllRoles().filter(role => role.level <= currentLevel);
}

/**
 * Get minimum required role for a permission
 */
export function getMinimumRoleForPermission(permission: string): RoleId | null {
  const roles = getRolesByLevel();
  
  // Find the lowest-level role that has this permission
  for (let i = roles.length - 1; i >= 0; i--) {
    if (roles[i].permissions.includes(permission as Permission)) {
      return roles[i].id;
    }
  }
  
  return null;
}

/**
 * Check if a role ID is valid
 */
export function isValidRoleId(roleId: string): boolean {
  const normalizedRole = normalizeRoleId(roleId);
  return Object.values(ROLE_IDS).includes(normalizedRole as RoleId);
}

/**
 * Get role ID from display name
 */
export function getRoleIdFromDisplayName(displayName: string): RoleId | null {
  const normalized = normalizeRoleId(displayName);
  
  // Check if it's already a valid role ID
  if (isValidRoleId(normalized)) {
    return normalized as RoleId;
  }
  
  // Search in display names
  for (const [roleId, names] of Object.entries(ROLE_DISPLAY_NAMES)) {
    if (names.en.toLowerCase() === displayName.toLowerCase() || 
        names.ar === displayName) {
      return roleId as RoleId;
    }
  }
  
  return null;
}

// ============================================================================
// Constants Export
// ============================================================================

/**
 * Legacy ROLES object for backward compatibility
 * @deprecated Use ROLE_IDS instead
 */
export const ROLES = ROLE_IDS;

/**
 * All role IDs as an array
 */
export const ALL_ROLE_IDS = Object.values(ROLE_IDS);

/**
 * All permissions as an array
 */
export const ALL_PERMISSIONS = Object.values(PERMISSIONS);

// ============================================================================
// Default Export
// ============================================================================

export default {
  ROLE_IDS,
  ROLE_LEVELS,
  ROLE_DISPLAY_NAMES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  getRoleLevel,
  getRoleDisplayName,
  getRolePermissions,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasHigherOrEqualRole,
  hasHigherRole,
  normalizeRoleId,
  getAllRoles,
  getRolesByLevel,
  getAccessibleRoles,
  getMinimumRoleForPermission,
  isValidRoleId,
  getRoleIdFromDisplayName,
};
