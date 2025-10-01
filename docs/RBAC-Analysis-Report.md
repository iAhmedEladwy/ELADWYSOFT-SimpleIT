# RBAC Implementation Analysis Report

## Executive Summary

This report analyzes the current access control implementation in SimpleIT to identify inconsistencies between direct permission checks and RBAC middleware usage.

---

## Current RBAC Infrastructure

### 1. RBAC Module (`server/rbac.ts`)

**Available Components:**
- ✅ **Role Constants**: `ROLES` object with Admin, Manager, Agent, Employee
- ✅ **Role Hierarchy**: `ROLE_HIERARCHY` with numeric levels (1-4)
- ✅ **Permissions**: Comprehensive `PERMISSIONS` object with granular permissions
- ✅ **Role-Permission Mapping**: `ROLE_PERMISSIONS` linking roles to permissions
- ✅ **Middleware Functions**:
  - `requireAuth()` - Authentication check
  - `requireRole(minRole)` - Hierarchical role check
  - `requirePermission(permission)` - Specific permission check
  - `attachUserInfo()` - Attaches user info to request
- ✅ **Helper Functions**:
  - `hasPermission(userRole, permission)` - Check if role has permission
  - `canAccessResource()` - Check resource ownership/hierarchy access
  - `getUserRoleLevel(user)` - Get numeric role level
  - `hasMinimumRoleLevel(user, level)` - Check minimum level
  - `getSubordinateIds(managerId)` - Get manager's subordinates
  - `filterByPermissions()` - Filter data by permissions

---

## Current Implementation Patterns

### Pattern 1: Custom `hasAccess()` Middleware (89 occurrences)

**Location**: `server/routes.ts` line 237-262

```typescript
const hasAccess = (minRoleLevel: number) => {
  return (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const user = req.user as any;
    
    // Direct admin bypass check
    if (user && (user.role === 'admin' || user.accessLevel === '4')) {
      return next();
    }
    
    const userLevel = getUserRoleLevel(user);
    if (!hasMinimumRoleLevel(user, minRoleLevel)) {
      return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
    }
    
    next();
  };
};
```

**Issues:**
- ⚠️ Hardcoded admin check: `user.role === 'admin' || user.accessLevel === '4'`
- ⚠️ Uses deprecated `accessLevel` property
- ⚠️ Bypasses RBAC permission system
- ⚠️ Inconsistent with RBAC module's `requireRole()`

**Usage Examples:**
```typescript
app.get("/api/users", authenticateUser, hasAccess(3), ...)           // Manager+
app.post("/api/assets", authenticateUser, hasAccess(2), ...)         // Agent+
app.delete("/api/assets/:id", authenticateUser, hasAccess(3), ...)   // Manager+
app.post("/api/admin/backups", authenticateUser, hasAccess(4), ...)  // Admin only
```

### Pattern 2: Direct Role/AccessLevel Checks (3 occurrences)

**Location 1**: `server/routes.ts` line 252
```typescript
if (user && (user.role === 'admin' || user.accessLevel === '4')) {
  return next();
}
```

**Location 2**: `server/routes.ts` line 7865
```typescript
function requireAdmin(req: any, res: any, next: any) {
  if (!req.session.user || req.session.user.accessLevel !== 4) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}
```

**Issues:**
- ⚠️ Direct property checks bypass RBAC system
- ⚠️ Uses deprecated `accessLevel` property
- ⚠️ No audit trail through RBAC functions
- ⚠️ Harder to maintain and update

### Pattern 3: Manual Role Level Checks (10 occurrences)

**Examples:**
```typescript
// Line 2716, 2746, 3625, 4158, 4198
const userRoleLevel = getUserRoleLevel(user);
// Followed by manual comparisons

// Line 5356-5358 (Dashboard permissions)
canAddEmployee: getUserRoleLevel(req.user) >= 2,
canAddAsset: getUserRoleLevel(req.user) >= 2,
canOpenTicket: getUserRoleLevel(req.user) >= 1,
```

**Issues:**
- ⚠️ Manual comparisons instead of using RBAC functions
- ⚠️ Inconsistent with middleware-based approach
- ✅ But correctly uses `getUserRoleLevel()` helper

---

## Recommended RBAC Standardization

