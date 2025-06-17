# SimpleIT Asset Management System

## Overview
A comprehensive IT asset management system for ELADWYSOFT company with intelligent tracking, robust service management, and enhanced operational efficiency.

**Current Status**: Production-ready with authentication, asset management, ticketing, and reporting features.

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
- Enhanced currency formatting system-wide with proper context implementation
- Fixed type safety issues in currency context
- Updated StatsCard component for better currency display
- Improved import/export functionality with system currency settings

### Current Task
- Implementing Changes log system accessible within the application
- Fixing Dashboard Recent Activity display for user readability
- Resolving asset management bugs (brands, status, purchase price, transactions)
- Adding export/import functionality for employees, assets, and tickets
- Improving System Configuration UI with tabbed layout

## Known Issues
- Database connection errors with Neon serverless (endpoint disabled)
- Asset transactions only recording first transaction
- Purchase price validation errors (string vs number)
- Missing maintenance records
- Notification system needs fixing

## Authentication
- Login: admin / admin123
- Role-based access: Admin (full access), User (restricted to assigned assets/tickets)
- Session management via PostgreSQL store