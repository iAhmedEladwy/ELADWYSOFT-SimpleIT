# SimpleIT Asset Management System

## Overview
A comprehensive IT asset management system for ELADWYSOFT company with intelligent tracking, robust service management, and enhanced operational efficiency.

**Current Status**: Production-ready with authentication, asset management, advanced interactive ticketing, and reporting features.

## User Preferences
- Use clean, professional code structure with comments
- Follow RESTful API patterns
- Maintain role-based access control
- Use existing styling and component libraries
- Keep database schema changes minimal

## Project Architecture
- **Frontend**: React with TypeScript, Tailwind CSS, shadcn/ui components
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Cookie-based sessions with PostgreSQL store
- **Real-time**: WebSocket support for notifications

## Recent Changes
### 2025-01-17
- **COMPLETED**: PostgreSQL Migration for Ubuntu Server Deployment
  - Configured PostgreSQL with standard node-postgres driver instead of Neon serverless
  - Created comprehensive Ubuntu deployment script (deploy-ubuntu-postgresql.sh)
  - Integrated email service with password reset functionality
  - Environment-based storage selection (memory for dev, PostgreSQL for production)
  - SSL configuration for production PostgreSQL connections
- **COMPLETED**: Simplified Password Reset System
  - Replaced complex security questions with clean email-based password reset
  - Updated ForgotPassword.tsx to use streamlined email workflow
  - Integrated with existing email service for secure token delivery
  - Enhanced user experience with clear success/error messaging
  - Maintained bilingual support (English/Arabic) for password reset flow
- **COMPLETED**: System Cleanup and Optimization
  - Removed unused authentication systems: replitAuth.ts, storage-factory.ts, db-fix.ts (~300+ lines)
  - Consolidated duplicate authentication implementations
  - Integrated password reset with email notifications
  - Added comprehensive deployment documentation for Ubuntu servers
- **COMPLETED**: Standardized CSV Import/Export Utilities
  - Created shared CSV parsing utilities with comprehensive validation (shared/csvUtils.ts)
  - Implemented entity-specific validation rules for all modules (shared/importExportRules.ts)
  - Added unified import/export routes supporting assets, employees, tickets, users, maintenance, and transactions
  - Enhanced data validation with field type checking, pattern matching, and custom validation rules
  - Standardized CSV template generation for all entity types with proper field mapping
- **COMPLETED**: Email Integration and Security Features
  - Password reset functionality with secure token generation
  - Email service integration for notifications
  - Activity logging for security events
  - Production-ready SMTP configuration options
- **COMPLETED**: Role-Based Access Control (RBAC) System - Implemented comprehensive ITIL-aligned roles
  - Added Employee, Agent, Manager, Admin roles with hierarchical permissions
  - Enhanced user schema with role, employeeId, and managerId fields
  - Created RBAC middleware for route protection and permission checking
  - Added RoleGuard component for frontend access control
  - Updated sidebar navigation to show role-appropriate menu items
  - Implemented data filtering based on user permissions and organizational hierarchy
- Enhanced time tracking state management - Fixed form refresh issues after mutations
- **COMPLETED**: Priority color fix - "Low" priority now displays in yellow as requested
- Enhanced currency formatting system-wide with proper context implementation
- Fixed type safety issues in currency context
- Updated StatsCard component for better currency display
- Improved import/export functionality with system currency settings
- **RESOLVED**: Asset form Purchase Price validation - fixed numeric input handling
- **RESOLVED**: Asset transaction recording - enhanced with proper activity logging
- **RESOLVED**: Notification system - now uses real data from assets, tickets, and system config
- **COMPLETED**: Dashboard Recent Activity display - improved user-readable messages
- **RESOLVED**: Employee form data mapping issue - Fixed form to properly populate existing employee data instead of showing hardcoded values
- Enhanced memory storage with comprehensive asset brands, types, and statuses
- Improved asset management with configurable brands and statuses from system config
- **COMPLETED**: Enhanced System Configuration with tabbed asset management UI
- **COMPLETED**: Restored complete add/update functionality for asset types, brands, statuses, and service providers
- **BALANCED**: Restored essential default Asset Brands and Statuses while keeping them fully manageable through System Configuration
- **COMPLETED**: Enhanced Ticket System - All 5 advanced features fully implemented and working
- **FIXED**: UI warnings - Removed nested anchor tags and added proper dialog descriptions
- **RESOLVED**: Ticket creation authentication error - Fixed session store configuration and verified working ticket creation
- **COMPLETED**: Mark as Done feature - Added resolution button with options (Closed, Resolved, Duplicate, Declined) and comment requirement
- **COMPLETED**: ITIL-compliant ticket system - Enhanced with summary, category, urgency, impact fields and automatic priority calculation
- **COMPLETED**: Clickable ticket table rows - Integrated TicketDetailForm with seamless ticket management interface
- **COMPLETED**: Tabbed ticket detail form - Comprehensive interface with Details, Comments, History, and Attachments tabs
- **FIXED**: SelectItem empty value error - Resolved UI component validation issues
- **COMPLETED**: UI simplification - Removed Ticket History, Attachment, Edit, and Comment buttons from ticket interface
- **FIXED**: Comment display issue - Comments now show current user's username instead of "unknown"

