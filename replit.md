# SimpleIT Asset Management System

## Overview
SimpleIT is a comprehensive IT asset management system designed for ELADWYSOFT, offering intelligent tracking, robust service management, and enhanced operational efficiency. The system provides ITIL-compliant asset lifecycle management, including tracking, maintenance, and detailed specifications. It features an advanced ticket management system for handling IT service requests, incidents, and problems with integrated time tracking, history, and comments. The platform aims to streamline IT operations, improve visibility into IT assets, and enhance service delivery within an organization.

## User Preferences
- Use clean, professional code structure with comments
- Follow RESTful API patterns
- Maintain role-based access control
- Use existing styling and component libraries
- Keep database schema changes minimal

## System Architecture
- **Frontend**: React with TypeScript, Tailwind CSS, shadcn/ui components for a unified, professional UI/UX. Features include:
    - Centralized System Configuration with a 7-tab structure (System Defaults, Employees, Assets, Tickets, Email, Users & Roles, Import/Export).
    - Complete Import/Export functionality for Employees, Assets, and Tickets with CSV format support, template downloads, drag-and-drop file upload, progress tracking, and error handling.
    - Unified UI patterns across all pages (Assets, Tickets, Employees) with consistent filter card designs, layout (`p-6`), and enhanced navigation.
    - Interactive grid editing for key fields (Type, Priority, Status, Assigned To) in tables.
    - Comprehensive forms with field validation and auto-save functionality.
    - Bilingual support (English/Arabic).
- **Backend**: Express.js with TypeScript, enforcing RESTful API patterns and role-based access control.
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