### Option 1: Replace `hasAccess()` with RBAC `requireRole()` ✅ RECOMMENDED

**Benefits:**
- Uses standard RBAC module
- Consistent with role hierarchy
- Eliminates hardcoded admin checks
- Better maintainability

**Implementation:**
```typescript
// Current
app.get("/api/users", authenticateUser, hasAccess(3), ...)

// Proposed
app.get("/api/users", authenticateUser, requireRole(ROLES.MANAGER), ...)
```

**Required Changes:**
1. Import RBAC functions: `import { requireRole, requirePermission, ROLES } from './rbac'`
2. Replace `hasAccess(4)` → `requireRole(ROLES.ADMIN)`
3. Replace `hasAccess(3)` → `requireRole(ROLES.MANAGER)`
4. Replace `hasAccess(2)` → `requireRole(ROLES.AGENT)`
5. Replace `hasAccess(1)` → `requireRole(ROLES.EMPLOYEE)`
6. Remove custom `hasAccess()` function

### Option 2: Add Permission-Based Checks (More Granular) ⭐ IDEAL

**Benefits:**
- Most granular control
- Permission-based instead of role-based
- Aligns with RBAC best practices
- Future-proof for complex permissions

**Implementation:**
```typescript
// Instead of role-based
app.get("/api/users", authenticateUser, requireRole(ROLES.MANAGER), ...)

// Use permission-based
app.get("/api/users", authenticateUser, requirePermission(PERMISSIONS.USERS_VIEW_ALL), ...)
```

**Mapping Guide:**
```typescript
// Assets
hasAccess(2) for assets → requirePermission(PERMISSIONS.ASSETS_CREATE)
hasAccess(3) for asset delete → requirePermission(PERMISSIONS.ASSETS_DELETE)

// Users
hasAccess(3) for users → requirePermission(PERMISSIONS.USERS_VIEW_ALL)
hasAccess(3) for user CRUD → requirePermission(PERMISSIONS.USERS_CREATE/UPDATE/DELETE)

// Employees
hasAccess(2) for employees → requirePermission(PERMISSIONS.EMPLOYEES_CREATE)
hasAccess(3) for delete → requirePermission(PERMISSIONS.EMPLOYEES_DELETE)

// Tickets
hasAccess(2) for tickets → requirePermission(PERMISSIONS.TICKETS_CREATE)
hasAccess(3) for delete → requirePermission(PERMISSIONS.TICKETS_DELETE)

// Admin
hasAccess(4) → requirePermission(PERMISSIONS.SYSTEM_CONFIG)
```

### Option 3: Hybrid Approach (Practical) ✅ BALANCED

**Benefits:**
- Quick wins with minimal changes
- Gradual migration path
- Maintains backward compatibility

**Implementation:**
1. **Phase 1**: Replace direct checks with `getUserRoleLevel()` + `hasMinimumRoleLevel()`
2. **Phase 2**: Replace `hasAccess()` with `requireRole()` for new routes
3. **Phase 3**: Migrate to `requirePermission()` for critical endpoints

---

## Critical Issues Summary

### 1. Deprecated `accessLevel` Property (2 occurrences)
```typescript
// Line 252
user.accessLevel === '4'

// Line 7865
req.session.user.accessLevel !== 4
```

**Risk**: Code breaks if `accessLevel` is removed from schema
**Fix**: Use `getUserRoleLevel()` or `requireRole()` exclusively

### 2. Hardcoded Admin Bypasses (2 occurrences)
```typescript
// Line 252
if (user && (user.role === 'admin' || user.accessLevel === '4')) {
  return next();
}
```

**Risk**: Bypasses permission checks, audit logs incomplete
**Fix**: Remove bypass, let RBAC handle admin permissions naturally

### 3. Mixed Authentication Patterns
- `req.isAuthenticated()` (Passport)
- `req.user` checks
- `req.session.userId` checks
- `req.session.user` checks

**Risk**: Authentication state inconsistency
**Fix**: Standardize on Passport's `req.isAuthenticated()` + `attachUserInfo` middleware

---

## Proposed Migration Plan

### Phase 1: Safety First (Non-Breaking) ✅ START HERE

