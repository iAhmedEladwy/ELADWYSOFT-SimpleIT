import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  url: string,
  method: string = 'GET',
  data?: unknown | undefined,
  options?: { isFormData?: boolean }
): Promise<any> {
  try {
    const isFormData = options?.isFormData || data instanceof FormData;
    
    const res = await fetch(url, {
      method,
      headers: isFormData ? {} : (data ? { "Content-Type": "application/json" } : {}),
      body: isFormData ? data as FormData : (data ? JSON.stringify(data) : undefined),
      credentials: "include",
    });

    await throwIfResNotOk(res);
    
    // Handle empty responses
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await res.json();
    }
    return res;
  } catch (error) {
    // Silently handle expected authentication failures
    // Only log unexpected errors for debugging
    const isAuthError = error instanceof Error && error.message.includes('401');
    const isAuthEndpoint = url.includes('/api/me') || url.includes('/api/login') || url.includes('/api/logout');
    
    if (!isAuthError || !isAuthEndpoint) {
      console.error(`API Request Error (${method} ${url}):`, error);
    }
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes - improved from Infinity
      retry: (failureCount, error) => {
        // Don't retry on auth errors
        if (error instanceof Error && error.message.includes('401')) {
          return false;
        }
        // Retry other errors up to 2 times
        return failureCount < 2;
      },
      retryDelay: 1000,
    },
    mutations: {
      retry: (failureCount, error) => {
        // Don't retry on auth errors
        if (error instanceof Error && error.message.includes('401')) {
          return false;
        }
        // Retry other errors once
        return failureCount < 1;
      },
    },
  },
});