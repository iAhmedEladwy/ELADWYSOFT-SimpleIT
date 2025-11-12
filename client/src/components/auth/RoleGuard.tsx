import { useAuth } from "@/lib/authContext";
import { ReactNode } from "react";
import { normalizeRoleId, getRoleLevel, ROLE_IDS } from "@shared/roles.config";

interface RoleGuardProps {
  allowedRoles: string[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGuard({ allowedRoles, children, fallback = null }: RoleGuardProps) {
  const { user } = useAuth();
  
  if (!user || !user.role) {
    return <>{fallback}</>;
  }
  
  // Normalize both user role and allowed roles for comparison
  const normalizedUserRole = normalizeRoleId(user.role);
  const normalizedAllowedRoles = allowedRoles.map(role => normalizeRoleId(role));
  
  if (!normalizedAllowedRoles.includes(normalizedUserRole)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

// Helper function to check if user has permission (uses centralized role normalization)
export function hasPermission(userRole: string | undefined, requiredRoles: string[]): boolean {
  if (!userRole) return false;
  
  // Use centralized normalization for consistent comparison
  const normalizedUserRole = normalizeRoleId(userRole);
  const normalizedRequiredRoles = requiredRoles.map(role => normalizeRoleId(role));
  
  return normalizedRequiredRoles.includes(normalizedUserRole);
}

// Helper function to check if user can access a resource based on hierarchy
export function canAccessResource(userRole: string | undefined, userEmployeeId: number | undefined, resourceOwnerId: number | undefined): boolean {
  if (!userRole) return false;
  
  // Use centralized role normalization and level checking
  const normalizedRole = normalizeRoleId(userRole);
  const roleLevel = getRoleLevel(normalizedRole);
  
  // Super Admin (5) and Admin (4) can access everything
  if (roleLevel >= 4) return true;
  
  // Manager (3) can access their subordinates' resources
  if (normalizedRole === ROLE_IDS.MANAGER) return true; // Manager access handled by backend filtering
  
  // Agent (2) can access all resources
  if (normalizedRole === ROLE_IDS.AGENT) return true;
  
  // Employee (1) can only access their own resources
  if (normalizedRole === ROLE_IDS.EMPLOYEE) {
    return userEmployeeId === resourceOwnerId;
  }
  
  return false;
}