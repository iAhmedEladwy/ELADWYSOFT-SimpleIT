import { useQuery } from "@tanstack/react-query";

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: string;
  employeeId?: number;
  managerId?: number;
}

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<AuthUser>({
    queryKey: ["/api/me"],
    retry: 2,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    isAdmin: user?.role === 'Admin',
    isManager: user?.role === 'Manager', 
    isAgent: user?.role === 'Agent',
    isEmployee: user?.role === 'Employee',
    hasRole: (role: string) => user?.role === role,
    hasMinRole: (minRole: string) => {
      const roleHierarchy = { Employee: 4, Agent: 3, Manager: 2, Admin: 1 };
      const userLevel = roleHierarchy[user?.role as keyof typeof roleHierarchy] || 5;
      const requiredLevel = roleHierarchy[minRole as keyof typeof roleHierarchy] || 1;
      return userLevel <= requiredLevel;
    }
  };
}