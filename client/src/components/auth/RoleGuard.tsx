import { useAuth } from "@/lib/authContext";
import { ReactNode } from "react";

interface RoleGuardProps {
  allowedRoles: string[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGuard({ allowedRoles, children, fallback = null }: RoleGuardProps) {
  const { user } = useAuth();
  
  if (!user || !allowedRoles.includes(user.role)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

// Helper function to check if user has permission
export function hasPermission(userRole: string | undefined, requiredRoles: string[]): boolean {
  if (!userRole) return false;
  return requiredRoles.includes(userRole);
}

// Helper function to check if user can access a resource based on hierarchy
export function canAccessResource(userRole: string | undefined, userEmployeeId: number | undefined, resourceOwnerId: number | undefined): boolean {
  if (!userRole) return false;
  
  // Admin can access everything
  if (userRole === 'admin') return true;
  
  // Manager can access their subordinates' resources
  if (userRole === 'manager') return true; // Manager access handled by backend filtering
  
  // Agent can access all resources
  if (userRole === 'agent') return true;
  
  // Employee can only access their own resources
  if (userRole === 'employee') {
    return userEmployeeId === resourceOwnerId;
  }
  
  return false;
}