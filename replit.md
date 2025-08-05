# SimpleIT Asset Management System

## Overview
SimpleIT is a comprehensive IT asset management system designed for ELADWYSOFT. It provides intelligent tracking, robust service management, and enhanced operational efficiency. The system offers ITIL-compliant asset lifecycle management, including tracking, maintenance, and detailed specifications. It features an advanced ticket management system for handling IT service requests, incidents, and problems with integrated time tracking, history, and comments. The platform's main purpose is to streamline IT operations, improve visibility into IT assets, and enhance service delivery within an organization. Its business vision is to provide a robust, production-ready solution compatible across various deployment environments.

## User Preferences
- Use clean, professional code structure with comments
- Follow RESTful API patterns
- Maintain role-based access control
- Use existing styling and component libraries
- Keep database schema changes minimal

## Recent Changes (August 2025)
- **Fixed MaintenanceForm Button Functionality**: Resolved "Save Maintenance Record" button issues by correcting backend field mapping (maintenanceType vs type), fixing cost validation (string vs number), and enhancing dialog event propagation to prevent edit form conflicts
- **Fixed CSV Template Downloads**: Resolved "[object Response]" issue by switching from `apiRequest()` to direct `fetch().text()` for proper CSV content extraction in both SystemConfig and AssetImportExport components
- **Enhanced Employee Table Navigation**: Updated row clicks to open edit forms instead of details view, with preserved "View Details" functionality in dropdown menus
- **Improved Dialog Management**: Fixed dialog closing behavior in AssetsTable to prevent unwanted edit form triggers after maintenance dialog closure
- **Fixed Demo Data Creation System**: Resolved duplicate username constraint violations by implementing timestamp-based unique usernames and proper error handling. Demo data creation and removal now fully functional for all dataset sizes.
- **Fixed Critical Import Field Mapping Issues**: Resolved field mapping mismatch between CSV templates and import processing. Updated CSV template field names to use camelCase (englishName, arabicName, type, brand, etc.) instead of display names with spaces and asterisks. Enhanced frontend field mapping patterns to correctly identify and map CSV columns with asterisks and spaces to corresponding database fields. Fixed SystemConfig.tsx mapping object construction (sourceColumn → targetField). Import system now correctly maps all fields to database records.
- **Enhanced Demo Data Counter Display**: Fixed demo data creation success messages to show accurate counts of created users, employees, and assets instead of showing 0 for all counts.
- **Added Import Data Validation**: Implemented comprehensive data validation and normalization for CSV imports including safe date parsing (handles multiple formats), asset type normalization (maps Smartphone→Phone, Router→Network, etc.), and numeric field validation to prevent database errors during import processing.

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