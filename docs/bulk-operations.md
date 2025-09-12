Hybrid Solution: Combine Option 1 + 3 + 4
This combination would provide:

Unified Registry (Option 1) as the foundation
Wizard Flows (Option 3) for complex actions like Sell, Retire, Transfer
Context Awareness (Option 4) to show only relevant actions

Implementation Strategy:
Phase 1: Foundation

Set up action registry system
Define action interfaces and contracts
Create base dialog components

Phase 2: Migration

Move existing Sell and Retire to new system
Add Change Status with simple dialog
Add Delete with confirmation only

Phase 3: Enhancement

Add new actions (Assign, Transfer, Maintenance)
Implement context-aware filtering
Add validation framework

Phase 4: Advanced Features

Add bulk action history/audit trail
Implement undo capability for certain actions
Add scheduling for deferred execution

Best Practices to Follow:

Consistent UX Patterns

All dialogs follow same layout
Similar confirmation flows
Consistent error handling


Progressive Enhancement

Simple actions = simple UI
Complex actions = guided wizards
Optional advanced options


Clear Feedback

Show what will happen before execution
Progress indicators during processing
Clear success/failure summary


Robust Validation

Client-side pre-validation
Server-side verification
Helpful error messages


Audit & Compliance

Log all bulk operations
Track who did what and when
Ability to review/report on bulk actions

Schema Changes Required
Database Schema Changes: NONE Required! ✅
The good news is that your current database schema already supports everything needed:

Asset Status Changes - Already handled by assets table status field
Transactions/History - Already tracked in assetTransactions table
Bulk Operations - Can be tracked using existing activityLogs table
Maintenance - Already has assetMaintenance table
Assignments - Already tracked via assignedEmployeeId in assets

Optional Enhancement (not required):

Could add a bulk_operations table to track bulk action metadata (which assets were affected in a single bulk operation), but this can also be handled through the existing activityLogs with proper details JSON structure.

Affected Files Analysis
Core Files to Modify:
Frontend Files:

client/src/pages/Assets.tsx (Major refactor)

Remove scattered bulk action logic
Implement new action registry
Add new dialog management system
Consolidate state management for bulk operations


New Files to Create:

client/src/components/assets/BulkActions/index.tsx - Main controller
client/src/components/assets/BulkActions/ActionRegistry.ts - Action definitions
client/src/components/assets/BulkActions/dialogs/ - Folder for dialog components

BulkSellDialog.tsx (refactor existing)
BulkRetireDialog.tsx (refactor existing)
BulkStatusDialog.tsx (new)
BulkAssignDialog.tsx (new)
BulkMaintenanceDialog.tsx (new)


client/src/components/assets/BulkActions/types.ts - TypeScript interfaces
client/src/components/assets/BulkActions/utils.ts - Helper functions


Files to Update Slightly:

client/src/components/assets/AssetsTable.tsx - Update selection handling
client/src/lib/queryClient.ts - May need new API call functions
shared/types.ts - Add new type definitions for bulk operations



Backend Files:

server/routes.ts (Moderate changes)

Consolidate bulk endpoints under /api/assets/bulk/* pattern
Add new endpoints:

POST /api/assets/bulk/status
POST /api/assets/bulk/assign
POST /api/assets/bulk/maintenance
POST /api/assets/bulk/transfer


Improve existing:

POST /api/assets/bulk/sell (rename from /api/assets/sell)
POST /api/assets/bulk/retire (rename from /api/assets/retire)
POST /api/assets/bulk/delete (already exists but not used)




server/storage.ts (Minor additions)

Add batch operation methods if not exists:

batchUpdateAssetStatus()
batchAssignAssets()
batchScheduleMaintenance()





Files That Stay the Same:

Database schema files (schema.ts)
Authentication/RBAC files
Other modules (Employees, Tickets, etc.)
UI component library files
Translation/localization files (will just need new keys added)

Impact Assessment
Low Risk Changes:

Creating new files (no breaking changes)
Adding new API endpoints (backward compatible)
Adding new TypeScript types

Medium Risk Changes:

Refactoring Assets.tsx bulk action logic
Moving existing dialogs to new structure

High Risk Changes:

None! Existing functionality remains intact

Migration Strategy
Phase 1: Foundation (No Breaking Changes)

Create new file structure
Build action registry
Create new dialog components
Add new API endpoints

Phase 2: Parallel Implementation

Implement new bulk action system alongside existing
Test thoroughly
Feature flag to switch between old/new

Phase 3: Migration

Move existing Sell/Retire to new system
Remove old bulk action code
Clean up Assets.tsx

Phase 4: Enhancement

Add new bulk actions
Implement context awareness
Add advanced features

Summary
Good News:

✅ No database changes required
✅ Existing data structure supports everything
✅ Can implement incrementally without breaking current functionality
✅ Most changes are additive (new files) rather than modifications

Main Work:

Refactoring Assets.tsx bulk action handling
Creating new component structure
Adding new API endpoints
Building the action registry system