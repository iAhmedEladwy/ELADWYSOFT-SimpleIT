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
    version: "0.4.7",
    date: "2025-11-11",
    title: "Complete In-App Notification System & System Logging",
    type: "minor",
    changes: {
      features: [
        "🔔 Global Notification Bell - Always-accessible notification icon in header with unread count badge",
        "📬 Notification Dropdown - Quick preview of last 5 notifications without leaving current page",
        "🎯 Notification Dashboard Tab - Dedicated notifications tab with paginated list (100 items)",
        "🔄 Auto-Refresh - Notifications automatically update every 30 seconds",
        "📱 Smart Routing - Click notification to navigate to relevant page (Assets, Tickets, Employees)",
        "✅ Mark as Read - Individual and bulk mark-as-read functionality",
        "🗑️ Dismiss Notifications - Remove notifications directly from dropdown",
        "� Bilingual Support - Full English/Arabic translation for all notification UI",
        "⚡ 12 Automated Triggers - Server-side notifications for all major workflows:",
        "   • 🎫 Ticket Assignment - Notifies when tickets are assigned with urgent detection",
        "   • 📦 Asset Check-Out/In - Notifies employees when assets are assigned or returned",
        "   • 🔄 Ticket Status Changes - Updates both submitter and assigned user on status changes",
        "   • 🔧 Maintenance Alerts - Scheduled and completed maintenance notifications",
        "   • 📈 Upgrade Requests - Notifies managers of upgrade requests and requesters of decisions",
        "   • 📢 System Broadcasts - Admin-only announcements with role-based targeting",
        "   • 👋 Employee Onboarding - Alerts admins when new employees start in the future",
        "   • 👋 Employee Offboarding - Reminds admins about asset recovery for terminated employees",
        "📡 Broadcast API - Admin endpoint for system-wide announcements with role targeting",
        "⚙️ Notification Preferences - Complete user control over notification types:",
        "   • Notification tab in User Profile page",
        "   • 7 preference toggles (tickets, assets, maintenance, upgrades, system, employee)",
        "   • Smart filtering - respects preferences before creating notifications",
        "   • Auto-creates default preferences (all enabled) for new users",
        "   • Bilingual preference labels and descriptions",
        "🔐 Super Admin Role - New access level 5 above regular admin for developer tools",
        "📝 System Logs - Comprehensive logging infrastructure for debugging and monitoring:",
        "   • Hybrid logging: Console (dev) + File (daily rotation) + Database (errors only)",
        "   • 5 log levels: DEBUG, INFO, WARN, ERROR, CRITICAL",
        "   • Advanced filters: level, module, search, date range, status",
        "   • Statistics dashboard: total logs, 24h errors, unresolved issues, top modules",
        "   • Mark as resolved, export CSV, cleanup old logs",
        "   • Hidden access via triple-click version text (Super Admin only)",
        "🔧 Logger Service - Centralized logging with helpers for HTTP requests and errors",
      ],
      improvements: [
        "⏰ Time Display - Human-readable timestamps (e.g., '5 minutes ago', '2 hours ago')",
        "🎨 Visual Indicators - Color-coded icons for different notification types (Asset, Ticket, Employee, System)",
        "🔵 Unread Badges - Blue dot indicator for unread notifications",
        "📊 Smart Badge - Shows '9+' when unread count exceeds 9",
        "🔗 URL-Based Navigation - Support for ?tab=notifications in Dashboard URL",
        "🎯 Shared Notification Hook - Reusable useNotifications() hook with pagination support",
        "📦 Notification Types - Support for Asset, Ticket, Employee, and System notifications",
        "🏗️ Route Modularization - Extracted routes into focused modules:",
        "   • server/routes/backup.ts (368 lines) - Backup/restore operations",
        "   • server/routes/systemHealth.ts (32 lines) - System monitoring",
        "   • server/routes/notifications.ts (228 lines) - Notification API",
        "   • server/routes/systemLogs.ts (206 lines) - System logs API",
        "📉 Code Cleanup - Reduced main routes.ts complexity with modular architecture",
        "🎯 Service Layer - Centralized notification logic with 14 reusable templates",
        "⚡ Performance - Server-side pagination, smart caching, background processing",
        "🛡️ Error Handling - Non-blocking notifications with proper error logging",
        "📁 Daily Log Files - Automatic rotation in logs/ directory for historical tracking",
      ],
      security: [
        "🔒 Super Admin Protection - Hidden menu, exclusive permissions, role guard on all endpoints",
        "🛡️ System Logs Access - Only super_admin role can view/manage system logs",
      ],
    }
  },
  {
    version: "0.4.6",
    date: "2025-11-08",
    title: "PWA Support & Advanced Filtering",
    type: "minor",
    changes: {
      features: [
        "📱 Progressive Web App (PWA) - Install SimpleIT as a native-like app on mobile, tablet, and desktop",
        "🔌 Offline Support - Beautiful offline fallback page with bilingual support (EN/AR)",
        "💾 Smart Caching - Network-first for API calls, cache-first for static assets",
        "📥 Install Prompt - Custom install banner with dismissal persistence",
        "🌐 Online/Offline Indicator - Real-time network status in header",
        "📊 Kanban Board View - Visual workflow board for tickets with drag-and-drop status updates",
        "🎯 Multi-Select Filters - Type, Brand, and Status on Assets page",
        "🎯 Multi-Select Status Filter - Tickets page with default Open/In Progress view",
        "📅 Date Filtering - Comprehensive date range filters for tickets (quick filters + custom range)",
        "🔄 View Toggle - Switch between Table and Kanban views for tickets",
        "📤 Export Button - Added CSV export to tickets page",
      ],
      improvements: [
        "🎨 Enhanced ticket filtering with checkbox-based multi-select popovers",
        "📆 Compact date pickers using custom Calendar component",
        "⚡ Real-time ticket count badges in status filters",
        "🎯 Cascading filters for assets (Type → Brand → Model)",
        "💡 Visual feedback with selected item counts (e.g., '3 selected')",
        "🔧 Individual clear buttons for each filter group",
        "📌 Centralized version management in shared/version.ts",
        "🌍 PWA manifest with app metadata and bilingual support",
        "⚙️ Service worker with automatic cache cleanup and update detection",
      ],
      bugfixes: [
        "🔧 Removed obsolete 'Pending' status from ticket filters",
        "🔧 Fixed multi-select popovers closing after single selection",
        "🔧 Fixed date filter field widths for better layout",
      ]
    }
  },
  {
    version: "0.4.5",
    date: "2025-10-10",
    title: "Employee Self-Service Portal & Enhanced User Experience",
    type: "major",
    changes: {
      features: [
        "🎯 Employee Portal - Complete self-service portal with dashboard, assets, tickets, and profile management",
        "📦 Asset History Tracking - View assignment history, maintenance records, and related tickets",
        "🎫 Enhanced Ticket Management - Advanced filtering, search, sorting, and category-based creation",
        "👤 Profile Management - Edit contact information and change password",
        "🔐 Enhanced password reset with bilingual support",
        "🛡️ Added rate limiting and IP tracking for security",
        "📧 Improved email templates with better localization",
      ],
      improvements: [
        "🎨 UI/UX - Consistent footer positioning, responsive layout, bilingual support (EN/AR)",
        "⚙️ Version Management - Centralized version system across the application",
        "🔧 Portal Backend - Dedicated API routes with RBAC enforcement and optimized queries",
        "🔐 Security - Employee-only access with session-based authentication",
      ],
       security: [
        "🔒 Enhanced audit logging for password reset attempts",
        "🚫 Added protection against brute force attacks",
      ],
      bugfixes: [
        "🔧 Fixed category selection in ticket creation (corrected storage method)",
        "🔧 Fixed ticket comments not appearing in portal (added getTicketComments to endpoint)",
        "🔧 Fixed duplicate ELADWYSOFT branding in portal footer",
        "🔧 Fixed footer positioning - now stays at bottom consistently",
        "🔧 Fixed password reset API endpoint method issue",
      ]
    }
  },
  {
    version: "0.4.3",
    date: "2025-10-02",
    title: "Complete Authentication Overhaul & RBAC Migration",
    type: "major",
    changes: {
      features: [
        "🔐 Dual authentication - login with username OR email",
        "🛡️ Complete RBAC migration - all routes now use role-based access control",
        "📊 Enhanced notifications system with database persistence and smart prioritization",
        "⚡ Dashboard restructured to 2-tab layout (Overview & Insights) for better performance",
        "🎛️ Enhanced SystemConfig with tabbed interface and company details management"
      ],
      improvements: [
        "🔐 Authentication System Overhaul:",
        "   • Simplified AuthContext - removed shouldCheckAuth complexity",
        "   • Auth check runs immediately on mount for faster load times",
        "   • Added hasCheckedAuth flag to eliminate login page flash",
        "   • Single-click login with direct fetchQuery (no polling)",
        "   • Enhanced session management with proper persistence",
        "⚡ Performance Optimizations:",
        "   • Conditional queries - reduced API calls by 40%+",
        "   • Notifications component with useMemo and role-based filtering",
        "   • Removed unused systemConfig query (100% performance gain)",
        "   • Smart query enabling based on user assets and role level",
        "🎯 Code Quality & React Best Practices:",
        "   • Fixed Rules of Hooks violations - all hooks unconditional",
        "   • Enhanced TypeScript type safety throughout",
        "   • Production-ready logging (dev-only console statements)",
        "   • Proper dependency arrays and effect cleanup",
        "🛡️ Security & Access Control:",
        "   • Complete RBAC implementation across all 5 route batches",
        "   • Fixed critical case sensitivity in requireRole function",
        "   • Enhanced role hierarchy with proper permission inheritance",
        "🔧 System Configuration:",
        "   • Configurable server port via PORT environment variable",
        "   • Relocated and organized custom fields under single tab",
        "   • Enhanced asset management with improved UX dialogs"
      ],
      bugfixes: [
        "🔧 Critical Authentication Fixes:",
        "   • Fixed infinite login loop caused by session race conditions",
        "   • Eliminated login page flash on refresh/navigation",
        "   • Fixed redirect loops at root path and authentication states",
        "   • Resolved multiple-click login requirement (now single-click)",
        "   • Fixed race conditions between login mutation and user queries",
        "🔧 Performance & Stability:",
        "   • Fixed notification component re-rendering on every update",
        "   • Eliminated unnecessary API calls for users without assets",
        "   • Fixed memory leaks in conditional query implementations",
        "   • Resolved TypeScript implicit 'any' types in auth context",
        "🔧 UI/UX Improvements:",
        "   • Fixed asset details dialog user experience issues",
        "   • Removed duplicate 'My Profile' button from sidebar",
        "   • Fixed form validation in password and input fields",
        "   • Enhanced loading states with proper skeletons",
        "🔧 Database Schema Fixes:",
        "   • Fixed critical ticket creation error - 'column category does not exist'",
        "   • Aligned server routes with database schema using categoryId instead of category",
        "   • Enhanced ticket form validation to require category selection",
        "   • Fixed all ticket import functions to use correct schema (title vs summary, categoryId vs category)",
        "   • Added automatic category name-to-ID mapping for bulk imports with fallback creation",
        "   • Improved error handling for missing required ticket fields"
      ],
      security: [
        "🛡️ Enhanced RBAC with hierarchical permission system",
        "🔐 Improved session handling with proper token management",
        "🔒 Fixed authentication bypass vulnerabilities in route protection"
      ]
    }
  },
  {
  version: "0.4.1",
  date: "2025-09-20",
  title: "Scheduled Backups & Bulk Operations ⚠️ MIGRATION REQUIRED",
  type: "major",
  changes: {
    breaking: [
      "⚠️ DATABASE SCHEMA CHANGES:",
      "   • Added 'backup_filename' column to restore_history table",
      "   • Added 'backup_jobs' table for scheduling",
      "   • Run: scripts/migrate-v0.4.1-backup-filename.sql",
      "   • Minimal downtime, backward compatible"
    ],
    features: [
      "⏰ Scheduled backup system with daily/weekly/monthly options",
      "📊 Bulk operations history tracking with filtering and export",
      "💾 Enhanced backup/restore with user attribution and filename preservation"
    ],
    improvements: [
      "📊 Standardized export date formatting across all endpoints",
      "🧹 Removed duplicate user management from SystemConfig",
      "🎯 Enhanced manager name resolution in exports",
      "🔧 Improved backup job status tracking"
    ],
    bugfixes: [
      "🔧 Fixed Dashboard ticket dialog display issues",
      "📊 Fixed changelog tab filtering functionality",
      "📈 Fixed employee export date formatting and manager names",
      "🔧 Fixed bulk retire 'notes is not defined' error",
      "📊 Fixed employee page refresh button failures"
    ]
  }
},
{
  version: "0.4.0",
  date: "2025-09-17",
  title: "Tickets Module Overhaul & System Cleanup",
  type: "major",
  changes: {
    features: [
      "🎫 Simplified tickets schema from 30+ to 21 core fields",
      "⚡ ITIL-compliant auto-priority calculation (urgency × impact)",
      "🗑️ Removed unused Service Provider system",
      "🔧 PostgreSQL trigger functions for automatic priority"
    ],
    improvements: [
      "⚡ 30% performance improvement through schema simplification",
      "🎯 Priority now auto-calculated and read-only",
      "📋 Consolidated duplicate form components",
      "🔄 Enhanced inline editing with better validation"
    ],
    bugfixes: [
      "🔧 Fixed ticket creation crashes during employee selection",
      "📝 Fixed date picker integration issues",
      "🗑️ Removed orphaned service provider references"
    ],
    breaking: [
      "⚠️ Priority field now auto-calculated (manual setting removed)",
      "⚠️ Service provider endpoints removed",
      "⚠️ Requires `npm run db:push` for schema update"
    ]
  }
},
{
  version: "0.3.7",
  date: "2025-09-15",
  title: "Unified Calendar System & Export Fixes",
  type: "major",
  changes: {
    features: [
      "📅 Unified calendar component across all forms (mode='picker')",
      "📄 Fixed export generation in Asset History",
      "🔧 Complete Reports system revamp"
    ],
    improvements: [
      "⚡ Simplified date handling with YYYY-MM-DD format",
      "📊 Enhanced asset filters with scrollable lists and pagination",
      "🎫 Added search in ticket 'submitted by' field",
      "📈 Updated dashboard summaries and metrics"
    ],
    bugfixes: [
      "🔧 Fixed 'Popover not defined' errors in Asset History",
      "🎫 Fixed ticket creation white screen on employee selection",
      "📊 Fixed overlapped asset edit form issues",
      "📄 Resolved PDF export and print dependencies"
    ]
  }
},
{
  version: "0.3.6",
  date: "2025-09-13",
  title: "Enhanced Filtering & Bulk Operations",
  type: "minor",
  changes: {
    features: [
      "🔍 New /api/employees/with-assets endpoint for efficient filtering",
      "⚡ Bulk unassign assets functionality with validation",
      "🌐 Comprehensive bilingual translations (18+ new keys)"
    ],
    improvements: [
      "🎯 Relocated bulk actions button for better UX",
      "🖱️ Larger checkbox click areas prevent accidental form triggers",
      "📊 Assignment filter shows ALL employees with assets (not paginated)",
      "⚡ Reduced memory usage with dedicated API calls"
    ],
    bugfixes: [
      "🔧 Fixed incomplete employee list in assignment filter",
      "🎯 Fixed bulk unassign missing dialog and endpoint",
      "📐 Fixed accidental edit form opening near checkboxes"
    ]
  }
},
{
  version: "0.3.5",
  date: "2025-09-12",
  title: "Upgrade Management & Material Design",
  type: "minor",
  changes: {
    features: [
      "🚀 New upgrade management system with request workflow",
      "🎨 Material Design 3 dashboard with MD3 styling",
      "📈 Enhanced asset history with maintenance/sale/retirement tracking",
      "🛠️ Deployment script with storage monitoring"
    ],
    improvements: [
      "🏗️ Dashboard restructured from 4 to 3 tabs",
      "📊 Merged Activity and Analytics into Insights tab",
      "🎯 Asset detail views with conditional display",
      " Enhanced authentication preventing 401 errors"
    ],
    bugfixes: [
      "🔧 Fixed upgrade records display errors",
      "📋 Resolved undefined properties on page refresh",
      "🖼️ Fixed checkout dialog overflow issues",
      "📦 Fixed bulk status updates for selling/retiring"
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
      "🎨 Complete dashboard redesign with 8 key metric cards",
      "📈 Renamed Overview to Insights for detailed analytics",
      " Enhanced maintenance schedule with total metrics",
      " New metrics: Offboarded with Assets, Recently Added, Assets in Use",
      "🎯 Larger quick action buttons with colored borders"
    ],
    improvements: [
      "⚡ Real-time calculations for employee and asset metrics",
      "🎨 Consistent card design with visual hierarchy",
      " Activity Timeline moved to Insights section",
      "📊 Department asset distribution as ranked list"
    ],
    bugfixes: [
      "🔧 Fixed Offboarded with Assets calculation",
      "🎯 Corrected Assets in Use filtering by status",
      "📊 Fixed Recently Added 30-day calculation",
      "📐 Fixed dialog sizing for Add forms"
    ]
  }
},
{
  version: "0.2.8",
date: "2025-09-02",
title: "Enhanced Employee Selection",
type: "minor",
changes: {
  features: [
    "🎯 New ActiveEmployeeSelect component with real-time search",
    "🔍 Rich display with department/position badges",
    "📍 Integrated in asset and employee forms",
    "⚡ 5-minute data caching"
  ],
  improvements: [
    "🎨 Consistent employee selection UI",
    "📊 Better filtering with active status",
    "📱 Responsive dropdown sizing"
  ],
  bugfixes: [
    "🔧 Fixed inactive employees in selection lists",
    "🎯 Resolved dropdown scrolling issues",
    "📐 Fixed search returning incorrect results"
  ]
}
},
{
  version: "0.2.7",
  date: "2025-08-30",
  title: "Performance Optimization & Maintenance",
  type: "minor",
  changes: {
    features: [
      "🚀 Backend pagination (50 items/page, configurable)",
      " Enhanced maintenance management with status tracking",
      "📊 Dashboard maintenance widget with live counts",
      "� Clickable cards navigate to filtered views"
    ],
    improvements: [
      "⚡ 80% faster initial load for large inventories",
      "💨 Reduced memory usage loading only visible data",
      "🔍 Backend filtering before pagination",
      " Smooth page transitions"
    ],
    bugfixes: [
      "🔧 Fixed AssetHistory expecting array vs paginated response",
      "🎯 Corrected maintenance filter boolean logic",
      "🔍 Resolved search with backend filtering"
    ]
  }
},
  {
  version: "0.2.6",
  date: "2025-08-29",
  title: "Maintenance Tracking & Ticket Improvements",
  type: "minor",
  changes: {
    features: [
      "🛠️ Comprehensive maintenance tracking with visual indicators",
      "🎨 Color-coded row highlighting by urgency",
      "🔍 Searchable combobox for Ticket 'Submitted By' field",
      "📊 Dashboard widget with maintenance overview"
    ],
    improvements: [
      "📋 Scrollable filter dropdowns (200px max)",
      "🎯 Related Asset shows only employee's assets",
      "📝 Improved asset display format",
      "⚡ Better search accuracy"
    ],
    bugfixes: [
      "🔧 Fixed inactive employees in ticket creation",
      "🎯 Corrected employee search filtering",
      "� Fixed Related Asset not filtering by employee"
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
      "📱 Responsive sidebar with persistent state (localStorage)",
      "🔗 URL parameter support for asset filtering by employee, brand, type, status",
      "📝 Searchable combobox for asset assignment filter with keyboard support"
    ],
      improvements: [
        "⚡ Improved page load performance",
        "🎨 Better visual feedback and smoother transitions",
        "📊 Enhanced data table filtering",
        "🔄 Revamped Changelog design"
      ],
      bugfixes: [
        "🌍 Fixed Arabic RTL layout issues with sidebar",
        "🔧 Corrected default language to English",
        "📝 Fixed employee and asset import field mappings",
        "🔄 Asset History auto-refreshes when navigating from other pages",
        "📊 Corrected transaction details field mapping"
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
        "📱 Mobile-responsive asset tables"
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
        "🔍 Improved search and filtering"
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
        "⚠️ New authentication - password reset required",
        "⚠️ Database schema updated - backup before upgrade",
        "⚠️ API endpoints restructured"
      ],
      security: [
        "🔒 Secure session management",
        "🛡️ CSRF protection",
        "🔐 Enhanced password encryption",
        "📝 Comprehensive audit trails"
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
        "📊 Better error reporting for imports"
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