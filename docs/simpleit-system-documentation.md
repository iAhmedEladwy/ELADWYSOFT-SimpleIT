# SimpleIT System Documentation

## 🏢 System Overview
**SimpleIT** is a comprehensive IT asset management system built with React/TypeScript frontend and Node.js/Express backend. The system manages employees, IT assets, support tickets, and provides import/export capabilities for data management.

## 🏗️ Architecture

### Frontend Stack
- **Framework:** React with TypeScript
- **Routing:** Wouter (lightweight routing library)
- **UI Components:** Custom components with Tailwind CSS + shadcn/ui
- **State Management:** TanStack Query (React Query) for server state
- **Authentication:** Context-based auth system
- **Internationalization:** English/Arabic language support

### Backend Stack
- **Runtime:** Node.js with Express
- **Database:** PostgreSQL with Drizzle ORM
- **Authentication:** Session-based with express-session
- **File Processing:** CSV import/export capabilities

## 📁 Key File Structure

```
/src
  /components
    /ui/              # shadcn/ui components (Button, Table, Dialog, etc.)
    /import/          # Import-related components
      FieldMappingInterface.tsx
  /hooks/
    use-language.ts   # Language switching hook
    use-toast.ts      # Toast notifications
  /lib/
    authContext.tsx   # Authentication context
    queryClient.ts    # TanStack Query setup
/server
  routes.ts           # Main API routes
  schema.ts           # Database schema (Drizzle ORM)
  import-schema.ts    # Import field definitions
```

## 🔗 Database Schema (Key Tables)

### Employees Table
```typescript
employees: {
  id: serial primary key
  empId: varchar (auto-generated: EMP-00001)
  englishName: varchar (required)
  arabicName: varchar (optional)
  department: varchar (required)
  title: varchar (required)
  employmentType: enum ['Full-time', 'Part-time', 'Contract', 'Intern', 'Freelance']
  joiningDate: date (required)
  exitDate: date (optional)
  status: enum ['Active', 'Resigned', 'Terminated', 'On Leave']
  personalEmail: varchar (optional)
  corporateEmail: varchar (optional)
  personalMobile: varchar (optional)
  workMobile: varchar (optional)
  idNumber: varchar (required)
  directManager: integer (references employees.id)
}
```

### Assets Table
```typescript
assets: {
  id: serial primary key
  assetId: varchar (auto-generated: AST-00001)
  type: varchar (required)
  brand: varchar (required)
  modelNumber: varchar (optional)
  modelName: varchar (optional)
  serialNumber: varchar (required)
  specs: text (optional)
  status: varchar (default: 'Available')
  purchaseDate: date (optional)
  buyPrice: decimal (optional)
  warrantyExpiryDate: date (optional)
  lifeSpan: integer (optional)
  outOfBoxOs: varchar (optional)
  assignedEmployeeId: integer (references employees.id)
  cpu: varchar (optional)
  ram: varchar (optional)
  storage: varchar (optional)
}
```

### Tickets Table
```typescript
tickets: {
  id: serial primary key
  ticketId: varchar (auto-generated: TKT-000001)
  submittedById: integer (references employees.id, required)
  requestType: varchar (required)
  priority: enum ['Low', 'Medium', 'High']
  description: text (required)
  relatedAssetId: integer (references assets.id, optional)
  status: enum ['Open', 'In Progress', 'Pending', 'Resolved', 'Closed']
  assignedToId: integer (references users.id, optional)
  resolutionNotes: text (optional)
}
```

## 🔐 Authentication & Authorization

### Access Levels
```typescript
1: Employee (Basic access - view own tickets/assets)
2: Agent (Handle tickets, manage assets)
3: Manager (Supervisory access, reports)
4: Admin (Full system access, configuration)
```

### Usage in Components
```typescript
const { hasAccess, user } = useAuth();
// hasAccess(3) - Check if user has level 3+ access
```

## 🔄 Import/Export System

### Import Flow
1. **Schema Definition** (`import-schema.ts`) - Defines available fields per entity
2. **Template Generation** (`/api/{entity}/template`) - Creates CSV templates
3. **File Upload** - User uploads CSV via SystemConfig component
4. **Field Mapping** - FieldMappingInterface maps CSV columns to system fields
5. **Processing** (`/api/import/process`) - Validates and saves data

### Key Import Schema Fields

