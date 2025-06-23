import React, { createContext, useState, useContext, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest, getQueryFn } from './queryClient';

type User = {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  role: string;
  employeeId?: number;
  managerId?: number;
  isActive: boolean;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasAccess: (minRoleLevel: number) => boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(true);

  // Fetch current user
  const { data: user, isLoading: isUserLoading } = useQuery<User | null>({
    queryKey: ['/api/me'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
    retry: 2,
    retryDelay: 1000,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      const res = await apiRequest('POST', '/api/login', { username, password });
      return res.json();
    },
    onSuccess: async () => {
      // Force a refetch of the user data immediately instead of just invalidating
      await queryClient.fetchQuery({ queryKey: ['/api/me'] });
      setIsLoading(false);
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/logout', {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/me'] });
      queryClient.clear();
    },
  });

  useEffect(() => {
    if (!isUserLoading) {
      setIsLoading(false);
    }
  }, [isUserLoading]);

  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      console.log('Attempting login with username:', username);
      
      // Perform the login request
      const result = await loginMutation.mutateAsync({ username, password });
      console.log('Login API response:', result);
      
      // Force a refresh of the user data
      const userData = await queryClient.fetchQuery({ queryKey: ['/api/me'] });
      console.log('User data fetched after login:', userData);
      
      // Add a small delay to ensure state updates propagate
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setIsLoading(false);
      return result;
    } catch (error) {
      console.error("Login error:", error);
      // Add more detailed error logging for debugging
      if (error instanceof Error) {
        console.error("Login error details:", error.message, error.stack);
      }
      setIsLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  const hasAccess = (minRoleLevel: number) => {
    if (!user || !user.role) return false;
    
    // Role hierarchy: admin=4, manager=3, agent=2, employee=1
    const roleLevel = {
      'admin': 4,
      'manager': 3,
      'agent': 2,
      'employee': 1
    }[user.role] || 0;
    
    return roleLevel >= minRoleLevel;
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, hasAccess }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}


