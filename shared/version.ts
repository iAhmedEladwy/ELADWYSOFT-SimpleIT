/**
 * Application Version Configuration
 * 
 * Context: SimpleIT - Centralized version management
 * 
 * Update this version number to reflect changes across the entire application.
 * This version is displayed in:
 * - Login page
 * - First-time setup page
 * - Portal footer
 * - Admin console
 * - System information
 * 
 * Version Format: MAJOR.MINOR.PATCH
 * - MAJOR: Breaking changes, major feature releases
 * - MINOR: New features, backward compatible
 * - PATCH: Bug fixes, minor improvements
 */

export const APP_VERSION = '1.0.1';
export const APP_NAME = 'SimpleIT';
export const APP_FULL_NAME = 'ELADWYSOFT SimpleIT';
export const APP_DESCRIPTION = 'IT Asset Management System';

// Build information (optional)
export const BUILD_DATE = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

// Version metadata
export const VERSION_INFO = {
  version: APP_VERSION,
  name: APP_NAME,
  fullName: APP_FULL_NAME,
  description: APP_DESCRIPTION,
  buildDate: BUILD_DATE,
  copyright: `© ${new Date().getFullYear()} ELADWYSOFT`,
};

// Helper function to get formatted version string
export function getVersionString(): string {
  return `v${APP_VERSION}`;
}

// Helper function to get full application title
export function getAppTitle(): string {
  return `${APP_FULL_NAME} ${getVersionString()}`;
}
