# Employee Portal Implementation - Complete Instructions for VS Code Copilot

## 📋 Project Context

**Project:** SimpleIT Asset Management System v0.4.3  
**Tech Stack:** React 18.3.1, TypeScript 5.6.3, Express 4.21.2, PostgreSQL, Drizzle ORM  
**Goal:** Create employee self-service portal with NO schema changes, using existing RBAC and translation patterns

---

## 🎯 Implementation Requirements

### Core Requirements:
1. ✅ Use same login screen - redirect based on role after authentication
2. ✅ Use existing RBAC system (`server/rbac.ts` - `ROLES.EMPLOYEE`)
3. ✅ NO database schema changes - work with existing tables
4. ✅ Follow current translation pattern using `useLanguage()` hook
5. ✅ Create separate backend routes file `server/portal/routes.ts` (don't bloat `server/routes.ts`)
6. ✅ Bilingual support (English/Arabic) for all text

### Existing RBAC Roles:
```typescript
// From server/rbac.ts
export const ROLES = {
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  AGENT: 'Agent',
  EMPLOYEE: 'Employee'  // ← We use this for portal
};

// Employee permissions (already defined)
[ROLES.EMPLOYEE]: [
  PERMISSIONS.ASSETS_VIEW_OWN,      // Can view own assets
  PERMISSIONS.TICKETS_VIEW_OWN,     // Can view own tickets
  PERMISSIONS.TICKETS_CREATE        // Can create tickets
]
```

### Existing Database Schema (DO NOT MODIFY):
```typescript
// users table
{
  id: number
  username: string
  role: string              // 'Employee', 'Agent', 'Manager', 'Admin'
  employeeId?: number       // Link to employees table
  // ... other fields
}

// employees table
{
  id: number
  empId: string
  englishName: string
  arabicName?: string
  department: string
  title: string
  status: string           // 'Active', 'Resigned', etc.
  corporateEmail?: string
  personalEmail?: string
  workMobile?: string
  personalMobile?: string
  // ... other fields
}

// assets table
{
  id: number
  assetId: string
  type: string
  brand: string
  modelName: string
  serialNumber: string
  status: string
  assignedEmployeeId?: number  // Link to employees table
  // ... other fields
}

// tickets table
{
  id: number
  ticketId: string
  title: string
  description: string
  type: string
  priority: string
  status: string
  submittedById: number      // Link to employees table
  assignedToId?: number      // Link to users table
  relatedAssetId?: number
  // ... other fields
}
```

### Translation Pattern (MUST FOLLOW):
```typescript
// Use existing hook
import { useLanguage } from '@/hooks/use-language';

// In component
const { language } = useLanguage();

// Create inline translation object
const translations = {
  title: language === 'English' ? 'My Assets' : 'أصولي',
  description: language === 'English' ? 'View your assigned assets' : 'عرض الأصول المخصصة لك',
  // ... all text must be bilingual
};

// Use in JSX
<h1>{translations.title}</h1>
```

---

## 📂 FILE STRUCTURE TO CREATE

```
server/
└── portal/
    ├── routes.ts                    # NEW - All employee portal API endpoints
    └── middleware.ts                # NEW - Portal-specific middleware

client/src/
├── pages/
│   ├── Login.tsx                    # MODIFY - Add role-based redirect
│   └── portal/                      # NEW FOLDER
│       ├── PortalDashboard.tsx      # NEW - Main dashboard for employees
│       ├── MyAssets.tsx             # NEW - View assigned assets
│       ├── MyTickets.tsx            # NEW - View/manage own tickets
│       ├── CreateTicket.tsx         # NEW - Create new ticket
│       └── MyProfile.tsx            # NEW - View employee profile
├── components/
│   └── portal/                      # NEW FOLDER
│       ├── PortalLayout.tsx         # NEW - Portal wrapper layout
│       ├── PortalHeader.tsx         # NEW - Portal header with navigation
│       └── PortalAssetCard.tsx      # NEW - Asset display card
└── App.tsx                          # MODIFY - Add portal routes

server/
└── index.ts                         # MODIFY - Mount portal routes
```

---

## 🔧 STEP-BY-STEP IMPLEMENTATION

---

## **STEP 1: Create Backend Portal Routes**

### File: `server/portal/routes.ts` (NEW FILE)

```typescript
/**
 * Employee Portal API Routes
 * 
 * Context: SimpleIT v0.4.3 - Employee self-service portal endpoints
 * Tech Stack: Express 4.21.2, PostgreSQL, Drizzle ORM
 * 
 * Requirements:
 * - All endpoints use existing RBAC (requireRole from server/rbac.ts)
 * - Use ROLES.EMPLOYEE for access control
 * - NO schema changes - work with existing tables
 * - Employees can ONLY access their own data
 * - Return proper HTTP status codes (200, 401, 403, 404, 500)
 * - Include try-catch error handling
 * 
 * Security:
 * - Always verify employeeId matches authenticated user
 * - Use authenticateUser middleware (from server/routes.ts)
 * - Use requireRole(ROLES.EMPLOYEE) for authorization
 * - Validate user can only access their own resources
 */

import { Router } from 'express';
import { storage } from '../storage';
import { requireRole, ROLES } from '../rbac';
import type { AuthenticatedRequest } from '../rbac';

const router = Router();

// Note: authenticateUser middleware is applied at the app level in server/index.ts
// All routes here assume req.user is already populated

/**
 * GET /api/portal/my-assets
 * Get all assets assigned to the authenticated employee
 * 
 * Authorization: Employee role
 * Returns: Array of asset objects assigned to employee
 */
router.get('/my-assets', 
  requireRole(ROLES.EMPLOYEE),
  async (req: AuthenticatedRequest, res) => {
    try {
      // Get employeeId from authenticated user
      const employeeId = req.user?.employeeId;
      
      if (!employeeId) {
        return res.status(400).json({ 
          message: 'Employee ID not found for user' 
        });
      }

      // Get all assets assigned to this employee
      const assets = await storage.getAssets();
      const myAssets = assets.filter(asset => 
        asset.assignedEmployeeId === employeeId
      );

      res.json(myAssets);
    } catch (error) {
      console.error('Error fetching employee assets:', error);
      res.status(500).json({ 
        message: 'Failed to fetch assets' 
      });
    }
  }
);

/**
 * GET /api/portal/my-tickets
 * Get all tickets submitted by the authenticated employee
 * 
 * Authorization: Employee role
 * Query params: status (optional) - filter by ticket status
 * Returns: Array of ticket objects submitted by employee
 */
router.get('/my-tickets',
  requireRole(ROLES.EMPLOYEE),
  async (req: AuthenticatedRequest, res) => {
    try {
      const employeeId = req.user?.employeeId;
      
      if (!employeeId) {
        return res.status(400).json({ 
          message: 'Employee ID not found for user' 
        });
      }

      // Get all tickets submitted by this employee
      const allTickets = await storage.getAllTickets();
      let myTickets = allTickets.filter(ticket => 
        ticket.submittedById === employeeId
      );

      // Optional filter by status
      const statusFilter = req.query.status as string;
      if (statusFilter) {
        myTickets = myTickets.filter(ticket => 
          ticket.status === statusFilter
        );
      }

      res.json(myTickets);
    } catch (error) {
      console.error('Error fetching employee tickets:', error);
      res.status(500).json({ 
        message: 'Failed to fetch tickets' 
      });
    }
  }
);

/**
 * GET /api/portal/my-tickets/:id
 * Get a specific ticket by ID (only if submitted by employee)
 * 
 * Authorization: Employee role
 * Params: id - ticket ID
 * Returns: Single ticket object or 404
 */
router.get('/my-tickets/:id',
  requireRole(ROLES.EMPLOYEE),
  async (req: AuthenticatedRequest, res) => {
    try {
      const employeeId = req.user?.employeeId;
      const ticketId = parseInt(req.params.id);

      if (!employeeId) {
        return res.status(400).json({ 
          message: 'Employee ID not found for user' 
        });
      }

      const ticket = await storage.getTicket(ticketId);

      if (!ticket) {
        return res.status(404).json({ 
          message: 'Ticket not found' 
        });
      }

      // Security: Verify ticket belongs to this employee
      if (ticket.submittedById !== employeeId) {
        return res.status(403).json({ 
          message: 'You do not have permission to view this ticket' 
        });
      }

      res.json(ticket);
    } catch (error) {
      console.error('Error fetching ticket:', error);
      res.status(500).json({ 
        message: 'Failed to fetch ticket' 
      });
    }
  }
);

/**
 * POST /api/portal/tickets
 * Create a new ticket for the authenticated employee
 * 
 * Authorization: Employee role
 * Body: { title, description, type, categoryId, urgency, impact, relatedAssetId? }
 * Returns: Created ticket object
 */
router.post('/tickets',
  requireRole(ROLES.EMPLOYEE),
  async (req: AuthenticatedRequest, res) => {
    try {
      const employeeId = req.user?.employeeId;

      if (!employeeId) {
        return res.status(400).json({ 
          message: 'Employee ID not found for user' 
        });
      }

      const { 
        title, 
        description, 
        type, 
        categoryId,
        urgency, 
        impact,
        relatedAssetId 
      } = req.body;

      // Validation
      if (!title || !description || !type || !categoryId) {
        return res.status(400).json({ 
          message: 'Missing required fields: title, description, type, categoryId' 
        });
      }

      // If relatedAssetId provided, verify it belongs to this employee
      if (relatedAssetId) {
        const asset = await storage.getAsset(relatedAssetId);
        if (!asset || asset.assignedEmployeeId !== employeeId) {
          return res.status(403).json({ 
            message: 'Asset not assigned to you' 
          });
        }
      }

      // Create ticket
      const ticketData = {
        title,
        description,
        type,
        categoryId,
        urgency: urgency || 'Medium',
        impact: impact || 'Medium',
        submittedById: employeeId,
        relatedAssetId: relatedAssetId || null,
        status: 'Open',
        assignedToId: null,
      };

      const newTicket = await storage.createTicket(ticketData);

      res.status(201).json(newTicket);
    } catch (error) {
      console.error('Error creating ticket:', error);
      res.status(500).json({ 
        message: 'Failed to create ticket' 
      });
    }
  }
);

/**
 * POST /api/portal/my-tickets/:id/comments
 * Add a comment to employee's own ticket
 * 
 * Authorization: Employee role
 * Params: id - ticket ID
 * Body: { content }
 * Returns: Created comment object
 */
router.post('/my-tickets/:id/comments',
  requireRole(ROLES.EMPLOYEE),
  async (req: AuthenticatedRequest, res) => {
    try {
      const employeeId = req.user?.employeeId;
      const userId = req.user?.id;
      const ticketId = parseInt(req.params.id);
      const { content } = req.body;

      if (!employeeId || !userId) {
        return res.status(400).json({ 
          message: 'User information not found' 
        });
      }

      if (!content || content.trim() === '') {
        return res.status(400).json({ 
          message: 'Comment content is required' 
        });
      }

      // Verify ticket belongs to this employee
      const ticket = await storage.getTicket(ticketId);
      if (!ticket) {
        return res.status(404).json({ 
          message: 'Ticket not found' 
        });
      }

      if (ticket.submittedById !== employeeId) {
        return res.status(403).json({ 
          message: 'You do not have permission to comment on this ticket' 
        });
      }

      // Create comment using storage method
      const comment = await storage.createTicketComment({
        ticketId,
        userId,
        content: content.trim(),
        isPrivate: false
      });

      res.status(201).json(comment);
    } catch (error) {
      console.error('Error creating comment:', error);
      res.status(500).json({ 
        message: 'Failed to create comment' 
      });
    }
  }
);

/**
 * GET /api/portal/my-profile
 * Get authenticated employee's profile information
 * 
 * Authorization: Employee role
 * Returns: Employee object with profile details
 */
router.get('/my-profile',
  requireRole(ROLES.EMPLOYEE),
  async (req: AuthenticatedRequest, res) => {
    try {
      const employeeId = req.user?.employeeId;

      if (!employeeId) {
        return res.status(400).json({ 
          message: 'Employee ID not found for user' 
        });
      }

      const employee = await storage.getEmployee(employeeId);

      if (!employee) {
        return res.status(404).json({ 
          message: 'Employee profile not found' 
        });
      }

      // Return employee data (read-only for employees)
      res.json(employee);
    } catch (error) {
      console.error('Error fetching employee profile:', error);
      res.status(500).json({ 
        message: 'Failed to fetch profile' 
      });
    }
  }
);

/**
 * GET /api/portal/my-assets/:assetId
 * Get details of a specific asset assigned to employee
 * 
 * Authorization: Employee role
 * Params: assetId - asset ID
 * Returns: Asset object or 404
 */
router.get('/my-assets/:assetId',
  requireRole(ROLES.EMPLOYEE),
  async (req: AuthenticatedRequest, res) => {
    try {
      const employeeId = req.user?.employeeId;
      const assetId = parseInt(req.params.assetId);

      if (!employeeId) {
        return res.status(400).json({ 
          message: 'Employee ID not found for user' 
        });
      }

      const asset = await storage.getAsset(assetId);

      if (!asset) {
        return res.status(404).json({ 
          message: 'Asset not found' 
        });
      }

      // Security: Verify asset is assigned to this employee
      if (asset.assignedEmployeeId !== employeeId) {
        return res.status(403).json({ 
          message: 'This asset is not assigned to you' 
        });
      }

      res.json(asset);
    } catch (error) {
      console.error('Error fetching asset:', error);
      res.status(500).json({ 
        message: 'Failed to fetch asset' 
      });
    }
  }
);

/**
 * GET /api/portal/categories
 * Get all active ticket categories for ticket creation
 * 
 * Authorization: Employee role
 * Returns: Array of category objects
 */
router.get('/categories',
  requireRole(ROLES.EMPLOYEE),
  async (req: AuthenticatedRequest, res) => {
    try {
      const categories = await storage.getCategories();
      
      // Only return active categories
      const activeCategories = categories.filter(cat => cat.isActive !== false);
      
      res.json(activeCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ 
        message: 'Failed to fetch categories' 
      });
    }
  }
);

export default router;
```

---

## **STEP 2: Mount Portal Routes in Server**

### File: `server/index.ts` (MODIFY EXISTING)

```typescript
// At the top with other imports, ADD:
import portalRoutes from './portal/routes';

// After existing route mounts (look for app.use('/api', routes)), ADD:
// Mount employee portal routes
app.use('/api/portal', portalRoutes);
```

**Instructions for Copilot:**
- Find where main routes are mounted (search for `app.use('/api'`)
- Add the portal routes mount right after
- Keep the same pattern as existing route mounts

---

## **STEP 3: Modify Login Component**

### File: `client/src/pages/Login.tsx` (MODIFY EXISTING)

**Instructions for Copilot:**

Find the login success handler (where `navigate('/')` is called after successful login).

Replace the simple `navigate('/')` with role-based routing:

```typescript
// After successful login mutation, ADD this logic:

// Get user role from the response
const userResponse = await fetch('/api/me', {
  credentials: 'include'
});

if (userResponse.ok) {
  const userData = await userResponse.json();
  
  // Redirect based on role
  if (userData.role?.toLowerCase() === 'employee') {
    navigate('/portal');
  } else {
    navigate('/');  // Agents, Managers, Admins go to main system
  }
} else {
  navigate('/');  // Fallback to main system
}
```

**Context for modification:**
- Login component uses TanStack Query mutation for login
- After successful login, we need to fetch user data to check role
- Current code just does `navigate('/')` - we need to make it conditional
- Must handle lowercase/uppercase role variations ('Employee', 'employee')

---

## **STEP 4: Create Portal Layout Component**

### File: `client/src/components/portal/PortalLayout.tsx` (NEW FILE)

```typescript
/**
 * Employee Portal Layout Component
 * 
 * Context: SimpleIT v0.4.3 - Wrapper layout for employee portal pages
 * 
 * Requirements:
 * - Only accessible to users with 'Employee' role
 * - Redirects non-employees to main system
 * - Uses existing useLanguage() hook for translations
 * - Includes portal-specific header and navigation
 * - Bilingual support (English/Arabic)
 * 
 * Props:
 * - children: React.ReactNode - Page content to render
 */

import { useAuth } from '@/lib/authContext';
import { Navigate } from 'wouter';
import { useLanguage } from '@/hooks/use-language';
import PortalHeader from './PortalHeader';

interface PortalLayoutProps {
  children: React.ReactNode;
}

export default function PortalLayout({ children }: PortalLayoutProps) {
  const { user, isLoading } = useAuth();
  const { language } = useLanguage();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">
          {language === 'English' ? 'Loading...' : 'جاري التحميل...'}
        </div>
      </div>
    );
  }

  // Redirect if not logged in
  if (!user) {
    return <Navigate to="/login" />;
  }

  // Security: Redirect non-employees to main system
  if (user.role?.toLowerCase() !== 'employee') {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen bg-gray-50" dir={language === 'Arabic' ? 'rtl' : 'ltr'}>
      <PortalHeader />
      
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-gray-600">
          {language === 'English' 
            ? '© 2025 SimpleIT - Employee Portal' 
            : '© 2025 SimpleIT - بوابة الموظفين'}
        </div>
      </footer>
    </div>
  );
}
```

---

## **STEP 5: Create Portal Header Component**

### File: `client/src/components/portal/PortalHeader.tsx` (NEW FILE)

```typescript
/**
 * Employee Portal Header Component
 * 
 * Context: SimpleIT v0.4.3 - Navigation header for employee portal
 * 
 * Features:
 * - Portal navigation links (My Assets, My Tickets, My Profile)
 * - Language switcher
 * - Logout button
 * - Displays current employee name
 * - Responsive design for mobile
 * - Bilingual support (English/Arabic)
 */

import { useAuth } from '@/lib/authContext';
import { useLanguage } from '@/hooks/use-language';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Menu, User, LogOut, Languages } from 'lucide-react';

export default function PortalHeader() {
  const { user, logout } = useAuth();
  const { language, toggleLanguage } = useLanguage();
  const [location, navigate] = useLocation();

  const translations = {
    portalTitle: language === 'English' ? 'Employee Portal' : 'بوابة الموظفين',
    myAssets: language === 'English' ? 'My Assets' : 'أصولي',
    myTickets: language === 'English' ? 'My Tickets' : 'تذاكري',
    myProfile: language === 'English' ? 'My Profile' : 'ملفي الشخصي',
    logout: language === 'English' ? 'Logout' : 'تسجيل الخروج',
    welcome: language === 'English' ? 'Welcome' : 'مرحباً',
    menu: language === 'English' ? 'Menu' : 'القائمة',
  };

  const navItems = [
    { path: '/portal', label: translations.myAssets, icon: '📦' },
    { path: '/portal/my-tickets', label: translations.myTickets, icon: '🎫' },
    { path: '/portal/my-profile', label: translations.myProfile, icon: '👤' },
  ];

  const isActive = (path: string) => location === path;

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Title */}
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold text-primary">
              {translations.portalTitle}
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                  isActive(item.path)
                    ? 'bg-primary text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Right side: Language & User Menu */}
          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleLanguage()}
              className="hidden sm:flex items-center gap-2"
            >
              <Languages className="h-4 w-4" />
              {language === 'English' ? 'عربي' : 'English'}
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {translations.welcome}, {user?.username}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate('/portal/my-profile')}>
                  <User className="h-4 w-4 mr-2" />
                  {translations.myProfile}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => toggleLanguage()}
                  className="sm:hidden"
                >
                  <Languages className="h-4 w-4 mr-2" />
                  {language === 'English' ? 'عربي' : 'English'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  {translations.logout}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild className="md:hidden">
                <Button variant="outline" size="sm">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {navItems.map((item) => (
                  <DropdownMenuItem 
                    key={item.path}
                    onClick={() => navigate(item.path)}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
```

---

## **STEP 6: Create Portal Pages**

### File: `client/src/pages/portal/PortalDashboard.tsx` (NEW FILE)

This will redirect to My Assets as the main landing page.

```typescript
/**
 * Employee Portal Dashboard (Landing Page)
 * 
 * Context: SimpleIT v0.4.3 - Main entry point for employee portal
 * 
 * Behavior:
 * - Redirects to /portal/my-assets (main view for employees)
 * - Could be enhanced later with dashboard widgets
 */

import { useEffect } from 'react';
import { useLocation } from 'wouter';

export default function PortalDashboard() {
  const [, navigate] = useLocation();

  useEffect(() => {
    // Redirect to My Assets as the default view
    navigate('/portal/my-assets');
  }, [navigate]);

  return null;
}
```

---

### File: `client/src/pages/portal/MyAssets.tsx` (NEW FILE)

```typescript
/**
 * My Assets Page - Employee Portal
 * 
 * Context: SimpleIT v0.4.3 - View assets assigned to authenticated employee
 * 
 * Features:
 * - Displays all assets assigned to the employee
 * - Shows asset details (ID, type, brand, model, serial number)
 * - "Report Issue" button to create ticket for asset
 * - Empty state when no assets assigned
 * - Loading state while fetching data
 * - Error handling
 * - Bilingual support (English/Arabic)
 * 
 * API Endpoint: GET /api/portal/my-assets
 * Authorization: Employee role (handled by backend)
 */

import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Package } from 'lucide-react';
import PortalLayout from '@/components/portal/PortalLayout';

export default function MyAssets() {
  const { language } = useLanguage();
  const [, navigate] = useLocation();

  const translations = {
    title: language === 'English' ? 'My Assigned Assets' : 'الأصول المخصصة لي',
    noAssets: language === 'English' 
      ? 'No assets are currently assigned to you' 
      : 'لا توجد أصول مخصصة لك حالياً',
    loading: language === 'English' ? 'Loading your assets...' : 'جاري تحميل أصولك...',
    error: language === 'English' ? 'Failed to load assets' : 'فشل تحميل الأصول',
    assetId: language === 'English' ? 'Asset ID' : 'رقم الأصل',
    type: language === 'English' ? 'Type' : 'النوع',
    brand: language === 'English' ? 'Brand' : 'العلامة التجارية',
    model: language === 'English' ? 'Model' : 'الموديل',
    serialNumber: language === 'English' ? 'Serial Number' : 'الرقم التسلسلي',
    status: language === 'English' ? 'Status' : 'الحالة',
    reportIssue: language === 'English' ? 'Report Issue' : 'الإبلاغ عن مشكلة',
  };

  // Fetch employee's assets
  const { data: assets, isLoading, error } = useQuery({
    queryKey: ['/api/portal/my-assets'],
    queryFn: async () => {
      const response = await fetch('/api/portal/my-assets', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch assets');
      }
      
      return response.json();
    },
  });

  return (
    <PortalLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold">{translations.title}</h1>
          <p className="text-gray-600 mt-2">
            {language === 'English' 
              ? 'View and manage the IT assets assigned to you'
              : 'عرض وإدارة أصول تكنولوجيا المعلومات المخصصة لك'}
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">{translations.loading}</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-600">{translations.error}</p>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && !error && assets?.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-16 w-16 text-gray-400 mb-4" />
              <p className="text-gray-600 text-lg">{translations.noAssets}</p>
            </CardContent>
          </Card>
        )}

        {/* Assets Grid */}
        {!isLoading && !error && assets?.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assets.map((asset: any) => (
              <Card key={asset.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="text-lg">{asset.assetId}</span>
                    <Badge variant={asset.status === 'Available' ? 'success' : 'default'}>
                      {asset.status}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{translations.type}:</span>
                      <span className="font-medium">{asset.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{translations.brand}:</span>
                      <span className="font-medium">{asset.brand}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{translations.model}:</span>
                      <span className="font-medium">{asset.modelName || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{translations.serialNumber}:</span>
                      <span className="font-medium text-xs">{asset.serialNumber}</span>
                    </div>
                  </div>

                  <Button 
                    className="w-full mt-4" 
                    variant="outline"
                    onClick={() => navigate(`/portal/create-ticket?assetId=${asset.id}`)}
                  >
                    {translations.reportIssue}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
```

---

### File: `client/src/pages/portal/MyTickets.tsx` (NEW FILE)

```typescript
/**
 * My Tickets Page - Employee Portal
 * 
 * Context: SimpleIT v0.4.3 - View and manage tickets created by employee
 * 
 * Features:
 * - List all tickets submitted by employee
 * - Filter by status (All, Open, In Progress, Resolved, Closed)
 * - Create new ticket button
 * - Click ticket to view details
 * - Color-coded priority badges
 * - Empty state for no tickets
 * - Bilingual support (English/Arabic)
 * 
 * API Endpoint: GET /api/portal/my-tickets
 */

import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { useLocation } from 'wouter';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Ticket, AlertCircle } from 'lucide-react';
import PortalLayout from '@/components/portal/PortalLayout';
import { useTicketTranslations } from '@/lib/translations/tickets';

export default function MyTickets() {
  const { language } = useLanguage();
  const [, navigate] = useLocation();
  const t = useTicketTranslations(language);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch employee's tickets
  const { data: tickets, isLoading, error } = useQuery({
    queryKey: ['/api/portal/my-tickets', statusFilter],
    queryFn: async () => {
      const url = statusFilter === 'all' 
        ? '/api/portal/my-tickets'
        : `/api/portal/my-tickets?status=${statusFilter}`;
        
      const response = await fetch(url, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch tickets');
      }
      
      return response.json();
    },
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'High': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <PortalLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">{t.myTickets}</h1>
            <p className="text-gray-600 mt-2">
              {language === 'English'
                ? 'Track and manage your support tickets'
                : 'تتبع وإدارة تذاكر الدعم الخاصة بك'}
            </p>
          </div>
          <Button 
            onClick={() => navigate('/portal/create-ticket')}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {t.createTicket}
          </Button>
        </div>

        {/* Status Filter Tabs */}
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="all">{t.all}</TabsTrigger>
            <TabsTrigger value="Open">{t.open}</TabsTrigger>
            <TabsTrigger value="In Progress">{t.inProgress}</TabsTrigger>
            <TabsTrigger value="Resolved">{t.resolved}</TabsTrigger>
            <TabsTrigger value="Closed">{t.closed}</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">{t.loading}</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-600">{t.error}</p>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && !error && tickets?.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Ticket className="h-16 w-16 text-gray-400 mb-4" />
              <p className="text-gray-600 text-lg mb-4">{t.noTickets}</p>
              <Button onClick={() => navigate('/portal/create-ticket')}>
                {t.createTicket}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Tickets List */}
        {!isLoading && !error && tickets?.length > 0 && (
          <div className="space-y-4">
            {tickets.map((ticket: any) => (
              <Card 
                key={ticket.id} 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/portal/my-tickets/${ticket.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono text-sm text-gray-600">
                          {ticket.ticketId}
                        </span>
                        <Badge variant={ticket.status === 'Open' ? 'destructive' : 'default'}>
                          {ticket.status}
                        </Badge>
                        <Badge className={getPriorityColor(ticket.priority)}>
                          {ticket.priority}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-lg mb-2">{ticket.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {ticket.description}
                      </p>
                      <div className="flex gap-4 mt-3 text-xs text-gray-500">
                        <span>{t.type}: {ticket.type}</span>
                        <span>•</span>
                        <span>
                          {language === 'English' ? 'Created' : 'تم الإنشاء'}: {new Date(ticket.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
```

---

## **STEP 7: Add Portal Routes to App**

### File: `client/src/App.tsx` (MODIFY EXISTING)

**Instructions for Copilot:**

Find the routing section (where `<Route>` components are defined).

Add these NEW routes BEFORE the existing routes:

```typescript
// Import portal pages at the top
import PortalDashboard from '@/pages/portal/PortalDashboard';
import MyAssets from '@/pages/portal/MyAssets';
import MyTickets from '@/pages/portal/MyTickets';
// ... other portal imports as you create them

// In the Router section, ADD these routes:
<Route path="/portal" component={PortalDashboard} />
<Route path="/portal/my-assets" component={MyAssets} />
<Route path="/portal/my-tickets" component={MyTickets} />
<Route path="/portal/my-tickets/:id" component={TicketDetail} />
<Route path="/portal/create-ticket" component={CreateTicket} />
<Route path="/portal/my-profile" component={MyProfile} />
```

---

## 🎨 STYLING NOTES

- Use existing Tailwind CSS classes
- Follow current component patterns from `client/src/components/ui/`
- Use `shadcn/ui` components: Card, Button, Badge, Tabs, etc.
- Maintain responsive design (`md:`, `lg:` breakpoints)
- Support RTL layout with `dir={language === 'Arabic' ? 'rtl' : 'ltr'}`

---

## ✅ TESTING CHECKLIST

After implementation, test:

1. **Authentication**
   - [ ] Employee user can login and is redirected to `/portal`
   - [ ] Non-employee user is redirected to `/` (main system)
   - [ ] Accessing `/portal` without login redirects to `/login`

2. **Portal Routes**
   - [ ] `/portal` redirects to `/portal/my-assets`
   - [ ] All portal pages load correctly
   - [ ] Navigation between portal pages works

3. **Security**
   - [ ] Non-employees cannot access `/portal/*` routes (redirected to `/`)
   - [ ] Backend returns 403 for non-employee API calls
   - [ ] Employee can only see their own assets/tickets/profile

4. **Functionality**
   - [ ] My Assets page shows employee's assets
   - [ ] My Tickets page shows employee's tickets
   - [ ] Create Ticket form works
   - [ ] My Profile page displays employee information

5. **Translations**
   - [ ] All text appears in English when language is English
   - [ ] All text appears in Arabic when language is Arabic
   - [ ] Language switcher in header works
   - [ ] RTL layout works correctly for Arabic

6. **Mobile Responsive**
   - [ ] All pages work on mobile devices
   - [ ] Mobile menu in header works
   - [ ] Cards and grids adjust to screen size

---

## 🐛 COMMON ISSUES & SOLUTIONS

### Issue: "Cannot find module '@/components/portal/PortalLayout'"
**Solution:** Ensure you've created all files in the correct locations

### Issue: 403 Forbidden on API calls
**Solution:** Check that user has 'Employee' role in database and session is valid

### Issue: Redirect loop between /portal and /login
**Solution:** Verify `authenticateUser` middleware is applied and session persists

### Issue: Assets not showing despite being assigned
**Solution:** Verify `assignedEmployeeId` in assets table matches user's `employeeId`

### Issue: Arabic text not displaying correctly
**Solution:** Ensure `dir="rtl"` is set in PortalLayout when language is Arabic

---

## 📚 REFERENCE FILES

**Existing files to reference for patterns:**

1. **Translation pattern:** `client/src/lib/translations/tickets.ts`
2. **RBAC roles:** `server/rbac.ts`
3. **Storage methods:** `server/storage.ts`
4. **Component patterns:** `client/src/components/tickets/TicketsTable.tsx`
5. **API patterns:** `server/routes.ts` (existing main routes)

---

## ✨ FINAL NOTES FOR COPILOT

- This is a self-contained employee portal module
- NO database schema changes required
- Uses existing authentication and RBAC systems
- Follows established code patterns from the project
- Focus on simplicity and user experience for employees
- Maintain security: employees can ONLY access their own data
- All text must be bilingual (English/Arabic)
- Test thoroughly before considering complete

---

**When creating each file, Copilot should:**
1. Include the context comment at the top
2. Follow the exact patterns shown
3. Use TypeScript for type safety
4. Include proper error handling
5. Add bilingual translations
6. Test the security checks
7. Ensure mobile responsiveness