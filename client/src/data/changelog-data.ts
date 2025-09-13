// client/src/data/changelog-data.ts
// This file contains all the changelog entries for the SimpleIT system
// Developers can easily add new entries here without database access

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
  version: "0.3.6",
  date: "2025-01-11",
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
      "⚡ Reduced memory usage by fetching only employees with assets"
    ],
    bugfixes: [
      "🔧 Fixed assignment filter showing incomplete employee list due to pagination",
      "🎯 Fixed bulk unassign not working - added missing dialog and API endpoint",
      "📐 Fixed accidental edit form opening when clicking near checkboxes",
      "🔍 Resolved employees with assets on other pages not appearing in filter",
      "✅ Fixed checkbox double-triggering with pointer-events optimization"
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