#### Employees
```typescript
{
  empId: auto-generated
  englishName: required
  arabicName: optional
  department: required
  title: required
  employmentType: required enum
  joiningDate: required date
  exitDate: optional date
  personalEmail: optional
  corporateEmail: optional
  personalMobile: optional
  workMobile: optional
  idNumber: required
  directManager: optional number
}
```

#### Assets
```typescript
{
  assetId: auto-generated
  type: required
  brand: required
  modelNumber: optional
  serialNumber: required
  status: optional enum
  purchaseDate: optional date
  buyPrice: optional number
  lifeSpan: optional number
  outOfBoxOs: optional
  assignedEmployeeId: optional number
  cpu: optional
  ram: optional
  storage: optional
}
```

## 🌐 API Endpoints

### Core CRUD Operations
```
GET    /api/employees          # List all employees
GET    /api/employees/:id      # Get specific employee
POST   /api/employees          # Create employee
PUT    /api/employees/:id      # Update employee
DELETE /api/employees/:id      # Delete employee

# Same pattern for assets, tickets, users
```

### Import/Export
```
GET  /api/employees/template   # Download CSV template
GET  /api/employees/export     # Export all employees as CSV
POST /api/import/process       # Process uploaded CSV files
GET  /api/import/schema/:type  # Get import field schema
```

### System Configuration
```
GET /api/system-config         # Get system settings
PUT /api/system-config         # Update system settings
GET /api/custom-request-types  # Get custom ticket types
GET /api/custom-asset-types    # Get custom asset types
```

## 🎨 UI Components & Patterns

### Common Component Usage
```typescript
// Tables with shadcn/ui
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Header</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Data</TableCell>
    </TableRow>
  </TableBody>
</Table>

// Dialogs for forms
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
    </DialogHeader>
    {/* Form content */}
  </DialogContent>
</Dialog>

// Buttons with variants
<Button variant="outline" size="sm">Action</Button>
```

### Language Support
```typescript
const { language } = useLanguage();
const text = language === 'English' ? 'Save' : 'حفظ';
```

## ⚠️ Common Issues & Solutions

### Import Problems
- **Field not importing:** Check import-schema.ts has correct field definition
- **Date format issues:** Ensure date parsing in routes.ts handles multiple formats
- **Field mapping:** Verify CSV headers match schema displayName values

### Display Issues
- **Empty table columns:** Check field name consistency between frontend and backend
- **Wrong data:** Verify database column names match schema definitions

### Authentication Issues
- **Access denied:** Check hasAccess() level requirements
- **Session problems:** Verify express-session configuration

## 🔧 Development Workflow

### Adding New Features
1. **Database:** Add/modify schema.ts if new tables/fields needed
2. **Backend:** Add API routes in routes.ts
3. **Frontend:** Create/modify components
4. **Import:** Update import-schema.ts if importable
5. **Permissions:** Add access level checks where needed

### Testing Import/Export
1. Generate template: `/api/{entity}/template`
2. Fill with test data
3. Upload via SystemConfig import tab
4. Verify field mapping interface shows all fields
5. Test actual import and check database

### Common File Patterns
- **Components:** Use TypeScript interfaces for props
- **API calls:** Use TanStack Query for data fetching
- **Forms:** Use controlled components with state
- **Validation:** Handle in both frontend and backend
- **Internationalization:** Always provide English/Arabic text

## 📊 System Configuration

### Configurable Settings
- ID prefixes (AST-, EMP-, TKT-)
- Default currency
- System language
- Email SMTP settings
- Department lists
- Custom asset types/brands/statuses
- Custom request types

### User Management
- Role-based access control
- Password management
- User activation/deactivation
- Employee linking

This documentation should serve as a quick reference for understanding SimpleIT's structure and implementing new features efficiently.

