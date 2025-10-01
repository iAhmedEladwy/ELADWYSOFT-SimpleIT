# Authentication Usage Audit

## Overview
All components in the application now use the **single unified auth system** from `@/lib/authContext.tsx`.

## AuthContext API

The authContext provides the following properties:

```typescript
type AuthContextType = {
  user: User | null;              // Current authenticated user
  isLoading: boolean;             // Initial authentication check loading
  isFetching: boolean;            // Refetching user data (prevents double-refresh logout)
  login: (username, password) => Promise<void>;  // Login function
  logout: () => Promise<void>;    // Logout function
  hasAccess: (minRoleLevel: number) => boolean;  // RBAC check
};
```

### Role Levels for hasAccess()
- Employee: 1
- Agent: 2
- Manager: 3
- Admin: 4

## Components Using Auth (26 total)

### ✅ Core Application Components

1. **App.tsx** - `PrivateRoute`
   - Uses: `user`, `isLoading`, `isFetching`
   - Purpose: Route protection with refetch-safe authentication

2. **Layout.tsx**
   - Uses: `user`
   - Purpose: Display user info in layout

3. **Sidebar.tsx**
   - Uses: `user`
   - Purpose: Role-based navigation menu

4. **Header.tsx**
   - Uses: `user`, `logout`
   - Purpose: User menu and logout

### ✅ Authentication Components

5. **Login.tsx**
   - Uses: `login`, `user`, `isLoading`
   - Purpose: Login form and authentication

6. **RoleGuard.tsx**
   - Uses: `user`
   - Purpose: Component-level role-based access control

### ✅ Dashboard Components

7. **Notifications.tsx**
   - Uses: `user`
   - Purpose: Enable queries only when authenticated (`enabled: !!user`)
   - Note: Fixed to use `!!user` instead of non-existent `isAuthenticated`

### ✅ Page Components

8. **Assets.tsx**
   - Uses: `user`, `hasAccess`
   - Purpose: Asset management with role-based features

9. **Employees.tsx**
   - Uses: `hasAccess`
   - Purpose: Employee management with role restrictions

10. **Tickets.tsx**
    - Uses: `user`, `hasAccess`
    - Purpose: Ticket management with role-based actions

11. **Users.tsx**
    - Uses: `hasAccess`
    - Purpose: User management (admin/manager only)

12. **UserProfile.tsx**
    - Uses: `user`
    - Purpose: Display and edit user profile

13. **AdminConsole.tsx**
    - Uses: `hasAccess`
    - Purpose: Admin-only features

14. **AuditLogs.tsx**
    - Uses: `hasAccess`
    - Purpose: Audit log viewing (admin/manager only)

15. **Reports.tsx**
    - Uses: `hasAccess`
    - Purpose: Report generation with role restrictions

16. **SystemConfig.tsx**
    - Uses: `hasAccess`
    - Purpose: System configuration (admin only)

### ✅ Admin Pages

17. **BulkOperations.tsx**
    - Uses: `hasAccess`
    - Purpose: Bulk operations (admin/manager only)

18. **UpgradeRequests.tsx**
    - Uses: `user`
    - Purpose: Asset upgrade request management

### ✅ Component Modules

19. **AssetsTable.tsx**
    - Uses: `hasAccess`
    - Purpose: Role-based asset table actions

20. **UpgradeForm.tsx**
    - Uses: `user`
    - Purpose: Track who creates upgrade requests

21. **EmployeesTable.tsx**
    - Uses: `hasAccess`
    - Purpose: Role-based employee table actions

22. **TicketsTable.tsx**
    - Uses: `user`
    - Purpose: Filter tickets by user role

23. **TicketForm.tsx**
    - Uses: `user`, `hasAccess`
    - Purpose: Ticket creation/editing with role checks

## Common Usage Patterns

### Pattern 1: Route Protection
```typescript
const { user, isLoading, isFetching } = useAuth();

// Only redirect if NOT loading/fetching and NO user
if (!isLoading && !isFetching && !user) {
  navigate("/login");
}
```

### Pattern 2: Conditional Queries
```typescript
const { user } = useAuth();

const { data } = useQuery({
  queryKey: ['/api/data'],
  enabled: !!user,  // Only fetch when authenticated
});
```

### Pattern 3: Role-Based Features
```typescript
const { hasAccess } = useAuth();

// Check if user has minimum role level
if (hasAccess(3)) {  // Manager level
  // Show manager/admin features
}
```

### Pattern 4: User-Specific Actions
```typescript
const { user } = useAuth();

// Use current user ID for filtering/tracking
const myTickets = tickets.filter(t => t.assignedTo === user?.id);
```

## Migration Complete ✅

All components have been verified to:
- ✅ Import from `@/lib/authContext` (not `@/hooks/useAuth`)
- ✅ Use only available properties from AuthContextType
- ✅ Replace `isAuthenticated` with `!!user` where needed
- ✅ No duplicate authentication implementations

## Removed Files

- ❌ `client/src/hooks/useAuth.ts` - Deleted (duplicate standalone hook)

## Benefits

1. **Single Source of Truth** - One auth implementation
2. **Consistent State** - No conflicting queries
3. **Refetch-Safe** - `isFetching` prevents double-refresh logout
4. **Type-Safe** - Clear TypeScript types for all auth properties
5. **Maintainable** - Changes to auth logic only in one place
