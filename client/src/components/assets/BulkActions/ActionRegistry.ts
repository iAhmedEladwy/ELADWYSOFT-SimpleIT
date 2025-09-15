import { BulkAction } from './types';

export const BULK_ACTIONS: Record<string, BulkAction> = {
  CHANGE_STATUS: {
    id: 'change_status',
    label: 'Change Status',
    description: 'Update the status of selected assets',
    icon: 'Badge',
    requiresConfirmation: true,
    requiresDialog: true,
    minSelection: 1,
  },
    
  SELL: {
    id: 'sell',
    label: 'Sell Assets',
    description: 'Mark selected assets as sold',
    icon: 'DollarSign',
    requiresConfirmation: true,
    requiresDialog: true,
    blockedStatuses: ['Sold', 'Retired', 'Disposed'],
    minSelection: 1,
  },
  
  RETIRE: {
    id: 'retire',
    label: 'Retire Assets',
    description: 'Mark selected assets as retired',
    icon: 'Archive',
    requiresConfirmation: true,
    requiresDialog: true,
    blockedStatuses: ['Sold', 'Retired', 'Disposed'],
    minSelection: 1,
  },
  
  DELETE: {
    id: 'delete',
    label: 'Delete Assets',
    description: 'Permanently delete selected assets',
    icon: 'Trash2',
    requiresConfirmation: true,
    requiresDialog: true,
    minSelection: 1,
    maxSelection: 10, // Limit for safety
  },
  
  SCHEDULE_MAINTENANCE: {
    id: 'schedule_maintenance',
    label: 'Schedule Maintenance',
    description: 'Schedule maintenance for selected assets',
    icon: 'Wrench',
    requiresConfirmation: true,
    requiresDialog: true,
    blockedStatuses: ['Sold', 'Retired', 'Disposed'],
    minSelection: 1,
  },
  
};

// Fix for getAvailableActions function
export function getAvailableActions(context: {
  selectedAssets: number[];
  availableAssets: any[];
  currentUser: any;
}): BulkAction[] {
  const { selectedAssets, availableAssets, currentUser } = context;
  
  if (selectedAssets.length === 0) {
    return [];
  }
  
  // Get the actual asset data for selected assets
  const selectedAssetData = availableAssets.filter(asset => 
    selectedAssets.includes(asset.id)
  );
  
  const availableActions: BulkAction[] = [];
  
  Object.values(BULK_ACTIONS).forEach(action => {
    // Check minimum selection
    if (action.minSelection && selectedAssets.length < action.minSelection) {
      return;
    }
    
    // Check maximum selection
    if (action.maxSelection && selectedAssets.length > action.maxSelection) {
      return;
    }
    
    // FIXED: Check blocked statuses - ALL assets must not have blocked status
    if (action.blockedStatuses) {
      const hasBlockedStatus = selectedAssetData.some(asset => 
        action.blockedStatuses!.includes(asset.status)
      );
      if (hasBlockedStatus) {
        return; // If ANY asset has blocked status, don't show action
      }
    }
    
    // FIXED: Check allowed statuses - ALL assets must have allowed status
    if (action.allowedStatuses) {
      const allHaveAllowedStatus = selectedAssetData.every(asset => 
        action.allowedStatuses!.includes(asset.status)
      );
      if (!allHaveAllowedStatus) {
        return; // If ANY asset doesn't have allowed status, don't show action
      }
    }
        
    // Check user permissions
    if (action.requiresEmployee && (!currentUser?.accessLevel || currentUser?.accessLevel < 2)) {
      return;
    }
    
    availableActions.push(action);
  });
  
  return availableActions;
}

export function getActionById(actionId: string): BulkAction | undefined {
  return BULK_ACTIONS[actionId.toUpperCase()];
}