**Changes:**
1. Keep `hasAccess()` but remove hardcoded admin check
2. Replace direct `accessLevel` checks with `getUserRoleLevel()`
3. Add `attachUserInfo` middleware to all authenticated routes

**Affected Lines:**
- Line 252: Remove `user.accessLevel === '4'`
- Line 7865: Replace `requireAdmin()` with `requireRole(ROLES.ADMIN)`

**Risk Level**: 🟢 Low - No route changes, only internal logic

### Phase 2: Standardize Middleware (Breaking for Extensions) ⚠️

**Changes:**
1. Replace all `hasAccess(N)` with `requireRole(ROLES.*)` 
2. Update 89 route handlers

**Example Script:**
```typescript
// Migration helper (run once)
// hasAccess(1) → requireRole(ROLES.EMPLOYEE)
// hasAccess(2) → requireRole(ROLES.AGENT)
// hasAccess(3) → requireRole(ROLES.MANAGER)
// hasAccess(4) → requireRole(ROLES.ADMIN)
```

**Risk Level**: 🟡 Medium - Changes all route definitions

### Phase 3: Permission-Based (Future Enhancement) 🔮

**Changes:**
1. Gradually replace `requireRole()` with `requirePermission()`
2. Start with critical endpoints (users, system config, backups)
3. Update CRUD operations to use specific permissions

**Risk Level**: 🟢 Low - Opt-in enhancement, backward compatible

---

## Recommended Action Plan

### Immediate Actions (Before Approval)

1. ✅ **Review Current Implementation**
   - Read this document
   - Verify route access levels are correct
   - Check if any routes have wrong permission levels

2. ✅ **Choose Migration Strategy**
   - Option 1: Quick (replace hasAccess with requireRole)
   - Option 2: Ideal (add permission-based checks)
   - Option 3: Hybrid (gradual migration)

3. ✅ **Approve Migration Scope**
   - Which routes to migrate first?
   - Can we have temporary inconsistency?
   - Should we do all at once or phased?

### Post-Approval Actions

1. 🔧 **Create Migration Script** (if Option 2)
   - Automated search/replace for `hasAccess()`
   - Update imports in routes.ts
   - Run tests after each batch

2. 🧪 **Testing Strategy**
   - Test each role level after migration
   - Verify admin, manager, agent, employee access
   - Check edge cases (unassigned users, etc.)

3. 📝 **Documentation**
   - Update route documentation
   - Document permission requirements per endpoint
   - Create developer guide for adding new routes

---

## Questions for Approval

Please review and answer:

1. **Migration Strategy**: Which option do you prefer?
   - [ ] Option 1: Replace hasAccess() with requireRole() (Quick, ~2 hours)
   - [ ] Option 2: Full permission-based migration (Ideal, ~8 hours)
   - [ ] Option 3: Hybrid approach (Balanced, ~4 hours)

2. **Breaking Changes**: Can we tolerate temporary inconsistency?
   - [ ] Yes, migrate gradually route by route
   - [ ] No, all routes must be consistent

3. **Deprecated Properties**: Should we remove `accessLevel` entirely?
   - [ ] Yes, remove from schema and all code
   - [ ] No, keep for backward compatibility

4. **Critical Routes**: Which routes are most critical to migrate first?
   - [ ] Admin routes (backups, system config)
   - [ ] User management routes
   - [ ] Asset/Employee CRUD routes
   - [ ] All routes equally important

5. **Testing**: Do you have a test environment?
   - [ ] Yes, we can test thoroughly before production
   - [ ] No, we need to be very careful with changes

---

## Additional Notes

### Current Role Levels in Use

```typescript
Level 1 (Employee): No routes currently require this explicitly
Level 2 (Agent):    45 routes - mostly view/create operations
Level 3 (Manager):  38 routes - CRUD operations, imports/exports
Level 4 (Admin):    17 routes - system config, backups, deletions
```

### Routes Without Access Control

To verify, I should search for routes without `hasAccess()` or `requireRole()`:
- `/api/auth/*` - Public (login, logout)
- `/api/employees` GET - Filtered by role in handler
- `/api/assets` GET - Filtered by role in handler
- `/api/tickets` GET - Filtered by role in handler

**These may need explicit access control added.**

---

**Next Steps**: Please review this report and provide approval for the migration strategy you prefer. I'll then implement the changes with your guidance.
