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
  isFetching: boolean;
  hasCheckedAuth: boolean; // Flag to indicate if initial auth check is complete
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasAccess: (minRoleLevel: number) => boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(true);
  const [shouldCheckAuth, setShouldCheckAuth] = useState(false);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  // Check if we should attempt authentication on mount
  useEffect(() => {
    // Only skip auth check if on login page AND no session cookie
    const isLoginPage = window.location.pathname === '/login';
    const hasSessionCookie = document.cookie.includes('connect.sid');
    
    // Check auth if: not on login page, or has session cookie
    if (!isLoginPage || hasSessionCookie) {
      setShouldCheckAuth(true);
    } else {
      setIsLoading(false); // Not checking auth, so not loading
      setHasCheckedAuth(true);
    }
  }, []);

  // Fetch current user - only when we should check auth
  const { 
    data: user, 
    isLoading: isUserLoading, 
    isFetching: isUserFetching,
    status,
    fetchStatus 
  } = useQuery<User | null>({
    queryKey: ['/api/me'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
    enabled: shouldCheckAuth, // Only fetch when explicitly enabled
    retry: false, // Don't retry on 401
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    placeholderData: (previousData) => previousData, // Keep previous user during refetch
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      const result = await apiRequest('/api/login', 'POST', { username, password });
      return result;
    },
    onSuccess: async () => {
      // Enable auth check after successful login
      setShouldCheckAuth(true);
      // Force a refetch of the user data immediately instead of just invalidating
      await queryClient.fetchQuery({ queryKey: ['/api/me'] });
      setIsLoading(false);
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Logout failed');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/me'] });
      queryClient.clear();
      // Force redirect to login page
      window.location.href = '/';
    },
  });

  useEffect(() => {
    if (!isUserLoading) {
      setIsLoading(false);
      setHasCheckedAuth(true); // Mark that we've completed initial auth check
    }
  }, [isUserLoading]);

  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      
      // Perform the login request
      await loginMutation.mutateAsync({ username, password });
      
      // The loginMutation.onSuccess already handles fetching user data
      // Just wait a moment for the state to update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      setIsLoading(false);
    } catch (error) {
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
    <AuthContext.Provider value={{ user: user || null, isLoading, isFetching: isUserFetching, hasCheckedAuth, login, logout, hasAccess }}>
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