## Recent Changes (August 2025)
- **Fixed MaintenanceForm Button Functionality**: Resolved "Save Maintenance Record" button issues by correcting backend field mapping (maintenanceType vs type), fixing cost validation (string vs number), and enhancing dialog event propagation to prevent edit form conflicts
- **Fixed CSV Template Downloads**: Resolved "[object Response]" issue by switching from `apiRequest()` to direct `fetch().text()` for proper CSV content extraction in both SystemConfig and AssetImportExport components
- **Enhanced Employee Table Navigation**: Updated row clicks to open edit forms instead of details view, with preserved "View Details" functionality in dropdown menus
- **Improved Dialog Management**: Fixed dialog closing behavior in AssetsTable to prevent unwanted edit form triggers after maintenance dialog closure
- **Fixed Demo Data Creation System**: Resolved duplicate username constraint violations by implementing timestamp-based unique usernames and proper error handling. Demo data creation and removal now fully functional for all dataset sizes.
- **Fixed Critical Import Field Mapping Issues**: Resolved field mapping mismatch between CSV templates and import processing. Updated CSV template field names to use camelCase (englishName, arabicName, type, brand, etc.) instead of display names with spaces and asterisks. Enhanced frontend field mapping patterns to correctly identify and map CSV columns with asterisks and spaces to corresponding database fields. Fixed SystemConfig.tsx mapping object construction (sourceColumn → targetField). Import system now correctly maps all fields to database records.
- **Enhanced Demo Data Counter Display**: Fixed demo data creation success messages to show accurate counts of created users, employees, and assets instead of showing 0 for all counts.
- **Added Import Data Validation**: Implemented comprehensive data validation and normalization for CSV imports including safe date parsing (handles multiple formats), asset type normalization (maps Smartphone→Phone, Router→Network, etc.), and numeric field validation to prevent database errors during import processing.
- **Converted to Dynamic Asset Types**: Replaced hardcoded asset type ENUMs with flexible varchar fields that use dynamic types from system configuration. Updated import processing, demo data creation, and database schema to support unlimited custom asset types while maintaining backward compatibility. Removed all static type fallbacks - system now accepts any asset type and uses only user-configured types for mapping.
- **Cleaned Demo Data**: Removed all demo users, employees, assets, and tickets while preserving system configuration data (General, Employees, Assets, Tickets, Email, Users settings). Reset ID sequences for clean numbering.

## System Architecture
- **Frontend**: Built with React, TypeScript, Tailwind CSS, and shadcn/ui for a unified, professional UI/UX. Key features include:
    - A centralized System Configuration interface with seven tabs for managing system defaults, employees, assets, tickets, email, users & roles, and import/export with full inline editing capabilities across all tables.
    - An enhanced Import/Export system for Employees, Assets, and Tickets featuring a two-step process with file preview, field mapping, CSV support, comprehensive validation, template downloads, drag-and-drop uploads, and progress tracking. CSV template downloads are fully functional with proper authentication and content extraction.
    - Unified UI patterns across all modules (Assets, Tickets, Employees) with consistent filter cards, layouts, and enhanced navigation. Employee and asset tables feature row-click editing with preserved details view access via dropdown menus.
    - Flexible custom asset status system replacing rigid ENUM constraints with unlimited custom statuses, dynamic color configuration, and seamless migration of default statuses.
    - Interactive grid editing for key fields in tables and comprehensive forms with validation and auto-save.
    - Bilingual support (English/Arabic).
- **Backend**: Developed with Express.js and TypeScript, enforcing RESTful API patterns and role-based access control. It includes robust primary key generation using system config prefixes, advanced CSV parsing with multiple date format support, comprehensive data validation, and file preview APIs.
- **Database**: PostgreSQL with Drizzle ORM, designed to support ITIL-compliant asset and ticket management, hardware specifications, maintenance records, and employee profiles.
- **Authentication**: Cookie-based sessions with a PostgreSQL store, secured by a 4-level ITIL-compliant Role-Based Access Control (RBAC) system (Employee, Agent, Manager, Admin). Includes hierarchical permissions, route/component-level enforcement, email-based password reset, and an emergency login mechanism.
- **Real-time**: Implements WebSocket support for notifications.
- **System Design**: Emphasizes modularity, comprehensive error handling, type safety (TypeScript interfaces), and abstraction layers. Supports multi-platform deployment via Docker, Ubuntu Server, and Windows PowerShell scripts.

## External Dependencies
- **PostgreSQL**: Primary database for persistent storage.
- **Express.js**: Backend web application framework.
- **React**: Frontend JavaScript library.
- **Tailwind CSS**: Utility-first CSS framework for styling.
- **shadcn/ui**: Component library for React.
- **Drizzle ORM**: TypeScript ORM for PostgreSQL.
- **bcrypt**: For password hashing.
- **Passport.js**: Authentication middleware for Node.js.
- **PM2**: Production process manager for Node.js applications (used in Ubuntu deployment).
- **Nginx**: Web server (used in Ubuntu deployment).
- **Zod**: Schema validation library.