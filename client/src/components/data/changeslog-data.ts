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
    version: "2.3.0",
    date: "2024-01-20",
    title: "Enhanced Navigation & RTL Support",
    type: "minor",
    changes: {
      features: [
        "🎯 Smart sidebar with hover-to-open and pin/unpin functionality",
        "📱 Responsive sidebar behavior for mobile and desktop",
        "🔗 URL parameter support for direct asset filtering",
        "💾 Persistent sidebar state using localStorage"
      ],
      improvements: [
        "⚡ Improved page load performance",
        "🎨 Better visual feedback for interactive elements",
        "📊 Enhanced data table filtering capabilities",
        "🔄 Smoother transitions and animations"
      ],
      bugfixes: [
        "🌍 Fixed Arabic RTL layout issues with sidebar positioning",
        "🔧 Corrected default language initialization to English",
        "📝 Fixed employee and asset import field mappings",
        "🎯 Resolved asset filtering by assigned employee"
      ]
    }
  },
  {
    version: "2.2.0",
    date: "2024-01-15",
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
    version: "2.1.0",
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
    version: "2.0.0",
    date: "2024-01-05",
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
    version: "1.5.0",
    date: "2023-12-20",
    title: "Import/Export Features",
    type: "minor",
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
        "💾 Automatic backup before bulk operations"
      ]
    }
  },
  {
    version: "1.0.0",
    date: "2023-12-01",
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