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