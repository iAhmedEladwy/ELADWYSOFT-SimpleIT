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
      "✅ Fixed overlapped asset edit form duplicated when click on purchase information",
      "📐 Fixed combobox popover width to match trigger button properly",
      "🔍 Resolved Related Asset field not filtering by selected employee",
      "   Fixed asset_maintenance table missed status column migration script included",
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