### Current Progress
- ✓ **COMPLETED**: Role-Based Access Control (RBAC) System - Full ITIL-aligned security implementation with complete UI interface
- ✓ **COMPLETED**: Time tracking state synchronization - Form updates properly after mutations
- ✓ Changes log system accessible within the application (COMPLETED)
- ✓ Dashboard Recent Activity display improvements (COMPLETED)  
- ✓ Asset management bugs resolved (brands, status, purchase price, transactions)
- ✓ Notification system enhanced with real data integration
- ✓ Export/import functionality for employees, assets, and tickets (COMPLETED)
- ✓ System Configuration UI with tabbed layout improvements (COMPLETED)
- ✓ Enhanced asset management with search, pagination, and add/update dialogs (COMPLETED)
- ✓ Eliminated data duplication - Asset Brands and Statuses now use only System Configuration data (COMPLETED)
- ✓ **COMPLETED**: Asset Management CRUD operations - All four sections (Types, Brands, Statuses, Service Providers) now fully functional
- ✓ **COMPLETED**: Asset form integration - Removed hardcoded asset types, now uses dynamic custom types from System Configuration
- ✓ **RESOLVED**: Employee creation "pool is not defined" error - Fixed to use storage layer instead of direct database access
- ✓ **COMPLETED**: UI improvements - Fixed nested anchor tag warnings in RecentAssets component
- ✓ **COMPLETED**: Enhanced Ticket System with 5 advanced features - Custom request types, time tracking, history display, admin delete, and enhanced updates
- ✓ **COMPLETED**: Interactive Grid Editing - Type, Priority, Status, and Assigned To fields now editable directly in ticket grid
- ✓ **COMPLETED**: Enhanced Time Tracking - Displays actual consumed time with proper formatting and active tracking indicators
- ✓ **COMPLETED**: Dialog Management - Automatic closing after successful operations with proper state management
- ✓ **COMPLETED**: Ticket History System - Complete audit trail with automatic history creation for all changes
- ✓ **COMPLETED**: UI Simplification - Removed Ticket History, Attachment, Edit, and Comment buttons as requested
- ✓ **COMPLETED**: Comment system with proper user attribution - Comments display current user's username correctly
- ✓ All major system features fully functional and production-ready with comprehensive security

## Resolved Issues
- ✓ Database connection stabilized with memory storage solution
- ✓ Asset transactions now properly record all activities
- ✓ Purchase price validation handles numeric inputs correctly
- ✓ Asset maintenance records properly tracked
- ✓ Notification system displays real system status and alerts

## Authentication & Authorization
- Login: admin / admin123
- **RBAC System**: ITIL-aligned role hierarchy with granular permissions
  - **Admin**: Full system access, configurations, audit logs, user management
  - **Manager**: View/manage subordinates' assets, tickets, employee profiles, reports access
  - **Agent**: View all assets, create/manage/close all tickets, limited administrative access
  - **Employee**: View only assigned assets and own tickets, can create new tickets
- Session management via PostgreSQL store
- Route-level and component-level permission enforcement
- Data filtering based on organizational hierarchy and role permissions