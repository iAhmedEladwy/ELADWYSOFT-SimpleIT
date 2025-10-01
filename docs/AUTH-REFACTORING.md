# Authentication System Refactoring

## Problem Discovered

The application had **TWO SEPARATE authentication implementations** running simultaneously, causing conflicts and the "double-refresh logout" bug.

## The Two Systems

### 1. Primary: `@/lib/authContext.tsx` (AuthProvider Context)
- **Location**: `client/src/lib/authContext.tsx`
- **Type**: React Context with AuthProvider
- **Features**:
  - Full authentication context with login/logout mutations
  - Controlled auth checking via `shouldCheckAuth` state
  - Sophisticated loading states
  - Role-based access control with `hasAccess()`
  - TanStack Query integration with proper error handling
  - **Used by**: Most of the application (Login, Dashboard, Assets, Employees, Tickets, etc.)

### 2. Duplicate: `@/hooks/useAuth.ts` (Standalone Hook)
- **Location**: `client/src/hooks/useAuth.ts`
- **Type**: Simple TanStack Query hook
- **Features**:
  - Direct query to `/api/me`
  - No context, no controlled loading
  - Basic role checking
  - **Used by**: Only `UpgradeRequests.tsx`

## Root Cause of Double-Refresh Logout

The `PrivateRoute` component in `App.tsx` was using the context's `useAuth` but **wasn't checking the `isFetching` state**:

```typescript
// BEFORE (BUGGY):
function PrivateRoute({ component: Component, ...rest }: any) {
  const { user, isLoading } = useAuth();
  
  useEffect(() => {
    if (!isLoading && !user && !isRedirecting) {
      // BUG: During refetch, user becomes undefined briefly
      navigate("/login");
    }
  }, [user, isLoading, navigate, isRedirecting]);
}
```

**What happened during double-refresh:**
1. User refreshes page twice quickly
2. TanStack Query refetches `/api/me` endpoint
3. During refetch, `user` object becomes `undefined` momentarily
4. `PrivateRoute` sees `!isLoading && !user` and redirects to login
5. Even though backend session is valid, user gets logged out

## The Fix

### Step 1: Expose `isFetching` from AuthContext

Modified `authContext.tsx` to expose the fetching state:

```typescript
type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isFetching: boolean; // ← ADDED
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasAccess: (minRoleLevel: number) => boolean;
};

// In the provider:
const { data: user, isLoading: isUserLoading, isFetching: isUserFetching } = useQuery<User | null>({
  queryKey: ['/api/me'],
  // ... query config
});

return (
  <AuthContext.Provider value={{ 
    user: user || null, 
    isLoading, 
    isFetching: isUserFetching, // ← ADDED
    login, 
    logout, 
    hasAccess 
  }}>
    {children}
  </AuthContext.Provider>
);
```

### Step 2: Update PrivateRoute to Check isFetching

Modified `App.tsx` to prevent redirect during refetch:

```typescript
// AFTER (FIXED):
function PrivateRoute({ component: Component, ...rest }: any) {
  const { user, isLoading, isFetching } = useAuth(); // ← Added isFetching
  const [, navigate] = useLocation();
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  useEffect(() => {
    // Only redirect if we're certain the user is not authenticated
    // AND we're not currently fetching/refetching data
    if (!isLoading && !isFetching && !user && !isRedirecting) { // ← Added !isFetching
      setIsRedirecting(true);
      setTimeout(() => {
        navigate("/login");
      }, 100);
    }
  }, [user, isLoading, isFetching, navigate, isRedirecting]); // ← Added isFetching to deps

  // Show loading during refetch too
  if (isLoading || isFetching || isRedirecting) { // ← Added isFetching
    return <LoadingScreen />;
  }

  if (!user) {
    return null;
  }

  return <Component {...rest} />;
}
```

### Step 3: Consolidate Authentication

Updated `UpgradeRequests.tsx` to use the context instead of the standalone hook:

```typescript
// BEFORE:
import { useAuth } from '@/hooks/useAuth';

// AFTER:
import { useAuth } from '@/lib/authContext';
```

## Benefits of This Fix

1. **Prevents double-refresh logout**: Now waits for refetch to complete before checking authentication
2. **Single source of truth**: All components use the same AuthContext
3. **Consistent loading states**: Proper handling of initial load vs. refetch
4. **Better UX**: Shows loading indicator during refetch instead of redirecting
5. **Backend session preserved**: Session was always valid, frontend just needed to respect refetch state

## Verification

To verify the fix works:

1. Login to the application
2. Refresh the page twice rapidly (double-click refresh)
3. User should **stay logged in** instead of being redirected to login
4. Check browser devtools network tab - `/api/me` should return 200 with user data
5. Session cookie should remain valid

## Next Steps (Optional Improvements)

1. ✅ **DONE: Removed standalone hook** - Deleted `client/src/hooks/useAuth.ts` 
2. **Add unit tests**: Test PrivateRoute behavior during loading/fetching/authenticated states
3. **Type safety**: Add proper TypeScript types to PrivateRoute component
4. **Consider React Router**: Replace Wouter with React Router for more robust routing features

## Related Files Changed

- `client/src/lib/authContext.tsx` - Added `isFetching` to context (KEPT - Primary auth system)
- `client/src/App.tsx` - Updated PrivateRoute to check `isFetching`
- `client/src/pages/admin/UpgradeRequests.tsx` - Changed import to use context
- `client/src/components/dashboard/Notifications.tsx` - Changed import to use context
- `client/src/hooks/useAuth.ts` - DELETED (duplicate standalone hook removed)

## Diagnostic Tools Created

During debugging, a diagnostic endpoint was added:

```typescript
// server/routes.ts
app.get('/api/debug/session', (req, res) => {
  res.json({
    sessionID: req.sessionID,
    session: req.session,
    isAuthenticated: req.isAuthenticated(),
    user: req.user,
  });
});
```

This endpoint helped prove that the backend session was working correctly and the issue was on the frontend.
