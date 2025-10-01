export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  type: 'major' | 'minor' | 'patch';
  changes: {
    features?: string[];
    improvements?: string[];
    bugfixes?: string[];
    security?: string[];
    breaking?: string[];
  };
}

export const CHANGELOG_DATA: ChangelogEntry[] = [
  {
    version: "0.4.3",
    date: "2025-10-01",
    title: "Authentication Enhancements & Code Quality Improvements",
    type: "patch",
    changes: {
      features: [
        "🔐 Enhanced Login System:",
        "   ✅ Added email login support - users can now login with either username or email",
        "   ✅ Updated authentication strategy to support dual login methods",
        "   ✅ Added getUserByEmail method to both DatabaseStorage and MemoryStorage",
        "   ✅ Enhanced Passport.js LocalStrategy with fallback authentication logic",
        "   ✅ Updated login form validation to accept username or email format",
        "   ✅ Added bilingual support for login placeholder text (English/Arabic)"
      ],
      improvements: [
        "🧹 Code Quality & Production Readiness:",
        "   ✅ Wrapped development console logs in environment checks (import.meta.env.DEV)",
        "   ✅ Removed debug console statements from AssetHistory page",
        "   ✅ Implemented production-safe error logging throughout application",
        "   ✅ Added comprehensive debugging logs to authentication flow",
        "   ✅ Enhanced session management with explicit save before response",
        "   ✅ Improved server port configuration with environment variable support",
        "🔧 System Configuration:",
        "   ✅ Made server port configurable via PORT environment variable (default: 5000)",
        "   ✅ Enhanced session debugging with detailed logging in /api/me endpoint",
        "   ✅ Added session ID and authentication state logging for troubleshooting"
      ],
      bugfixes: [
        "🔧 Authentication & Session Fixes:",
        "   ✅ Fixed infinite login loop caused by session timing issues",
        "   ✅ Added req.session.save() callback to ensure session persistence before response",
        "   ✅ Resolved 401 errors on /api/me and /api/system-config after successful login",
        "   ✅ Fixed session cookie not being properly saved between requests",
        "   ✅ Corrected authentication flow race condition in login endpoint",
        "🧹 Development Environment Fixes:",
        "   ✅ Removed production console logs that could leak sensitive information",
        "   ✅ Fixed console.warn and console.error appearing in production builds",
        "   ✅ Cleaned up debug logging from AssetHistory component"
      ]
    }
  },
  {
  version: "0.4.1",
  date: "2025-09-20",
  title: "Scheduled Backups, Bulk Operations History & System Enhancements ⚠️ MIGRATION REQUIRED",
  type: "minor",
  changes: {
    breaking: [
      "⚠️ DATABASE SCHEMA CHANGES - MIGRATION REQUIRED:",
      "   🔧 Added 'backup_filename' column to 'restore_history' table",
      "   🔧 Added 'backup_jobs' table for scheduled backup functionality",
      "   📋 Run migration script: scripts/migrate-v0.4.1-backup-filename.sql",
      "   ⚡ SQL: ALTER TABLE restore_history ADD COLUMN backup_filename VARCHAR(255);",
      "   ⚡ SQL: CREATE TABLE backup_jobs (id, name, schedule_type, schedule_value, is_enabled, created_at, last_run_at, next_run_at);",
      "   🎯 Required for backup filename preservation and scheduled backup functionality",
      "   ⏰ Downtime: Minimal (simple column and table additions)",
      "   💡 Migration is backward compatible - existing restore records will have NULL backup_filename"
    ],
    features: [
      "💾 Enhanced Backup & Restore System:",
      "   ✅ Added comprehensive user tracking for all restore operations",
      "   ✅ Implemented backup filename preservation in restore history",
      "   ✅ Enhanced restore history display with user attribution (username + full name)",
      "   ✅ Added filename field to preserve backup names even after file deletion",
      "   ✅ Improved audit trail for backup/restore operations with proper user accountability",
      "   ✅ Updated database schema with backupFilename column for restore_history table",
      "   ✅ Created migration script (migrate-v0.4.1-backup-filename.sql) for existing installations",
      "⏰ Scheduled Backup System:",
      "   ✅ Implemented comprehensive scheduled backup functionality",
      "   ✅ Added ScheduledBackupsTab component with full CRUD interface",
      "   ✅ Enhanced BackupRestore page with 3-tab layout (Manual, Scheduled, Restore History)",
      "   ✅ Added backup job scheduling with flexible timing options (daily, weekly, monthly)",
      "   ✅ Implemented backup job status management (enabled/disabled)",
      "   ✅ Added manual execution of scheduled backup jobs",
      "   ✅ Created backup job management API endpoints (/api/admin/backup-jobs)",
      "   ✅ Updated database schema with backup_jobs table structure",
      "   ✅ Integrated backup job creation into existing v0.4.1 migration",
      "📊 Bulk Operations History:",
      "   ✅ Implemented complete bulk operations history tracking system",
      "   ✅ Added /api/bulk-action-history endpoint with comprehensive filtering",
      "   ✅ Created bulk operations monitoring for all bulk actions (check-in/out, retire, update, delete)",
      "   ✅ Added advanced filtering by action type, status, date range, and search",
      "   ✅ Implemented pagination and CSV export functionality",
      "   ✅ Enhanced existing BulkOperations.tsx frontend with backend integration",
      "   ✅ Added success/partial/failed status detection and reporting",
      "   ✅ Integrated with existing activity logging system"
    ],
    improvements: [
      "🔄 Backup & Restore Enhancements:",
      "   ✅ Enhanced getRestoreHistory() to include user information via JOIN with users table",
      "   ✅ Updated restoreFromBackup() method to capture backup filename and user ID",
      "   ✅ Updated restoreFromFile() method to preserve uploaded filename and user attribution",
      "   ✅ Improved frontend restore history table with 'Restored By' column showing user details",
      "   ✅ Added COALESCE logic to prioritize backupFilename field for display",
      "   ✅ Enhanced restore operations for both existing backups and uploaded files",
      "📊 Export Data Quality Improvements:",
      "   ✅ Standardized date formatting across all export functions using toLocaleDateString()",
      "   ✅ Enhanced employee exports with manager name resolution alongside manager ID",
      "   ✅ Improved asset exports with assigned employee name display",
      "   ✅ Updated multiple export endpoints for consistency and completeness",
      "   ✅ Added employee lookup mapping for better data readability in exports",
      "🧹 SystemConfig Component Cleanup:",
      "   ✅ Removed duplicate user management functionality from SystemConfig page",
      "   ✅ Consolidated user management to dedicated Admin Console section",
      "   ✅ Eliminated redundant user-related state variables and mutations",
      "   ✅ Streamlined SystemConfig to focus on system-wide settings only",
      "   ✅ Removed user management UI components, forms, and dialogs",
      "   ✅ Cleaned up user-related imports and handler functions",
      "🎯 Architecture Improvements:",
      "   ✅ Better separation of concerns between SystemConfig and AdminConsole",
      "   ✅ Reduced component complexity by removing duplicate functionality",
      "   ✅ Improved maintainability by eliminating code duplication",
      "   ✅ Enhanced user experience with dedicated user management section",
      "🔧 Backup System Enhancements:",
      "   ✅ Enhanced backupService.ts with new scheduled job management methods",
      "   ✅ Added calculateNextRunTime functionality for backup scheduling",
      "   ✅ Updated backup job schema with schedule_type and schedule_value fields",
      "   ✅ Improved backup job status tracking and management",
      "📈 Admin Console Integration:",
      "   ✅ Seamlessly integrated scheduled backups into existing Admin Console workflow",
      "   ✅ Enhanced backup management with consistent UI/UX patterns",
      "   ✅ Added bulk operations monitoring to admin capabilities",
      "   ✅ Improved admin oversight with comprehensive operation history",
      "🎯 API Consistency:",
      "   ✅ Standardized API endpoint patterns for admin functionality",
      "   ✅ Enhanced error handling and response formatting",
      "   ✅ Improved authentication and access control for admin endpoints",
      "   ✅ Added proper TypeScript typing for new functionality"
    ],
    bugfixes: [
      "🔧 Dialog & UI Component Fixes:",
      "   ✅ Fixed Dashboard ticket dialog showing only 'X' button with no content",
      "   ✅ Resolved TicketForm nested dialog issue by using standalone dialog approach",
      "   ✅ Fixed Audit log details click functionality - added proper click handler and modal",
      "   ✅ Enhanced audit log details display with formatted JSON in scrollable dialog",
      "   ✅ Added proper state management for audit log details dialog (selectedLogDetails, isDetailsDialogOpen)",
      "📊 Changelog Page Tab Functionality Fix:",
      "   ✅ Fixed changelog page tabs (Features, Bug Fixes, Security) not displaying filtered content",
      "   ✅ Added proper TabsContent components for each tab with filtered data display",
      "   ✅ Implemented correct filtering logic for each change type (features, bugfixes, security)",
      "   ✅ Enhanced tab functionality to show only relevant entries for each category",
      "   ✅ Improved user experience with clean, filtered views for each change type",
      "📈 Export Data Formatting Fixes:",
      "   ✅ Fixed employee export date formatting - join date and exit date now in short format",
      "   ✅ Fixed missing 'Direct Manager Name' column in employee exports",
      "   ✅ Fixed empty 'Assigned To' column in asset exports - now shows employee names",
      "   ✅ Updated all export routes (/api/employees/export, /api/export/employees, /api/export/assets, /api/assets/export)",
      "   ✅ Resolved date format inconsistencies across purchase dates, warranty dates, and timestamps",
      "🔧 Component Structure Fixes:",
      "   ✅ Fixed file corruption issues during user management removal",
      "   ✅ Resolved duplicate export statements in SystemConfig component",
      "   ✅ Cleaned up orphaned JSX content and malformed component structure",
      "   ✅ Corrected component imports and removed unused dependencies",
      "🔧 Bulk Operations Fixes:",
      "   ✅ Fixed 'notes is not defined' error in /api/assets/retire endpoint",
      "   ✅ Added missing 'notes' parameter extraction in bulk retire operations",
      "   ✅ Fixed bulk action history data filtering and display issues",
      "   ✅ Resolved API endpoint pattern matching for bulk operation detection",
      "   ✅ Fixed pagination logic for manually filtered bulk operation data",
      "📊 Employee Page Refresh Fix:",
      "   ✅ Fixed missing queryFn in useQuery hooks causing refresh button failures",
      "   ✅ Added proper queryFn configuration for employee data fetching",
      "   ✅ Resolved 'd.map is not a function' errors from API endpoint mismatches",
      "🔄 API Endpoint Corrections:",
      "   ✅ Fixed API route inconsistencies (/api/backup-jobs vs /api/admin/backup-jobs)",
      "   ✅ Corrected endpoint paths to match frontend expectations",
      "   ✅ Resolved backend-frontend API communication issues",
      "   ✅ Enhanced error handling and response validation"
    ]
  }
},
{
  version: "0.4.0",
  date: "2025-09-17",
  title: "Tickets Module Overhaul & System-Wide Code Cleanup",
  type: "major",
  changes: {
    features: [
      "🎫 Complete Tickets Module Restructuring:",
      "   ✅ Simplified tickets table schema to 21 core fields (vs. previous 30+ fields)",
      "   ✅ Implemented ITIL-compliant priority auto-calculation using urgency × impact matrix",
      "   ✅ Added PostgreSQL trigger functions for automatic priority calculation on create/update",
      "   ✅ Enhanced TicketForm with unified validation and proper field mapping",
      "   ✅ Streamlined TicketsTable with consolidated inline editing capabilities",
      "   ✅ Introduced priority utility functions with TypeScript type safety",
      "🗑️ System-Wide Code Cleanup:",
      "   ✅ Removed unused Service Provider system (service_providers, asset_service_providers tables)",
      "   ✅ Eliminated obsolete enum types (asset_type_enum, upgrade_risk_enum, upgrade_priority_enum)",
      "   ✅ Cleaned up redundant storage methods from application layer",
      "   ✅ Consolidated duplicate form components and validation logic",
      "🔧 Enhanced Form Architecture:",
      "   ✅ Unified Calendar component integration across all ticket forms",
      "   ✅ Improved date handling with ISO format conversion",
      "   ✅ Enhanced validation with Zod schema for type safety",
      "   ✅ Streamlined comment system with real-time updates"
    ],
    improvements: [
      "⚡ Performance Optimizations:",
      "   ✅ Reduced tickets table complexity by 30% through schema simplification",
      "   ✅ Added database indexes for priority, urgency, and impact fields",
      "   ✅ Implemented efficient query patterns for status-priority combinations",
      "   ✅ Optimized mutation handling with proper error boundaries",
      "🎯 User Experience Enhancements:",
      "   ✅ Priority now auto-calculates and displays as read-only with explanations",
      "   ✅ Enhanced inline editing with better event handling and validation",
      "   ✅ Improved form responsiveness with consolidated state management",
      "   ✅ Streamlined ticket creation workflow with simplified field structure",
      "📋 Code Quality Improvements:",
      "   ✅ Eliminated duplicate dialog components across ticket management",
      "   ✅ Consolidated validation logic into centralized utility functions",
      "   ✅ Enhanced TypeScript interfaces with stricter type definitions",
      "   ✅ Improved error handling with comprehensive try-catch blocks"
    ],
    bugfixes: [
      "🔧 Schema & Database Fixes:",
      "   ✅ Removed problematic merged_into_id column from tickets table",
      "   ✅ Eliminated unused time tracking columns (is_time_tracking, time_tracking_started_at)",
      "   ✅ Fixed priority calculation inconsistencies across urgency/impact combinations",
      "   ✅ Resolved database constraint conflicts with simplified schema",
      "🎫 Ticket Management Fixes:",
      "   ✅ Fixed ticket creation form crashes during employee selection",
      "   ✅ Resolved priority display inconsistencies in table views",
      "   ✅ Fixed status change validation preventing invalid transitions",
      "   ✅ Corrected assignment logic with proper user role validation",
      "📝 Form & Validation Fixes:",
      "   ✅ Fixed date picker integration issues with Calendar component",
      "   ✅ Resolved form submission errors with proper data transformation",
      "   ✅ Fixed inline editing conflicts with row click handlers",
      "   ✅ Corrected comment system real-time update failures",
      "🗑️ Cleanup & Migration Fixes:",
      "   ✅ Removed orphaned service provider references causing build errors",
      "   ✅ Fixed migration script compatibility with PostgreSQL versions",
      "   ✅ Resolved enum type conflicts during schema cleanup",
      "   ✅ Fixed storage method references to removed functionality"
    ],
    breaking: [
      "⚠️  Database Schema Changes (Migration Required):",
      "   • Tickets table simplified to 21 core fields",
      "   • Removed service_providers and asset_service_providers tables",
      "   • Removed obsolete enum types (requires `npm run db:push`)",
      "   • Priority field now auto-calculated (manual priority setting removed)",
      "⚠️  API Interface Changes:",
      "   • Priority field is now read-only in ticket creation/update requests",
      "   • Removed service provider endpoints and related API methods",
      "   • Updated ticket validation schema with simplified field structure",
      "⚠️  Component Interface Changes:",
      "   • TicketForm props updated to reflect simplified schema",
      "   • Removed time tracking related components and props",
      "   • Priority selection components replaced with display-only badges"
    ]
  }
},
{
  version: "0.3.7",
  date: "2025-09-15",
  title: "Unified Calendar System & Enhanced Export Functionality",
  type: "major",
  changes: {
    features: [
      "📅 Unified Calendar Component System:",
      "   ✅ Complete refactor of calendar components across the application",
      "   ✅ Implemented unified Calendar component with mode='picker' functionality",
      "   ✅ Removed deprecated date-input.tsx component (142 lines) for cleaner architecture",
      "   ✅ Updated AssetForm, EmployeeForm, TicketForm, and TicketsTable to use unified calendar",
      "   ✅ Simplified date handling with direct string format support (YYYY-MM-DD)",
      "   ✅ Auto-close functionality for improved user experience",
      "   ✅ Enhanced calendar component with 295+ lines of unified functionality",
      "📄 Enhanced Export & PDF Functionality:",
      "   ✅ Fixed export generation in Asset History page",
      "   ✅ Resolved PDF export functionality with proper dependency handling",
      "   ✅ Fixed print dependency issues for reliable document generation",
      "🔧 Complete Reports System Revamp:",
      "   ✅ Comprehensive overhaul of Reports page functionality",
      "   ✅ Enhanced report generation with improved reliability",
      "   ✅ Fixed syntax errors and improved system stability"
    ],
    improvements: [
      "⚡ Component Architecture Enhancement:",
      "   ✅ Unified calendar system reduces code duplication across forms",
      "   ✅ Better error handling and validation in date components",
      "   ✅ Simplified state management for date inputs",
      "   ✅ Consistent date format handling across application",
      "📊 Asset Management Improvements:",
      "   ✅ Enhanced asset page filters implementation",
      "   ✅ Added proper pagination to assets page",
      "   ✅ Improved asset filter fields height with scrollable lists",
      "   ✅ Enhanced related asset display data accuracy",
      "🎫 Ticket System Enhancements:",
      "   ✅ Added search functionality in 'submitted by' field for ticket creation",
      "   ✅ Improved ticket form date handling with unified calendar",
      "   ✅ Enhanced ticket creation workflow reliability",
      "📈 Dashboard & Display Updates:",
      "   ✅ Updated Dashboard Summary and Recent items display",
      "   ✅ Enhanced assets API with proper maintenance calculations",
      "   ✅ Improved data presentation across multiple components"
    ],
    bugfixes: [
      "🔧 Critical Calendar & Date Fixes:",
      "   ✅ Fixed 'ReferenceError: Popover is not defined' in Asset History page",
      "   ✅ Resolved calendar handler issues across all forms",
      "   ✅ Fixed datepicker autoclose functionality in AssetHistory and AuditLog",
      "   ✅ Corrected calendar date bug affecting ticket creation dates",
      "🎫 Ticket Management Fixes:",
      "   ✅ Fixed 'Create new ticket selecting submitted by causes white screen' error",
      "   ✅ Resolved ticket creation form crashes when selecting employees",
      "   ✅ Fixed tickets submitted by to display only active employees",
      "📊 Asset & Data Display Fixes:",
      "   ✅ Resolved 'White page in notifications, asset history' problems",
      "   ✅ Fixed overlapped asset edit form when clicking on purchase information",
      "   ✅ Removed asset inventory card conflicts in assets page",
      "   ✅ Fixed duplicate maintenance data issues",
      "   ✅ Continued fixing missing status field implementation",
      "   ✅ Enhanced asset filtering to properly show employees' assets",
      "📄 Export & PDF Generation Fixes:",
      "   ✅ Fixed export not being generated in Asset History",
      "   ✅ Resolved print dependency conflicts",
      "   ✅ Enhanced PDF export reliability and error handling"
    ]
  }
},
{
  version: "0.3.6",
  date: "2025-09-13",
  title: "Enhanced Employee Filtering & Bulk Operations UI",
  type: "minor",
  changes: {
    features: [
      "🔍 Enhanced Assets Assignment Filter:",
      "   ✅ New API endpoint `/api/employees/with-assets` for efficient filtering",
      "   ✅ Shows ALL employees with assets across entire inventory (not just current page)",
      "   ✅ Optimized performance with dedicated backend filtering",
      "   ✅ Replaced paginated filtering with comprehensive employee list",
      "⚡ Bulk Unassign Assets:",
      "   ✅ New bulk unassign functionality for removing employee assignments",
      "   ✅ Confirmation dialog with warning message",
      "   ✅ Backend endpoint `/api/assets/bulk/unassign` with validation",
      "   ✅ Automatically sets assets to 'Available' status after unassignment",
      "   ✅ Blocks unassignment for Sold/Retired/Disposed assets",
      "   ✅ Activity logging for audit trail"
    ],
    improvements: [
      "🎯 Relocated bulk actions button to left side of pagination controls",
      "🧹 Removed unnecessary 'Select assets to perform bulk actions' placeholder text",
      "📍 Bulk actions button now only appears when assets are selected",
      "🖱️ Prevented accidental asset edit form triggers:",
      "   ✅ Entire checkbox cell area stops event propagation",
      "   ✅ Larger clickable area around checkboxes for easier selection",
      "   ✅ Click anywhere in checkbox cell to toggle selection",
      "📊 Assignment filter now uses dedicated API call instead of client-side filtering",
      "⚡ Reduced memory usage by fetching only employees with assets",
      "🌐 Comprehensive Bilingual Translation Enhancement:",
      "   ✅ Fixed missing translations in Assets page filter interface",
      "   ✅ Added 18+ new translation keys for search, filter labels, and UI elements",
      "   ✅ Translated all filter options (All Types, All Statuses, All Brands, etc.)",
      "   ✅ Fixed hardcoded 'Filter & Search Assets', search placeholders, and buttons",
      "   ✅ Enhanced AssetHistory card descriptions with proper Arabic translations",
      "   ✅ Updated AuditLogFilter with comprehensive bilingual support (16 keys)",
      "   ✅ Completed AuditLogTable bilingual implementation (18 translation keys)",
      "   ✅ All audit components now fully localized for English/Arabic users",
      "   ✅ Fixed getEmployeeDisplay function to use translations for assignment labels"
    ],
    bugfixes: [
      "🔧 Fixed assignment filter showing incomplete employee list due to pagination",
      "🎯 Fixed bulk unassign not working - added missing dialog and API endpoint",
      "📐 Fixed accidental edit form opening when clicking near checkboxes",
      "🔍 Resolved employees with assets on other pages not appearing in filter",
      "✅ Fixed checkbox double-triggering with pointer-events optimization",
      "🗃️ Identified database schema mismatch for asset transaction types:",
      "   ✅ Found TypeScript types missing 'Upgrade' and 'Retirement' enum values",
      "   ✅ Documented need for database enum sync with schema definition"
    ]
  }
},
{
  version: "0.3.5",
  date: "2025-09-12",
  title: "Upgrade Management & Material Design Dashboard",
  type: "minor",
  changes: {
    features: [
      "🚀 New Upgrade Management System:",
      "   📝 Simplified upgrade request form with hardware/software categories",
      "   👥 Searchable employee approval workflow with auto date-filling",
      "   💰 Purchase tracking to differentiate in-stock vs purchase-required items",
      "   📊 Full integration with asset history tracking",
      "   🌐 Complete bilingual support (English/Arabic)",
      "🎨 Material Design 3 Dashboard Styling:",
      "   🎯 Applied MD3 design system with rounded corners and gradients",
      "   ✨ Enhanced shadows with elevation system",
      "   🎨 Color-coded metrics (Primary: Indigo, Secondary: Pink, Tertiary: Teal)",
      "   📊 Progress bars and animated badges for visual metrics",
      "   🔄 Smooth animations (fadeIn, slideIn, scaleIn effects)",
      "📈 Enhanced Asset History:",
      "   📦 Expanded transaction types (Maintenance, Sale, Retirement)",
      "   🔍 Rich metadata display in history views",
      "   💾 Hybrid architecture combining transactions with specialized data",
      "🛠️ Deployment Script Enhancements:",
      "   💾 Storage monitoring with color-coded indicators",
      "   🧹 Maintenance operations for clearing logs and caches",
      "   🔄 Schema synchronization checking against database"
    ],
    improvements: [
      "🏗️ Dashboard restructured from 4 tabs to 3 tabs",
      "📊 Merged Activity timeline and Analytics into Insights tab",
      "🆕 Created new Overview tab as primary view with summary cards",
      "⬆️ Reordered Maintenance Schedule to top position",
      "🎯 Asset detail views with conditional display based on status",
      "📝 Standardized data structures across frontend and backend",
      "🔒 Enhanced authentication flow preventing 401 errors",
      "⚡ Improved query invalidation for real-time updates"
    ],
    bugfixes: [
      "🔧 Fixed JavaScript errors preventing upgrade records from displaying",
      "📋 Resolved 'Cannot read properties of undefined' errors on page refresh",
      "🔄 Fixed data structure mismatches between API and frontend",
      "📁 Removed backend route code mistakenly placed in frontend files",
      "🖼️ Fixed checkout dialog overflow with fields outside boundaries",
      "🔄 Resolved table refresh issues after checkout operations",
      "📦 Fixed bulk status update for selling and retiring assets",
      "💰 Corrected currency display inconsistencies",
      "🔧 Fixed maintenance data not displaying in history views",
      "🔑 Resolved authentication flow 401 errors"
    ]
  }
},
  {
  version: "0.3.0",
  date: "2025-09-07",
  title: "Dashboard Overhaul & Enhanced Metrics",
  type: "minor",
  changes: {
    features: [
      "🎨 Complete Dashboard Redesign:",
      "   📊 New Overview tab with 8 key metric cards for quick insights",
      "   📈 Renamed 'Overview' to 'Insights' for detailed analytics",
      "   🔄 Moved Activity Timeline from separate tab to Insights section",
      "   📦 Moved Assets by Type from Analytics tab to Insights",
      "   ❌ Removed Analytics and Activity tabs for cleaner navigation",
      "🔧 Enhanced Maintenance Schedule:",
      "   📊 Added Total Maintenance card showing combined metrics",
      "   🎯 Visual icons for each maintenance status (Overdue, Scheduled, In Progress)",
      "   🎨 Color-coded cards with hover effects",
      "   📍 5-column layout including total count",
      "📊 New Dashboard Metrics:",
      "   👥 Offboarded with Assets - tracks resigned/terminated employees with assets",
      "   🆕 Recently Added Employees - shows last 30 days hires",
      "   📦 Assets in Use - filters assets with 'In Use' status",
      "   ✅ Resolved This Month - tracks closed tickets",
      "   📈 Top Departments by Assets - ranking visualization",
      "🎯 Quick Actions Improvements:",
      "   🔘 Larger, more visible action buttons with colored borders",
      "   📝 Full text labels (Add Employee, Add Asset, Open Ticket)",
      "   🔧 Proper dialog sizing (max-w-4xl) matching original forms",
      "   ❌ Removed Export Data button for cleaner interface"
    ],
    improvements: [
      "⚡ Real-time calculations for employee and asset metrics",
      "🎨 Consistent card design with title, number, and description hierarchy",
      "📱 Better responsive layout with proper grid columns",
      "🔄 Activity Timeline moved to end of Insights for better flow",
      "📊 Department asset distribution shown as ranked list",
      "🎯 All metric cards now have visual icons with color coding",
      "💾 Custom filter logic matching Employees page Quick Filters",
      "📐 Dashboard padding fixed (p-6) for proper edge spacing",
      "🎨 Unified color scheme across all status indicators"
    ],
    bugfixes: [
      "🔧 Fixed 'Offboarded with Assets' calculation to match filter logic",
      "🎯 Corrected 'Assets in Use' to filter by status instead of calculation",
      "📊 Fixed 'Recently Added' to show employees joined in last 30 days",
      "🔍 Resolved dashboard data fetching for custom calculations",
      "📐 Fixed dialog sizing issues for Add Employee/Asset/Ticket forms",
      "🎨 Corrected card description colors to use muted-foreground"
    ]
  }
},
{
  version: "0.2.8",
date: "2025-09-02",
title: "Enhanced Employee Selection & UI Improvements",
type: "minor",
changes: {
  features: [
    "🎯 New ActiveEmployeeSelect component for consistent employee selection:",
    "   ✅ Filters to show only active employees across all forms",
    "   ✅ Real-time search across ID, name, department, and position",
    "   ✅ Rich display with department/position badges",
    "   ✅ Scrollable dropdown with configurable height",
    "   ✅ Bilingual support (English/Arabic)",
    "📍 Integrated in asset management and employee forms",
    "⚡ 5-minute data caching for improved performance"
  ],
  improvements: [
    "🎨 Consistent employee selection UI across the application",
    "📊 Better data filtering with active employee status",
    "🔍 Improved search accuracy in employee selection",
    "📱 Responsive dropdown sizing and positioning",
    "⚙️ Reusable component architecture"
  ],
  bugfixes: [
    "🔧 Fixed inactive employees appearing in selection lists",
    "🎯 Resolved dropdown scrolling issues",
    "📐 Fixed search returning incorrect multiple results",
    "🔄 Corrected dropdown positioning in forms",
    "📁 Resolved build issues with file extensions"
  ]
}
},
{
  version: "0.2.7",
  date: "2025-08-30",
  title: "Performance Optimization & Maintenance Management",
  type: "minor",
  changes: {
    features: [
      "🚀 Backend Pagination System for Assets:",
      "   📄 Server-side pagination with 50 items per page default",
      "   🔢 Configurable items per page (25, 50, 100, 200 options)",
      "   ⏭️ Full pagination controls (first/last/next/previous navigation)",
      "   💨 80% faster initial page load for large asset inventories",
      "🔧 Enhanced Maintenance Management:",
      "   📅 Dynamic last maintenance date from completed records",
      "   ⏰ Scheduled maintenance tracking with status indicators",
      "   🎯 Filter assets by maintenance status (Scheduled/In Progress/Completed)",
      "   🔄 Real-time maintenance status calculation without schema changes",
      "📊 Improved Dashboard Maintenance Widget:",
      "   📈 Live maintenance counts for Scheduled and In Progress",
      "   🔗 Clickable cards navigate to filtered asset views",
      "   🎨 Color-coded status indicators (blue for scheduled, orange for in-progress)",
      "   📍 Direct navigation from dashboard to maintenance-filtered assets"
    ],
    improvements: [
      "⚡ Reduced Assets page memory usage by loading only visible data",
      "🔍 Backend filtering applied before pagination for optimal performance",
      "📡 API returns paginated response with metadata (total count, pages)",
      "🔄 Smooth page transitions with keepPreviousData option",
      "🎯 Maintenance data enrichment only for current page assets",
      "🔗 URL parameters preserved for dashboard-to-assets navigation"
    ],
    bugfixes: [
      "🔧 Fixed AssetHistory and Notifications expecting array instead of paginated response",
      "🎯 Corrected maintenance filter logic to properly return boolean values",
      "📐 Fixed duplicate const declaration in maintenance endpoint",
      "🔍 Resolved search functionality with backend filtering"
    ]
  }
},
  {
  version: "0.2.6",
  date: "2025-08-29",
  title: "Bug Fixes & Maintenance Tracking",
  type: "minor",
  changes: {
    features: [
      "🛠️ Comprehensive Asset Maintenance Tracking System:",
      "   ⏰ Visual maintenance indicators in assets table (overdue/due soon/scheduled)",
      "   🎨 Color-coded row highlighting based on maintenance urgency",
      "   🔍 New maintenance filter to view assets by maintenance status",
      "   📊 Dashboard widget showing maintenance overview with counts",
      "   🔗 Clickable dashboard cards for quick navigation to filtered views",
      "🔍 Enhanced Ticket 'Submitted By' field with searchable combobox:",
      "   ✅ Type-to-search functionality for finding employees",
      "   ✅ Shows only active employees (filters out resigned/terminated)",
      "   ✅ Displays employee department for context",
      "   ✅ Auto-closes on selection for better workflow",
      "   ✅ Consistent width with trigger button"
    ],
    improvements: [
      "📋 Asset filter dropdowns now scrollable with consistent height (200px max)",
      "🎯 Related Asset field shows only selected employee's assigned assets",
      "📝 Improved asset display format: 'AssetID, Type Brand ModelName'",
      "⚡ Better search accuracy in employee selection (no irrelevant results)",
      "🎨 Enhanced visual hierarchy with maintenance status indicators",
      "📊 Backend API enhanced with maintenance counts for dashboard"
    ],
    bugfixes: [
      "🔧 Fixed ticket creation showing inactive employees in 'Submitted By' field",
      "🎯 Corrected employee search filtering to prevent showing unrelated names",
      "📐 Fixed combobox popover width to match trigger button properly",
      "🔍 Resolved Related Asset field not filtering by selected employee",
      "📝 Fixed asset display format in ticket forms (now shows model name correctly)"
    ]
  }
},
  {
    version: "0.2.5",
    date: "2025-08-27",
    title: "Enhanced Navigation & RTL Support",
    type: "minor",
    changes: {
       features: [
      "🎯 Smart sidebar with hover-to-open and pin/unpin functionality",
      "📱 Responsive sidebar behavior for mobile and desktop",
      "🔗 URL parameter support for direct asset filtering by EmployeedID, Brand,Type and status",
      "💾 Persistent sidebar state using localStorage",
      "📝 Assets assignment filter field enhanced with searchable combobox:",
      "   ✅ Searchable: Can type to search employees",
      "   ✅ Filtered List: Only shows employees with assigned assets",
      "   ✅ Unassigned Option: Only visible when unassigned assets exist",
      "   ✅ Visual Feedback: Check marks show the selected option",
      "   ✅ Auto-close: Dropdown closes after selection",
      "   ✅ Keyboard Support: Can navigate with arrow keys and select with Enter",
      "   ✅ Clear Selection: Can select 'All Assignments' to remove filter"
    ],
      improvements: [
        "⚡ Improved page load performance",
        "🎨 Better visual feedback for interactive elements",
        "📊 Enhanced data table filtering capabilities",
        "🔄 Smoother transitions and animations",
        "🔄 Revamped Changelog design"
      ],
      bugfixes: [
        "🌍 Fixed Arabic RTL layout issues with sidebar positioning",
        "🔧 Corrected default language initialization to English",
        "📝 Fixed employee and asset import field mappings",
        "🎯 Resolved asset filtering by assigned employee",
        "🔄 Asset History page now auto-refreshes when navigating from other pages",
        "📊 Corrected device specifications field mapping in transaction details",
        "🎨 Improved transaction details dialog with side-by-side layout and better visual hierarchy",
        "📊 Corrected required fields check before creating ticket",
      ]
    }
  },
  {
    version: "0.2.4",
    date: "2025-08-24",
    title: "Asset Management Improvements",
    type: "minor",
    changes: {
      features: [
        "📊 New asset depreciation calculation",
        "🏷️ Custom asset status management with colors",
        "📈 Enhanced reporting capabilities",
        "🔍 Advanced search with multiple filters"
      ],
      improvements: [
        "🚀 Faster asset listing page load",
        "💼 Better employee-asset relationship management",
        "📱 Mobile-responsive asset tables",
        "🎨 Improved UI consistency"
      ],
      bugfixes: [
        "✅ Fixed asset check-in/check-out workflow",
        "📋 Corrected CSV import for special characters",
        "🔢 Fixed asset ID generation sequence"
      ]
    }
  },
  {
    version: "0.2.1",
    date: "2024-01-10",
    title: "Ticket System Enhancements",
    type: "minor",
    changes: {
      features: [
        "🎫 SLA tracking for tickets",
        "⏰ Time tracking functionality",
        "🔔 Email notifications for ticket updates",
        "📎 File attachments support"
      ],
      improvements: [
        "🎯 Better ticket assignment workflow",
        "📊 Enhanced ticket reporting",
        "🔍 Improved ticket search and filtering"
      ],
      bugfixes: [
        "🐛 Fixed ticket status transitions",
        "📧 Resolved email notification delays",
        "🔄 Fixed ticket history tracking"
      ]
    }
  },
  {
    version: "0.2.0",
    date: "2025-8-01",
    title: "Major System Overhaul",
    type: "major",
    changes: {
      features: [
        "👥 Complete user management system",
        "🔐 Role-based access control (RBAC)",
        "📊 Comprehensive audit logging",
        "🌐 Multi-language support (English/Arabic)",
        "📈 Advanced reporting dashboard"
      ],
      breaking: [
        "⚠️ New authentication system - all users must reset passwords",
        "⚠️ Database schema updated - backup required before upgrade",
        "⚠️ API endpoints restructured - integration updates needed"
      ],
      security: [
        "🔒 Implemented secure session management",
        "🛡️ Added CSRF protection",
        "🔐 Enhanced password encryption",
        "📝 Added comprehensive audit trails"
      ]
    }
  },
  {
    version: "0.1.5",
    date: "2025-7-10",
    title: "Import/Export Features",
    type: "major",
    changes: {
      features: [
        "📥 Bulk import from CSV files",
        "📤 Export data to CSV format",
        "📋 Import templates for all entities",
        "🔄 Data validation during import"
      ],
      improvements: [
        "⚡ Faster bulk operations",
        "📊 Better error reporting for imports",
      ]
    }
  },
  {
    version: "0.1.0",
    date: "2025-05-17",
    title: "Initial Release",
    type: "major",
    changes: {
      features: [
        "👷 Employee management system",
        "💻 Asset tracking and management",
        "🎫 Basic ticket system",
        "📊 Simple reporting",
        "🔐 User authentication",
        "📱 Responsive design"
      ]
    }
  }
];

// Function to get the latest version
export const getLatestVersion = (): string => {
  return CHANGELOG_DATA[0]?.version || "0.0.0";
};

// Function to get changes since a specific version
export const getChangesSince = (version: string): ChangelogEntry[] => {
  const index = CHANGELOG_DATA.findIndex(entry => entry.version === version);
  return index > 0 ? CHANGELOG_DATA.slice(0, index) : [];
};

// Function to check if there are new updates
export const hasNewUpdates = (lastViewedVersion: string): boolean => {
  return CHANGELOG_DATA[0]?.version !== lastViewedVersion;
};