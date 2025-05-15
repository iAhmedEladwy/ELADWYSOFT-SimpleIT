import React, { createContext, useState, useContext, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from './queryClient';

type User = {
  id: number;
  username: string;
  email: string;
  accessLevel: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasAccess: (minAccessLevel: number) => boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(true);

  // Fetch current user
  const { data: user, isLoading: isUserLoading } = useQuery<User | null>({
    queryKey: ['/api/me'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
    staleTime: 1000 * 60 * 5, // 5 minutes
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
      setIsLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  const hasAccess = (minAccessLevel: number) => {
    if (!user) return false;
    return parseInt(user.accessLevel) >= minAccessLevel;
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

// Helper to handle 401 responses differently
type UnauthorizedBehavior = 'returnNull' | 'throw';
const getQueryFn =
  ({ on401 }: { on401: UnauthorizedBehavior }) =>
  async ({ queryKey }: { queryKey: string[] }) => {
    try {
      const res = await fetch(queryKey[0], {
        credentials: 'include',
      });

      if (on401 === 'returnNull' && res.status === 401) {
        return null;
      }

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status}: ${text || res.statusText}`);
      }

      return await res.json();
    } catch (error) {
      console.error('Query error:', error);
      throw error;
    }
  };
