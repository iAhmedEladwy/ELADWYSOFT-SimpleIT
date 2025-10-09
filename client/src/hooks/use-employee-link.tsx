/**
 * Employee Link Hook - Employee Portal
 * 
 * Context: SimpleIT v0.4.5 - Hook to manage employee-user relationship
 * 
 * Features:
 * - Checks if current user has linked employee record
 * - Provides loading and error states
 * - Returns employee data when available
 * - Handles authentication and authorization
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/authContext';

export interface Employee {
  id: number;
  empId: string;
  englishName: string;
  arabicName?: string;
  department: string;
  title: string;
  status: string;
  userId?: number;
  // Add other employee fields as needed
}

export interface EmployeeStatus {
  user: {
    id: number;
    username: string;
    role: string;
  } | null;
  hasEmployeeRecord: boolean;
  employee: Employee | null;
  allEmployees: Array<{
    id: number;
    userId: number | null;
    name: string;
  }>;
}

export function useEmployeeLink() {
  const { user, isLoading: authLoading } = useAuth();

  const {
    data: employeeStatus,
    isLoading: employeeLoading,
    error,
    refetch
  } = useQuery<EmployeeStatus>({
    queryKey: ['/api/portal/debug/employee-status'],
    queryFn: async () => {
      const response = await fetch('/api/portal/debug/employee-status', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Not authenticated');
        }
        const errorText = await response.text();
        throw new Error(`${response.status}: ${errorText}`);
      }
      
      return response.json();
    },
    enabled: !!user && !authLoading, // Only run if user is authenticated
    retry: false,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  return {
    // User authentication state
    user,
    isAuthenticated: !!user,
    
    // Employee link state
    employee: employeeStatus?.employee || null,
    hasEmployeeRecord: employeeStatus?.hasEmployeeRecord || false,
    availableEmployees: employeeStatus?.allEmployees || [],
    
    // Loading states
    isLoading: authLoading || employeeLoading,
    
    // Error state
    error,
    
    // Actions
    refetch,
    
    // Helper flags
    canAccessPortal: !!user && employeeStatus?.hasEmployeeRecord,
    needsEmployeeLink: !!user && !employeeStatus?.hasEmployeeRecord,
  };
}