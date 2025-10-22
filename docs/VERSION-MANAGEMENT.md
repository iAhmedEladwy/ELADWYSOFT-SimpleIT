# Application Version Management

## Version Configuration

**File**: `shared/version.ts`

### Current Version
```
v0.4.5
```

### How to Update Version

To update the application version across the entire system:

1. Open `shared/version.ts`
2. Update the `APP_VERSION` constant:
   ```typescript
   export const APP_VERSION = '0.4.5'; // Change this to your new version
   ```
3. Save the file
4. The version will automatically update everywhere it's displayed

### Version Display Locations

The version number is now displayed in:

#### 1. **Login Page** (`client/src/pages/Login.tsx`)
- Location: Card footer
- Format: `© 2025 ELADWYSOFT SimpleIT v0.4.5`

#### 2. **First-Time Setup Page** (`client/src/pages/FirstTimeSetup.tsx`)
- Location: Card footer
- Format: `© 2025 ELADWYSOFT SimpleIT v0.4.5 - This setup will only run on first application start`

#### 3. **Main Application Header** (`client/src/components/layout/Header.tsx`)
- Location: Next to "SimpleIT" logo
- Format: `SimpleIT v0.4.5`

#### 4. **Employee Portal Footer** (`client/src/components/portal/PortalLayout.tsx`)
- Location: Page footer (always at bottom)
- Format: `© 2025 ELADWYSOFT SimpleIT v0.4.5 - Employee Portal`

### Version Information Available

The `version.ts` file exports:

- `APP_VERSION` - Version number (e.g., "0.4.5")
- `APP_NAME` - Short name ("SimpleIT")
- `APP_FULL_NAME` - Full name ("ELADWYSOFT SimpleIT")
- `APP_DESCRIPTION` - Description ("IT Asset Management System")
- `BUILD_DATE` - Auto-generated build date
- `VERSION_INFO` - Object containing all version metadata
- `getVersionString()` - Helper function returns "v0.4.5"
- `getAppTitle()` - Helper function returns "ELADWYSOFT SimpleIT v0.4.5"

### Version Format

Follow semantic versioning: `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes, major feature releases (e.g., 1.0.0 → 2.0.0)
- **MINOR**: New features, backward compatible (e.g., 0.4.0 → 0.5.0)
- **PATCH**: Bug fixes, minor improvements (e.g., 0.4.5 → 0.4.6)

### Examples of Version Updates

```typescript
// Bug fix
export const APP_VERSION = '0.4.6';

// New feature
export const APP_VERSION = '0.5.0';

// Breaking change
export const APP_VERSION = '1.0.0';
```

### Notes

- Version is **NOT** saved in database
- Version is centrally managed in one file
- All components import from `@shared/version`
- Version updates are instant across all pages
- No need to update multiple files
