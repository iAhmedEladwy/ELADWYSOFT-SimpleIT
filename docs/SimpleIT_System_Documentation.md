# SimpleIT - IT Asset Management System

## System Documentation

### Overview
SimpleIT is a comprehensive IT asset management solution designed to streamline the tracking and management of IT assets, employee information, tickets, and related activities. The system provides an intuitive interface for IT administrators and staff to manage the entire lifecycle of IT assets, from acquisition to disposal.

### Key Features

#### 1. User Management
- Multi-level user access control (Admin, Manager, Standard)
- Secure login and authentication
- User activity tracking and audit logs

#### 2. Asset Management
- Complete asset lifecycle tracking
- Asset categorization by type, brand, and status
- Asset check-in/check-out functionality
- Depreciation calculation
- Maintenance tracking
- QR code generation for physical asset tracking
- Detailed asset history tracking

#### 3. Employee Management
- Comprehensive employee information tracking
- Department and position management
- Asset assignment tracking
- Employee onboarding/offboarding asset checklists

#### 4. Ticketing System
- IT support ticket creation and tracking
- Ticket assignment and status management
- Service level agreement (SLA) tracking
- Ticket categorization and prioritization

#### 5. Reporting
- Asset utilization reports
- Depreciation reports
- Audit trail and activity logs
- Custom report generation

#### 6. System Configuration
- Customizable asset types, brands, and statuses
- Service provider management
- Currency and language settings
- System-wide preference management
- Demo data removal capability

### System Architecture

SimpleIT is built as a full-stack TypeScript application with the following components:

#### Frontend
- React.js framework with TypeScript
- TanStack Query for data fetching
- Shadcn UI components
- Tailwind CSS for styling
- Lucide icons

#### Backend
- Express.js server
- PostgreSQL database with Drizzle ORM
- RESTful API architecture
- Passport.js for authentication
- Session-based authentication with PostgreSQL session store

#### Database Schema
The system utilizes a relational database with the following primary tables:
- Users
- Employees
- Assets
- Asset Transactions
- Asset Maintenance
- Tickets
- System Configuration
- Activity Logs

### User Roles and Permissions

#### Administrator (Level 3)
- Complete system access
- User management capabilities
- System configuration access
- Report generation
- All CRUD operations

#### Manager (Level 2)
- Asset management
- Employee management
- Ticket management
- Report viewing
- Limited configuration access

#### Standard User (Level 1)
- Asset viewing
- Ticket creation and tracking
- Basic reporting

### Asset Lifecycle Management

SimpleIT tracks the full lifecycle of IT assets:

1. **Acquisition**: Record purchase information, warranty details, and specifications
2. **Deployment**: Assign assets to employees with check-out functionality
3. **Maintenance**: Schedule and track maintenance activities
4. **Transfers**: Move assets between employees with check-in/check-out functionality
5. **Disposal/Retirement**: Record end-of-life information, sales, or recycling details

### Check-in/Check-out Process

The system provides detailed tracking of asset movements with categorized reasons:

#### Check-out Reasons
- Assigned for work use
- Temporary loan
- Replacement for faulty asset
- Project-based use
- Remote work setup
- New employee onboarding
- External use (with approval)

#### Check-in Reasons
- End of assignment
- Employee exit
- Asset not needed anymore
- Asset upgrade/replacement
- Faulty/Needs repair
- Warranty return
- Loan period ended

### Asset Depreciation Calculation

SimpleIT automatically calculates asset depreciation based on:
- Purchase date
- Purchase price
- Expected lifespan (in months)
- Current date

Straight-line depreciation is used to provide current value estimates for all depreciable assets.

### Customization Options

The system provides extensive customization options:
- Custom asset types
- Custom asset brands
- Custom asset statuses with color coding
- Service provider management
- Customizable asset ID prefixes (default: SIT-)
- Multiple currency support
- Language options (English and Arabic)

### Data Import/Export

- CSV import functionality for bulk data loading
- CSV export for reporting and data backup
- Detailed transaction logs export

### Demo Data Management

The system includes a feature to remove all demo data, allowing administrators to start with a clean system while maintaining essential configuration and the admin user account.

### Audit Logging

All system activities are logged with:
- Timestamp
- User information
- Action type
- Entity affected
- Additional details

This provides a complete audit trail for security and compliance purposes.

### System Requirements

#### Server Requirements
- Node.js 18.x or higher
- PostgreSQL 14.x or higher
- 2GB RAM minimum (4GB recommended)
- 1GB free disk space minimum

#### Client Requirements
- Modern web browser (Chrome, Firefox, Edge, Safari)
- 1280×720 minimum screen resolution
- JavaScript enabled

### Security Features

- Secure password hashing with bcrypt
- Session-based authentication
- HTTPS support
- Input validation and sanitization
- Activity logging and auditing
- Permission-based access control