# SimpleIT Development Guidelines

## Purpose
This document provides **mandatory coding standards** to maintain consistency across the SimpleIT codebase. Following these guidelines prevents the mixed patterns that previously existed in authentication, authorization, and translations.

---

## 📋 Table of Contents
1. [Route Modularization](#-route-modularization) ⚠️ **CRITICAL**
2. [Authentication & Authorization Patterns](#authentication--authorization-patterns)
3. [Translation Patterns](#translation-patterns)
4. [API Patterns](#api-patterns)
5. [Component Structure](#component-structure)
6. [Database Patterns](#database-patterns)
7. [Code Review Checklist](#code-review-checklist)

---

## 🚨 Route Modularization

### ⚠️ CRITICAL: Do NOT Add Routes to `server/routes.ts`

**The main `routes.ts` file is being phased out!** It has grown to 7,798 lines and is difficult to maintain.

### ✅ CORRECT: Create Modular Route Files

#### Step 1: Create Router Module

```typescript
// ✅ CORRECT: server/routes/myFeature.ts
import { Router } from 'express';

const router = Router();

// All routes are relative to the mount point
router.get('/', async (req, res) => {
  // Handles GET /api/myfeature
  const items = await db.query.myFeature.findMany();
  res.json(items);
});

router.post('/', async (req, res) => {
  // Handles POST /api/myfeature
  const newItem = await db.insert(myFeature).values(req.body);
  res.json(newItem);
});

router.get('/:id', async (req, res) => {
  // Handles GET /api/myfeature/:id
  const item = await db.query.myFeature.findFirst({
    where: eq(myFeature.id, parseInt(req.params.id))
  });
  res.json(item);
});

export default router;
```

#### Step 2: Mount Router in `server/routes.ts`

```typescript
// Import at top of file
import myFeatureRouter from './routes/myFeature';

// Inside registerRoutes() function:
app.use('/api/myfeature', authenticateUser, myFeatureRouter);
//     └─ Mount point    └─ Auth required  └─ Your router
```

### ❌ INCORRECT: Adding to Main routes.ts

```typescript
// ❌ DON'T DO THIS - Don't add new routes here!
app.get('/api/myfeature', authenticateUser, async (req, res) => {
  // This makes routes.ts even bigger!
});
```

### 📁 Existing Route Modules (Follow These Patterns)

| File | Lines | Purpose |
|------|-------|---------|
| `server/routes/notifications.ts` | 228 | Notification API endpoints |
| `server/routes/backup.ts` | 368 | Backup/restore operations |
| `server/routes/systemHealth.ts` | 32 | System monitoring |
| `server/routes/portal.ts` | 809 | Employee self-service portal |

### 🎯 Best Practices for Route Modules

#### ✅ DO:
- Keep routers focused on single domain (notifications, backups, etc.)
- Apply authentication at mount level (`app.use('/api/feature', authenticateUser, router)`)
- Use relative paths in router (`router.get('/')` not `router.get('/api/feature')`)
- Extract business logic to services (`server/services/`)
- Keep route handlers thin (< 30 lines)
- Group related endpoints together

#### ❌ DON'T:
- Add `authenticateUser` inside route module (apply at mount)
- Duplicate role/permission checks (define once at mount or in service)
- Mix concerns (notifications + backups in same file)
- Create routes with complex nested logic
- Forget to export default router

### 📝 Example: Notification Router Pattern

```typescript
// server/routes/notifications.ts
import { Router } from 'express';
import { requireRole, ROLES } from '../rbac';
import * as notificationService from '../services/notificationService';

const router = Router();

// List notifications (all authenticated users)
router.get('/', async (req, res) => {
  const notifications = await notificationService.getUserNotifications(req.user!.id);
  res.json(notifications);
});

// Mark as read (own notifications only)
router.put('/:id/read', async (req, res) => {
  await notificationService.markAsRead(parseInt(req.params.id), req.user!.id);
  res.sendStatus(204);
});

// Send notification (agents and above)
router.post('/', requireRole(ROLES.AGENT), async (req, res) => {
  const notification = await notificationService.createNotification(req.body);
  res.json(notification);
});

export default router;

// Mounted in routes.ts:
// app.use('/api/notifications', authenticateUser, notificationRouter);
```

### 🔧 Refactoring Existing Code

When you see long route handlers in `routes.ts`:

1. **Create new file**: `server/routes/featureName.ts`
2. **Extract routes**: Copy related routes to new file
3. **Convert to router**: Change `app.get` to `router.get`, remove `/api/feature` prefix
4. **Extract logic**: Move complex logic to `server/services/featureService.ts`
5. **Mount router**: Add `app.use('/api/feature', authenticateUser, featureRouter)` in routes.ts
6. **Delete old code**: Remove from main routes.ts
7. **Test thoroughly**: Verify all endpoints still work

### 📊 Migration Progress

- **Total routes in routes.ts**: ~180 endpoints (before refactoring)
- **Extracted to modules**: 4 modules, 628 lines moved
- **Remaining in routes.ts**: ~7,798 lines (down from 8,444)
- **Target**: All routes in focused modules (< 300 lines each)

---

## 🔐 Authentication & Authorization Patterns

### ✅ CORRECT: Backend Authorization

#### Use `requireRole()` Middleware (After v0.4.3 Migration)

```typescript
// ✅ CORRECT: Semantic role-based authorization
import { requireRole, ROLES } from '../rbac';

// Admin-only operations
app.post("/api/admin/backups", 
  authenticateUser, 
  requireRole(ROLES.ADMIN),
  async (req, res) => { /* handler */ }
);

// Manager-level operations
app.get("/api/users", 
  authenticateUser, 
  requireRole(ROLES.MANAGER),
  async (req, res) => { /* handler */ }
);

// Agent-level operations
app.post("/api/assets", 
  authenticateUser, 
  requireRole(ROLES.AGENT),
  async (req, res) => { /* handler */ }
);
```

#### Permission-Based Authorization (For Granular Control)

```typescript
// ✅ CORRECT: Use requirePermission() for specific actions
import { requirePermission, PERMISSIONS } from '../rbac';

app.delete("/api/assets/:id", 
  authenticateUser, 
  requirePermission(PERMISSIONS.ASSETS_DELETE),
  async (req, res) => { /* handler */ }
);
```

### ❌ INCORRECT: Backend Authorization

```typescript
// ❌ NEVER USE: Numeric access levels (deprecated)
app.get("/api/users", authenticateUser, hasAccess(3), async (req, res) => {
  // DON'T DO THIS - hasAccess() is deprecated
});

// ❌ NEVER USE: Direct role checks in route handlers
app.get("/api/users", authenticateUser, async (req, res) => {
  if (req.user.role === 'admin') {  // DON'T DO THIS
    // Allow access
  }
});

// ❌ NEVER USE: Old accessLevel property
app.get("/api/users", authenticateUser, async (req, res) => {
  if (req.user.accessLevel === '4') {  // DON'T DO THIS - deprecated
    // Allow access
  }
});

// ❌ NEVER USE: Hardcoded bypasses
if (req.user.role === 'admin' || req.user.accessLevel === '4') {
  return next(); // DON'T DO THIS - security risk
}
```

### ✅ CORRECT: Frontend Authorization

#### Use `<RoleGuard>` Component

```tsx
// ✅ CORRECT: Component-level access control
import { RoleGuard } from '@/components/auth/RoleGuard';

export function MyComponent() {
  return (
    <div>
      <RoleGuard allowedRoles={['admin', 'manager']}>
        <Button onClick={handleDelete}>Delete</Button>
      </RoleGuard>

      <RoleGuard allowedRoles={['admin']}>
        <AdminPanel />
      </RoleGuard>
    </div>
  );
}
```

#### Use `hasPermission()` Helper for Conditional Rendering

```tsx
// ✅ CORRECT: Conditional logic with hasPermission()
import { hasPermission } from '@/components/auth/RoleGuard';
import { useAuth } from '@/lib/authContext';

export function MyComponent() {
  const { user } = useAuth();

  return (
    <div>
      {hasPermission(user?.role, ['admin', 'manager']) && (
        <Button>Delete User</Button>
      )}
      
      {hasPermission(user?.role, ['admin']) && (
        <Link to="/admin">Admin Console</Link>
      )}
    </div>
  );
}
```

### ❌ INCORRECT: Frontend Authorization

```tsx
// ❌ NEVER USE: hasAccess() in frontend (deprecated)
{hasAccess(3) && <Button>Delete</Button>}

// ❌ NEVER USE: Direct role checks
{user?.role === 'admin' && <Button>Delete</Button>}

// ❌ NEVER USE: Direct accessLevel checks
{user?.accessLevel === '4' && <Button>Delete</Button>}

// ❌ NEVER USE: Numeric role comparisons
{getRoleLevel(user?.role) >= 3 && <Button>Delete</Button>}
```

### 📝 Authorization Checklist

When implementing authorization:
- [ ] **Backend**: Use `requireRole(ROLES.*)` middleware
- [ ] **Frontend**: Use `<RoleGuard>` component or `hasPermission()` helper
- [ ] **Never** use numeric levels (1, 2, 3, 4)
- [ ] **Never** use `hasAccess()` (deprecated)
- [ ] **Never** check `accessLevel` property (deprecated)
- [ ] **Never** hardcode role strings - use `ROLES` constants
- [ ] **Always** use lowercase role names in `allowedRoles` arrays
- [ ] **Test** with all role levels (employee, agent, manager, admin)

---

## 🌐 Translation Patterns

### ✅ CORRECT: Centralized Translation Files

#### Create Translation Hook (Recommended)

```typescript
// ✅ CORRECT: Create dedicated translation file
// client/src/lib/translations/users.ts

export interface UserTranslations {
  title: string;
  name: string;
  email: string;
  role: string;
  status: string;
  actions: string;
  edit: string;
  delete: string;
  // ... all translations
}

export const userTranslations = {
  en: {
    title: 'Users',
    name: 'Name',
    email: 'Email',
    role: 'Role',
    status: 'Status',
    actions: 'Actions',
    edit: 'Edit',
    delete: 'Delete',
  },
  ar: {
    title: 'المستخدمين',
    name: 'الاسم',
    email: 'البريد الإلكتروني',
    role: 'الدور',
    status: 'الحالة',
    actions: 'الإجراءات',
    edit: 'تعديل',
    delete: 'حذف',
  }
};

export const useUserTranslations = (
  language: 'English' | 'Arabic' = 'English'
): UserTranslations => {
  return language === 'English' ? userTranslations.en : userTranslations.ar;
};
```

#### Use in Component

```tsx
// ✅ CORRECT: Import and use translation hook
import { useLanguage } from '@/hooks/use-language';
import { useUserTranslations } from '@/lib/translations/users';

export function UsersTable() {
  const { language } = useLanguage();
  const t = useUserTranslations(language);

  return (
    <div>
      <h1>{t.title}</h1>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{t.name}</TableCell>
            <TableCell>{t.email}</TableCell>
            <TableCell>{t.role}</TableCell>
            <TableCell>{t.status}</TableCell>
            <TableCell>{t.actions}</TableCell>
          </TableRow>
        </TableHead>
      </Table>
    </div>
  );
}
```

### ✅ ALTERNATIVE: Inline Translation Object (For Small Components)

```tsx
// ✅ ACCEPTABLE: Inline translations for small components
import { useLanguage } from '@/hooks/use-language';

export function SmallButton() {
  const { language } = useLanguage();
  
  const translations = {
    save: language === 'English' ? 'Save' : 'حفظ',
    cancel: language === 'English' ? 'Cancel' : 'إلغاء',
  };

  return (
    <div>
      <Button>{translations.save}</Button>
      <Button>{translations.cancel}</Button>
    </div>
  );
}
```

### ❌ INCORRECT: Translation Anti-Patterns

```tsx
// ❌ NEVER USE: Scattered inline translations
<h1>{language === 'English' ? 'Users' : 'المستخدمين'}</h1>
<span>{language === 'English' ? 'Edit' : 'تعديل'}</span>
<Button>{language === 'English' ? 'Delete' : 'حذف'}</Button>
// Problem: Same translations duplicated across components

// ❌ NEVER USE: Hardcoded English-only text
<h1>Users</h1>  // Missing Arabic translation
<Button>Delete</Button>  // Missing Arabic translation

// ❌ NEVER USE: Inconsistent translation keys
const translations = {
  userName: 'Name',        // camelCase
  user_email: 'Email',     // snake_case
  'User Role': 'Role',     // spaces
};
// Problem: Inconsistent naming convention

// ❌ NEVER USE: Mixed translation patterns in same component
<h1>{t.title}</h1>  // Using hook
<span>{language === 'English' ? 'Edit' : 'تعديل'}</span>  // Inline
// Problem: Inconsistent - pick one pattern
```

### 📝 Translation Checklist

When adding translations:
- [ ] **Create** dedicated translation file for new features (`client/src/lib/translations/[feature].ts`)
- [ ] **Define** TypeScript interface for type safety
- [ ] **Provide** both English and Arabic translations
- [ ] **Use** `useLanguage()` hook to get current language
- [ ] **Name** translation keys consistently (camelCase preferred)
- [ ] **Test** component in both languages
- [ ] **Never** hardcode English-only text
- [ ] **Reuse** existing translation files when possible

### 📁 Translation File Structure

```
client/src/lib/translations/
├── tickets.ts          ✅ Exists (comprehensive)
├── users.ts            ⏳ Create this
├── assets.ts           ⏳ Create this
├── employees.ts        ⏳ Create this
├── reports.ts          ⏳ Create this
├── common.ts           ⏳ Create this (buttons, actions, etc.)
└── README.md           ⏳ Document translation patterns
```

---

## 🌐 API Patterns

### ✅ CORRECT: API Endpoints

```typescript
// ✅ CORRECT: RESTful API pattern
import { authenticateUser, requireRole, ROLES } from '../rbac';
import { auditLogger } from '../auditLogger';

// GET /api/resource - List resources
app.get("/api/users", 
  authenticateUser, 
  requireRole(ROLES.MANAGER),
  async (req, res) => {
    try {
      const users = await db.select().from(usersTable);
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  }
);

// GET /api/resource/:id - Get single resource
app.get("/api/users/:id", 
  authenticateUser, 
  requireRole(ROLES.MANAGER),
  async (req, res) => {
    try {
      const user = await db.select()
        .from(usersTable)
        .where(eq(usersTable.id, parseInt(req.params.id)))
        .limit(1);
      
      if (!user[0]) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json(user[0]);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  }
);

// POST /api/resource - Create resource
app.post("/api/users", 
  authenticateUser, 
  requireRole(ROLES.MANAGER),
  async (req, res) => {
    try {
      const newUser = await db.insert(usersTable)
        .values(req.body)
        .returning();
      
      // Audit log
      await auditLogger.log({
        userId: req.user.id,
        action: 'create',
        resourceType: 'user',
        resourceId: newUser[0].id,
        details: { username: newUser[0].username }
      });
      
      res.status(201).json(newUser[0]);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create user' });
    }
  }
);

// PUT /api/resource/:id - Update resource
app.put("/api/users/:id", 
  authenticateUser, 
  requireRole(ROLES.MANAGER),
  async (req, res) => {
    try {
      const updated = await db.update(usersTable)
        .set(req.body)
        .where(eq(usersTable.id, parseInt(req.params.id)))
        .returning();
      
      // Audit log
      await auditLogger.log({
        userId: req.user.id,
        action: 'update',
        resourceType: 'user',
        resourceId: updated[0].id,
        details: req.body
      });
      
      res.json(updated[0]);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update user' });
    }
  }
);

// DELETE /api/resource/:id - Delete resource
app.delete("/api/users/:id", 
  authenticateUser, 
  requireRole(ROLES.MANAGER),
  async (req, res) => {
    try {
      await db.delete(usersTable)
        .where(eq(usersTable.id, parseInt(req.params.id)));
      
      // Audit log
      await auditLogger.log({
        userId: req.user.id,
        action: 'delete',
        resourceType: 'user',
        resourceId: parseInt(req.params.id),
        details: {}
      });
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete user' });
    }
  }
);
```

### ❌ INCORRECT: API Anti-Patterns

```typescript
// ❌ NEVER USE: Non-RESTful URLs
app.get("/api/getUsersList", ...)      // Use: GET /api/users
app.post("/api/createNewUser", ...)    // Use: POST /api/users
app.post("/api/deleteUser", ...)       // Use: DELETE /api/users/:id

// ❌ NEVER USE: Missing error handling
app.get("/api/users", async (req, res) => {
  const users = await db.select().from(usersTable);  // No try-catch
  res.json(users);
});

// ❌ NEVER USE: Missing audit logs for mutations
app.delete("/api/users/:id", async (req, res) => {
  await db.delete(usersTable).where(eq(usersTable.id, id));
  res.json({ success: true });
  // Missing audit log!
});

// ❌ NEVER USE: Inconsistent response formats
app.get("/api/users", (req, res) => {
  res.json(users);  // Returns array
});
app.get("/api/assets", (req, res) => {
  res.json({ data: assets, total: count });  // Returns object
});
// Problem: Inconsistent response structure
```

### 📝 API Checklist

When creating API endpoints:
- [ ] **Use** RESTful conventions (GET/POST/PUT/DELETE)
- [ ] **Add** authentication middleware (`authenticateUser`)
- [ ] **Add** authorization middleware (`requireRole` or `requirePermission`)
- [ ] **Wrap** in try-catch for error handling
- [ ] **Return** appropriate HTTP status codes (200, 201, 400, 404, 500)
- [ ] **Add** audit logging for mutations (create, update, delete)
- [ ] **Validate** input with Zod schemas
- [ ] **Test** with different role levels
- [ ] **Document** in API documentation

---

## 🏗️ Component Structure

### ✅ CORRECT: Component Organization

```
client/src/components/
├── [feature]/              # Feature-specific components
│   ├── [Feature]Table.tsx  # List view component
│   ├── [Feature]Form.tsx   # Create/Edit form component
│   ├── [Feature]Filters.tsx # Filter component
│   ├── [Feature]DetailView.tsx # Detail view component
│   └── [Feature]*.tsx      # Other feature components
├── ui/                     # Shared UI components (Shadcn)
│   ├── button.tsx
│   ├── table.tsx
│   ├── dialog.tsx
│   └── ...
├── layout/                 # Layout components
│   ├── Layout.tsx
│   ├── Sidebar.tsx
│   └── Header.tsx
├── auth/                   # Auth components
│   └── RoleGuard.tsx
└── admin/                  # Admin-specific components
    └── ScheduledBackupsTab.tsx
```

### ✅ CORRECT: Component Pattern

```tsx
// ✅ CORRECT: Standard component structure
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { useUserTranslations } from '@/lib/translations/users';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { Button } from '@/components/ui/button';
import { Table } from '@/components/ui/table';

interface UsersTableProps {
  onEdit?: (user: User) => void;
  onDelete?: (userId: number) => void;
}

export function UsersTable({ onEdit, onDelete }: UsersTableProps) {
  // 1. Hooks
  const { language } = useLanguage();
  const t = useUserTranslations(language);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // 2. Data fetching
  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => fetch('/api/users').then(r => r.json())
  });

  // 3. Mutations
  const deleteMutation = useMutation({
    mutationFn: (id: number) => 
      fetch(`/api/users/${id}`, { method: 'DELETE' })
  });

  // 4. Event handlers
  const handleDelete = (id: number) => {
    if (confirm(t.confirmDelete)) {
      deleteMutation.mutate(id);
      onDelete?.(id);
    }
  };

  // 5. Render
  if (isLoading) return <div>{t.loading}</div>;

  return (
    <div>
      <h2>{t.title}</h2>
      <Table>
        {/* Table content */}
      </Table>
      
      <RoleGuard allowedRoles={['admin', 'manager']}>
        <Button onClick={() => onEdit?.(selectedUser)}>
          {t.edit}
        </Button>
      </RoleGuard>
    </div>
  );
}
```

### ❌ INCORRECT: Component Anti-Patterns

```tsx
// ❌ NEVER USE: Mixing concerns
export function UsersTableWithFormAndFilters() {
  // Component does too much - split into separate components
}

// ❌ NEVER USE: No TypeScript interfaces
export function UsersTable({ onEdit, onDelete }) {
  // Missing prop types
}

// ❌ NEVER USE: Inline API calls without TanStack Query
const [users, setUsers] = useState([]);
useEffect(() => {
  fetch('/api/users').then(r => r.json()).then(setUsers);
}, []);
// Use useQuery instead

// ❌ NEVER USE: Direct DOM manipulation
document.getElementById('user-table').innerHTML = '...';
// Use React state and JSX

// ❌ NEVER USE: Global variables
let currentUser;  // Don't use global state
// Use useState or context
```

---

## 💾 Database Patterns

### ✅ CORRECT: Database Queries

```typescript
// ✅ CORRECT: Use Drizzle ORM
import { db } from './db';
import { users, assets } from '@shared/schema';
import { eq, and, or, like, desc } from 'drizzle-orm';

// SELECT with conditions
const user = await db.select()
  .from(users)
  .where(eq(users.id, userId))
  .limit(1);

// SELECT with joins
const assetsWithEmployees = await db.select()
  .from(assets)
  .leftJoin(employees, eq(assets.assignedTo, employees.id));

// INSERT
const newUser = await db.insert(users)
  .values({ username, email, role })
  .returning();

// UPDATE
const updated = await db.update(users)
  .set({ role: 'manager' })
  .where(eq(users.id, userId))
  .returning();

// DELETE
await db.delete(users)
  .where(eq(users.id, userId));

// Complex WHERE clauses
const results = await db.select()
  .from(users)
  .where(
    and(
      eq(users.isActive, true),
      or(
        like(users.username, `%${search}%`),
        like(users.email, `%${search}%`)
      )
    )
  )
  .orderBy(desc(users.createdAt));
```

### ❌ INCORRECT: Database Anti-Patterns

```typescript
// ❌ NEVER USE: Raw SQL strings
const users = await db.execute(`SELECT * FROM users WHERE id = ${userId}`);
// Problem: SQL injection vulnerability

// ❌ NEVER USE: No parameterization
const result = await db.execute(`SELECT * FROM users WHERE username = '${username}'`);
// Problem: SQL injection risk

// ❌ NEVER USE: N+1 queries
for (const asset of assets) {
  const employee = await db.select()
    .from(employees)
    .where(eq(employees.id, asset.assignedTo));
}
// Use JOIN instead

// ❌ NEVER USE: Missing transactions for multi-step operations
await db.delete(assetMaintenance).where(eq(assetMaintenance.assetId, id));
await db.delete(assets).where(eq(assets.id, id));
// Use transaction:
await db.transaction(async (tx) => {
  await tx.delete(assetMaintenance).where(eq(assetMaintenance.assetId, id));
  await tx.delete(assets).where(eq(assets.id, id));
});
```

---

## ✅ Code Review Checklist

### For All Pull Requests

#### Route Organization ⚠️ **CRITICAL**
- [ ] New routes created in `server/routes/` (not in main routes.ts)
- [ ] Router exported as default export
- [ ] Authentication applied at mount level
- [ ] Relative paths used in router (no `/api/` prefix)
- [ ] Business logic extracted to services
- [ ] Route handler < 30 lines
- [ ] Tested all endpoints

#### Authorization
- [ ] Uses `requireRole(ROLES.*)` on backend routes
- [ ] Uses `<RoleGuard>` or `hasPermission()` on frontend
- [ ] No `hasAccess()` calls (deprecated)
- [ ] No direct `user.role === 'admin'` checks
- [ ] No `accessLevel` property usage (deprecated)
- [ ] Tested with all role levels

#### Translations
- [ ] Uses centralized translation files or inline objects
- [ ] Provides both English and Arabic translations
- [ ] Uses `useLanguage()` hook
- [ ] No hardcoded English-only text
- [ ] Consistent translation key naming
- [ ] Tested in both languages

#### API
- [ ] RESTful URL conventions (GET/POST/PUT/DELETE)
- [ ] Authentication middleware added
- [ ] Authorization middleware added
- [ ] Try-catch error handling
- [ ] Appropriate HTTP status codes
- [ ] Audit logging for mutations
- [ ] Input validation with Zod
- [ ] Tested with Postman/Thunder Client

#### Components
- [ ] TypeScript interfaces for props
- [ ] Uses TanStack Query for data fetching
- [ ] Proper component organization
- [ ] No mixing of concerns
- [ ] Follows naming conventions
- [ ] Responsive design

#### Database
- [ ] Uses Drizzle ORM (no raw SQL)
- [ ] Parameterized queries
- [ ] Uses JOIN instead of N+1 queries
- [ ] Transactions for multi-step operations
- [ ] Proper indexes on frequently queried columns

#### General
- [ ] No console.log statements
- [ ] No commented-out code
- [ ] Meaningful variable names
- [ ] Proper error messages
- [ ] Git commit messages follow convention

---

## 🚀 Quick Reference

### Backend Authorization
```typescript
import { requireRole, requirePermission, ROLES, PERMISSIONS } from '../rbac';

// ✅ Use this
requireRole(ROLES.ADMIN)
requireRole(ROLES.MANAGER)
requireRole(ROLES.AGENT)
requirePermission(PERMISSIONS.ASSETS_DELETE)

// ❌ Never use this
hasAccess(4)
hasAccess(3)
user.role === 'admin'
user.accessLevel === '4'
```

### Frontend Authorization
```tsx
import { RoleGuard, hasPermission } from '@/components/auth/RoleGuard';

// ✅ Use this
<RoleGuard allowedRoles={['admin', 'manager']}>...</RoleGuard>
{hasPermission(user?.role, ['admin']) && ...}

// ❌ Never use this
{hasAccess(3) && ...}
{user?.role === 'admin' && ...}
{user?.accessLevel === '4' && ...}
```

### Translations
```tsx
import { useLanguage } from '@/hooks/use-language';
import { useFeatureTranslations } from '@/lib/translations/feature';

// ✅ Use this
const { language } = useLanguage();
const t = useFeatureTranslations(language);
<h1>{t.title}</h1>

// ❌ Never use this
<h1>{language === 'English' ? 'Title' : 'عنوان'}</h1>
<h1>Hardcoded English Only</h1>
```

### API Routes
```typescript
// ✅ Use this
GET    /api/users         // List
GET    /api/users/:id     // Get one
POST   /api/users         // Create
PUT    /api/users/:id     // Update
DELETE /api/users/:id     // Delete

// ❌ Never use this
GET    /api/getUsersList
POST   /api/createUser
POST   /api/deleteUser
```

---

## 📚 Additional Resources

- **RBAC Migration Report**: `docs/RBAC-Analysis-Report.md`
- **RBAC Migration Progress**: `docs/RBAC-Migration-Progress.md`
- **RBAC Benefits**: `docs/RBAC-Migration-Benefits.md`
- **RBAC UI Guide**: `docs/RBAC-UI-Customization-Guide.md`
- **System Documentation**: `docs/simpleit-system-documentation.md`
- **Deployment Guide**: `docs/SimpleIT_Deployment_Guide.md`

---

## 🔄 When to Update This Document

Update these guidelines when:
- New coding patterns are established
- New features introduce new conventions
- Anti-patterns are discovered in code reviews
- Team decides on architectural changes
- New technologies are added to the stack

---

## ✅ Enforcement

### During Development
1. **Self-review**: Check your code against this guide before committing
2. **Linting**: Use ESLint/TypeScript to catch issues early
3. **Testing**: Test with all role levels and both languages

### During Code Review
1. **Reviewer**: Verify checklist items are completed
2. **Ask questions**: If pattern is unclear, ask for clarification
3. **Reference guide**: Link to specific sections when requesting changes

### Consequences of Not Following
- **Code review**: Pull request will be rejected
- **Refactoring**: Code will need to be rewritten
- **Technical debt**: Inconsistencies create maintenance burden
- **Security risks**: Mixed patterns can introduce vulnerabilities

---

**Remember**: These guidelines exist to prevent the mixed patterns we discovered during the RBAC migration. Following them saves time, reduces bugs, and improves code quality. 🎯
