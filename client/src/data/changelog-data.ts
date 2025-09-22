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
    version: "0.4.2",
    date: "2025-09-21",
    title: "System Configuration Enhancement & Email Service Integration",
    type: "major",
    changes: {
      features: [
        "🏢 Company Details Management - Complete company information system with name, address, phone, email, and website fields for organizational branding",
        "📧 Email Service Integration - Full email configuration system with SMTP settings, authentication, secure connections, and testing capabilities",
        "🐳 Docker Containerization - Complete Docker deployment support with multi-stage builds, PostgreSQL 16, and Nginx reverse proxy for production environments",
        "🛠️ Docker Management Tools - PowerShell automation scripts for easy deployment, updates, monitoring, and maintenance operations",
        "⚙️ Enhanced System Configuration - Expanded system settings with company details, email configuration, and improved organizational management",
        "🔧 Email Configuration API - RESTful endpoints for email setup (/api/email-config) with configuration, testing, and status checking capabilities",
        "📊 Email Service Management - Centralized email service with NodeMailer integration, configuration validation, and error handling"
      ],
      improvements: [
        "🎯 System Configuration UI - Enhanced SystemConfig page with comprehensive company details form and bilingual support (English/Arabic)",
        "🔐 Email Security - Secure email configuration storage with password encryption and TLS support for various email providers",
        "� Production Deployment - Docker Compose orchestration with PostgreSQL database, Nginx proxy, health checks, and volume persistence",
        "📦 Container Architecture - Multi-stage Docker builds with Node.js 22 LTS, optimized dependencies, and security best practices",
        "�📱 Responsive Design - Improved system configuration interface with better mobile responsiveness and user experience",
        "🌐 Translation System - Updated translation arrays for better language management and consistency across the platform",
        "🔧 Configuration Management - Streamlined system settings with better organization and user-friendly interfaces"
      ],
      bugfixes: [
        "📧 Email Service Initialization - Fixed email service startup and configuration loading from database",
        "🔧 System Config Updates - Resolved system configuration saving and retrieval issues",
        "🐳 Container Deployment - Fixed Docker networking, database connections, and service dependencies for reliable containerized deployment",
        "🌐 Translation Array Migration - Fixed translation system to use arrays instead of objects for better performance",
        "📝 Database Schema Updates - Improved system configuration schema for company and email settings",
        "🔒 Configuration Security - Enhanced security for storing sensitive email configuration data"
      ],
      breaking: [
        "⚠️ Translation System Change - Migrated from object-based to array-based translations (requires translation updates)",
        "⚠️ System Configuration Schema - Updated system config database structure for company and email fields",
        "⚠️ Docker Deployment - Application now supports containerized deployment (optional, existing installations continue to work)"
      ],
      security: [
        "🔒 Email Credentials Security - Secure storage and handling of email authentication credentials",
        "🛡️ Configuration Access Control - Restricted system configuration access to admin users only",
        "� Container Security - Docker deployment with proper user permissions, secure networking, and isolated database environment",
        "�🔐 Email Testing Security - Secure email testing functionality with proper validation and error handling"
      ]
    }
  },
  {
  version: "0.4.1",
  date: "2025-09-20",
  title: "Scheduled Backups, Bulk Operations History & System Enhancements ⚠️ MIGRATION REQUIRED",
  type: "major",
  changes: {
    breaking: [
      "⚠️ DATABASE SCHEMA CHANGES - MIGRATION REQUIRED:",
      "    Run migration script: scripts/migrate-v0.4.1-backup-filename.sql",
      "   🔧 Added 'backup_filename' column to 'restore_history' table",
      "   🔧 Added 'backup_jobs' table for scheduled backup functionality",
      "   💡 Migration is backward compatible with minimal downtime"
    ],
    features: [
      "⏰ Scheduled Backup System - Complete automation for database backups with flexible scheduling (daily/weekly/monthly), job management, and manual execution capabilities",
      "📊 Bulk Operations History - Comprehensive tracking and monitoring system for all bulk operations with advanced filtering, pagination, and CSV export",
      "💾 Enhanced Backup & Restore System - User tracking, filename preservation, and improved audit trail for all backup/restore operations"
    ],
    improvements: [
      "🔧 Admin Console Integration - Seamlessly integrated scheduled backups and bulk operations monitoring into existing admin workflow",
      "📊 Export Data Quality - Standardized date formatting and enhanced data readability across all export functions with manager/employee name resolution",
      "🧹 Code Architecture - Cleaned up SystemConfig component, improved API consistency, and enhanced error handling across admin endpoints",
      "🎯 User Experience - Better separation of concerns, reduced component complexity, and improved maintainability"
    ],
    bugfixes: [
      "🔧 Critical Fixes - Fixed 'notes is not defined' error in bulk retire operations and resolved missing queryFn in employee page refresh functionality",
      "� UI Component Fixes - Resolved dashboard ticket dialog issues, audit log details functionality, and changelog page tab filtering",
      "🔄 API & Export Fixes - Corrected endpoint inconsistencies, fixed date formatting in exports, and resolved component structure issues",
      "📈 Data Display Fixes - Fixed missing manager names in employee exports and empty 'Assigned To' fields in asset exports"
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
      "🎫 Complete Tickets Module Restructuring - Simplified schema to 21 core fields with ITIL-compliant priority auto-calculation using urgency × impact matrix",
      "🗑️ System-Wide Code Cleanup - Removed unused Service Provider system, obsolete enum types, and consolidated duplicate components",
      "🔧 Enhanced Form Architecture - Unified Calendar integration, improved validation with Zod schema, and streamlined comment system"
    ],
    improvements: [
      "⚡ Performance Optimizations - Reduced tickets table complexity by 30%, added database indexes, and optimized query patterns",
      "🎯 User Experience Enhancements - Auto-calculating priority display, enhanced inline editing, and streamlined ticket creation workflow",
      "📋 Code Quality Improvements - Eliminated duplicate components, consolidated validation logic, and enhanced TypeScript interfaces"
    ],
    bugfixes: [
      "🔧 Schema & Database Fixes - Removed problematic columns, fixed priority calculation inconsistencies, and resolved constraint conflicts",
      "🎫 Ticket Management Fixes - Fixed form crashes, priority display issues, status validation, and assignment logic",
      "📝 Form & Validation Fixes - Resolved date picker integration, form submission errors, and inline editing conflicts",
      "🗑️ Cleanup & Migration Fixes - Removed orphaned references, fixed migration compatibility, and resolved enum type conflicts"
    ],
    breaking: [
      "⚠️ Database Schema Changes - Tickets table simplified, service provider tables removed, priority field now auto-calculated (requires migration)",
      "⚠️ API Interface Changes - Priority field read-only, service provider endpoints removed, updated validation schema",
      "⚠️ Component Interface Changes - Updated TicketForm props, removed time tracking components, priority selection replaced with badges"
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
      "📅 Unified Calendar Component System - Complete refactor with unified Calendar component, removed deprecated date-input.tsx, and updated all forms",
      "📄 Enhanced Export & PDF Functionality - Fixed export generation, resolved PDF dependencies, and improved document generation reliability",
      "🔧 Complete Reports System Revamp - Comprehensive overhaul with enhanced report generation and improved system stability"
    ],
    improvements: [
      "⚡ Component Architecture Enhancement - Unified calendar system, better error handling, simplified state management, and consistent date formats",
      "📊 Asset Management Improvements - Enhanced filters, proper pagination, improved asset display, and better data accuracy",
      "🎫 Ticket System Enhancements - Added search functionality, improved form handling, and enhanced creation workflow",
      "📈 Dashboard & Display Updates - Updated summary displays, enhanced API calculations, and improved data presentation"
    ],
    bugfixes: [
      "🔧 Critical Calendar & Date Fixes - Fixed Popover reference errors, calendar handlers, datepicker autoclose, and date handling bugs",
      "🎫 Ticket Management Fixes - Resolved white screen errors, form crashes, and employee selection issues",
      "📊 Asset & Data Display Fixes - Fixed white page issues, overlapped forms, card conflicts, and duplicate data problems",
      "📄 Export & PDF Generation Fixes - Fixed export generation, resolved print dependencies, and enhanced reliability"
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
      "🔍 Enhanced Assets Assignment Filter - New dedicated API endpoint showing ALL employees with assets across entire inventory with optimized performance",
      "⚡ Bulk Unassign Assets - Complete bulk unassignment functionality with confirmation dialog, validation, and automatic status updates"
    ],
    improvements: [
      "🎯 UI/UX Enhancements - Relocated bulk actions button, improved checkbox interaction, and eliminated accidental form triggers",
      "📊 Performance Optimizations - Dedicated API calls for filtering, reduced memory usage, and comprehensive employee list display",
      "🌐 Comprehensive Bilingual Support - Added 18+ translation keys, fixed hardcoded text, and completed localization for Assets and Audit components"
    ],
    bugfixes: [
      "🔧 Assignment & UI Fixes - Fixed incomplete employee lists, bulk unassign functionality, and checkbox interaction issues",
      "�️ Database Schema Issues - Identified and documented TypeScript/database enum mismatches for asset transaction types"
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
      "🚀 New Upgrade Management System - Simplified upgrade requests with hardware/software categories, searchable employee workflow, and purchase tracking",
      " Material Design 3 Dashboard Styling - Applied MD3 design system with rounded corners, gradients, color-coded metrics, and smooth animations",
      "📈 Enhanced Asset History - Expanded transaction types with rich metadata display and hybrid architecture",
      "🛠️ Deployment Script Enhancements - Storage monitoring, maintenance operations, and schema synchronization checking"
    ],
    improvements: [
      "🏗️ Dashboard Architecture - Restructured from 4 to 3 tabs, merged Activity and Analytics into Insights, and created new Overview tab",
      "🎯 Asset & Authentication - Enhanced detail views, standardized data structures, and improved authentication flow",
      "⚡ Performance & UX - Improved query invalidation, real-time updates, and enhanced user experience"
    ],
    bugfixes: [
      "🔧 System Stability - Fixed JavaScript errors, undefined property errors, data structure mismatches, and authentication flow issues",
      "� Asset Operations - Resolved checkout dialog overflow, table refresh issues, bulk status updates, and maintenance display problems"
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
      "🎯 ActiveEmployeeSelect Component - Unified employee selection with active filtering, real-time search, and rich display with department/position badges",
      "🔍 Advanced Search Integration - Search across ID, name, department, and position with bilingual support and configurable dropdown height",
      "⚡ Performance Optimization - 5-minute data caching and scrollable interface for improved user experience"
    ],
    improvements: [
      "🎨 UI Consistency - Standardized employee selection across all forms and modules with responsive design",
      "� Component Architecture - Reusable component system with better data filtering and search accuracy"
    ],
    bugfixes: [
      "🔧 Employee Selection Fixes - Resolved inactive employees in lists, dropdown scrolling issues, and search result accuracy",
      "� UI & Build Issues - Fixed dropdown positioning, form layout problems, and file extension build errors"
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
      "🚀 Backend Pagination System - Server-side pagination with configurable items per page (25-200), full navigation controls, and 80% faster load times",
      "🔧 Enhanced Maintenance Management - Dynamic last maintenance tracking, scheduled maintenance with status indicators, and real-time status calculation",
      "📊 Improved Dashboard Widget - Live maintenance counts, clickable navigation cards, and color-coded status indicators"
    ],
    improvements: [
      "⚡ Performance Optimization - Reduced memory usage with backend filtering, API pagination with metadata, and smooth transitions",
      "🔗 Navigation Enhancement - URL parameter preservation and dashboard-to-assets filtering integration"
    ],
    bugfixes: [
      "🔧 API Response Fixes - Corrected AssetHistory and Notifications pagination handling, maintenance filter logic, and search functionality",
      "📐 Code Quality - Resolved duplicate declarations and backend filtering integration issues"
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
      "🛠️ Comprehensive Maintenance Tracking - Visual indicators, color-coded urgency highlighting, maintenance filters, and dashboard overview with clickable navigation",
      "🔍 Enhanced Ticket Employee Search - Searchable combobox with active employee filtering, department context, and auto-close on selection"
    ],
    improvements: [
      "📋 UI/UX Enhancements - Scrollable filter dropdowns, improved asset display format, and better employee asset filtering",
      "📊 Backend Integration - API enhancements for maintenance counts and dashboard widgets"
    ],
    bugfixes: [
      "🔧 Employee & Asset Fixes - Resolved inactive employee visibility, search filtering accuracy, and Related Asset field filtering",
      "� UI Layout Issues - Fixed combobox width, asset display format, and form field alignments"
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