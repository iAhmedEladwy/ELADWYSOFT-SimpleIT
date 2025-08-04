# SimpleIT Asset Management System

## Overview
SimpleIT is a comprehensive IT asset management system designed for ELADWYSOFT, offering intelligent tracking, robust service management, and enhanced operational efficiency. The system provides ITIL-compliant asset lifecycle management, including tracking, maintenance, and detailed specifications. It features an advanced ticket management system for handling IT service requests, incidents, and problems with integrated time tracking, history, and comments. The platform aims to streamline IT operations, improve visibility into IT assets, and enhance service delivery within an organization.

## Recent Critical Fixes (August 2025)
- **RESOLVED**: Fixed critical duplicate ID generation issue causing import failures across all entities
- **IMPLEMENTED**: Database auto-increment system for unique ID generation (emp_id, asset_id, ticket_id)
- **VERIFIED**: Employee import functionality working successfully with 100% success rate
- **COMPLETED**: Removed audit logging from import/export processes per user requirements
- **TESTED**: Multi-record batch imports working reliably without constraint violations
- **FIXED**: Resolved "name" column schema mismatch in assets table - now using correct model_name field
- **WORKING**: Asset import (JSON/CSV) functioning with database auto-increment
- **WORKING**: Employee import with 100% success rate using database auto-increment
- **WORKING**: Ticket import functional with proper foreign key handling
- **COMPLETED**: Updated import templates to exclude auto-generated ID fields (assetId, employeeId, ticketId)
- **ENHANCED**: Templates now include comprehensive field guidance with required/optional indicators (*) and format examples
- **IMPROVED**: Template routing fixed to prevent conflicts with parameterized routes
- **FIXED**: Resolved Select.Item empty value error in field mapping interface preventing runtime crashes
- **ENHANCED**: Updated apiRequest function to properly handle FormData uploads for import functionality
- **RESOLVED**: Fixed fetch API method error across all import modules (employees, assets, tickets)
- **CRITICAL FIX**: Resolved CSV parsing issue where headers were not properly recognized, causing generic column names (_0, _1, etc.)
- **IMPLEMENTED**: Special handling for CSV files with generic column parsing to ensure data is properly mapped
- **FIXED**: Employee import now working with 100% success rate - properly handles field mapping and data validation
- **ENHANCED**: Ticket import now assigns valid employee IDs for submitted_by_id field, preventing foreign key constraint violations
- **IMPROVED**: Storage method consistency - fixed generateId function to use correct getAllAssets(), getAllEmployees(), getAllTickets() methods
- **RESOLVED**: Fixed critical employee creation error - removed generated `name` column from INSERT operations
- **IMPLEMENTED**: Proper generated column handling in schema with `sql` function for `COALESCE(english_name, arabic_name, emp_id)`
- **ADDED**: Comprehensive bulk actions functionality to Assets Management with multi-select operations
- **ENHANCED**: Assets page now supports bulk delete, status change, and assignment operations similar to Employees page
- **CRITICAL FIX**: Applied consistent ID generation fix across all entities (Employees, Assets, Tickets)
- **IMPLEMENTED**: Raw SQL insertion methods for all entities to ensure cross-environment compatibility
- **FIXED**: Ubuntu deployment compatibility - all entity creation now works reliably in both Replit and Ubuntu environments

## User Preferences
- Use clean, professional code structure with comments
- Follow RESTful API patterns
- Maintain role-based access control
- Use existing styling and component libraries
- Keep database schema changes minimal

## System Architecture
- **Frontend**: React with TypeScript, Tailwind CSS, shadcn/ui components for a unified, professional UI/UX. Features include:
    - Centralized System Configuration with a 7-tab structure (System Defaults, Employees, Assets, Tickets, Email, Users & Roles, Import/Export).
    - **Enhanced Import/Export System** for Employees, Assets, and Tickets with:
      - Two-step import process with file preview and field mapping confirmation
      - CSV format support with automatic entity type detection
      - Comprehensive field validation and error handling with row-specific error messages
      - Template downloads and drag-and-drop file upload
      - Progress tracking and detailed import results with success/failure counts
      - Real-time warnings for data validation issues
    - Unified UI patterns across all pages (Assets, Tickets, Employees) with consistent filter card designs, layout (`p-6`), and enhanced navigation.
    - Interactive grid editing for key fields (Type, Priority, Status, Assigned To) in tables.
    - Comprehensive forms with field validation and auto-save functionality.
    - Bilingual support (English/Arabic).
- **Backend**: Express.js with TypeScript, enforcing RESTful API patterns and role-based access control. Enhanced import/export system with:
    - Robust primary key generation using system config prefixes (AST-, EMP-, TKT-)
    - Advanced CSV parsing with multiple date format support (MM/DD/YYYY, YYYY-MM-DD, ISO)
    - Comprehensive data validation with fallback values for invalid enum entries
    - File preview and schema analysis APIs (/api/import/preview, /api/import/schema/:entityType)
    - Enhanced error handling with detailed field validation and row-specific error reporting.
- **Database**: PostgreSQL with Drizzle ORM. The schema supports ITIL-compliant asset and ticket management, including hardware specifications, maintenance records, and detailed employee profiles.
- **Authentication**: Cookie-based sessions with PostgreSQL store, secured by a 4-level ITIL-compliant Role-Based Access Control (RBAC) system (Employee, Agent, Manager, Admin). Features include:
    - Hierarchical permissions for granular access control.
    - Route-level and component-level permission enforcement.
    - Email-based password reset system.
    - Emergency login mechanism for production recovery.
- **Real-time**: WebSocket support for notifications.
- **System Design**: Focus on modularity, comprehensive error handling, type safety (TypeScript interfaces), and abstraction layers (storage factory). Supports multi-platform deployment via Docker, Ubuntu Server, and Windows PowerShell scripts.

## External Dependencies
- **PostgreSQL**: Primary database for persistent storage.
- **Express.js**: Backend web application framework.
- **React**: Frontend JavaScript library.
- **Tailwind CSS**: Utility-first CSS framework for styling.
- **shadcn/ui**: Component library for React.
- **Drizzle ORM**: TypeScript ORM for PostgreSQL.
- **bcrypt**: For password hashing.
- **Passport.js**: Authentication middleware for Node.js.
- **PM2**: Production process manager for Node.js applications (Ubuntu deployment).
- **Nginx**: Web server (Ubuntu deployment).
- **Zod**: Schema validation library.