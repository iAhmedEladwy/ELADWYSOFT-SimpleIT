# Development Guidelines - Quick Reference Card

> **Print this and keep at your desk!** ⭐

---

## 🔐 Authorization (Backend)

### ✅ DO THIS
```typescript
import { requireRole, ROLES } from '../rbac';

app.post("/api/users", 
  authenticateUser, 
  requireRole(ROLES.MANAGER),
  async (req, res) => { /* ... */ }
);
```

### ❌ NEVER DO THIS
```typescript
hasAccess(3)                    // Deprecated
user.role === 'admin'           // Direct check
user.accessLevel === '4'        // Deprecated
```

---

## 🎨 Authorization (Frontend)

### ✅ DO THIS
```tsx
import { RoleGuard } from '@/components/auth/RoleGuard';

<RoleGuard allowedRoles={['admin', 'manager']}>
  <Button>Delete</Button>
</RoleGuard>
```

### ❌ NEVER DO THIS
```tsx
{hasAccess(3) && <Button>Delete</Button>}
{user?.role === 'admin' && <Button>Delete</Button>}
```

---

## 🌐 Translations

### ✅ DO THIS
```tsx
// Create: client/src/lib/translations/feature.ts
export const useFeatureTranslations = (language) => {
  return language === 'English' 
    ? { title: 'Title', save: 'Save' }
    : { title: 'عنوان', save: 'حفظ' };
};

// Use in component
const t = useFeatureTranslations(language);
<h1>{t.title}</h1>
```

### ❌ NEVER DO THIS
```tsx
<h1>{language === 'English' ? 'Title' : 'عنوان'}</h1>
<h1>Hardcoded English Only</h1>
```

---

## 🌐 API Routes

### ✅ DO THIS
```typescript
GET    /api/users         // List all
GET    /api/users/:id     // Get one
POST   /api/users         // Create
PUT    /api/users/:id     // Update
DELETE /api/users/:id     // Delete
```

### ❌ NEVER DO THIS
```typescript
GET    /api/getUsersList
POST   /api/createUser
POST   /api/deleteUser
```

---

## 📋 Before Every Commit

- [ ] No `hasAccess()` calls
- [ ] No direct `user.role ===` checks
- [ ] Both English & Arabic translations
- [ ] RESTful API URLs
- [ ] Uses `requireRole(ROLES.*)`
- [ ] Uses `<RoleGuard>` components
- [ ] Tested with all role levels
- [ ] No console.log statements

---

## 🆘 When In Doubt

1. Check `DEVELOPMENT-GUIDELINES.md`
2. Search existing code for examples
3. Ask team lead
4. Check docs in `docs/` folder

---

**Full Guide**: `DEVELOPMENT-GUIDELINES.md`
