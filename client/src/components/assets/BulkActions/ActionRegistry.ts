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
  
  ASSIGN: {
    id: 'assign',
    label: 'Assign to Employee',
    description: 'Assign selected assets to an employee',
    icon: 'User',
    requiresConfirmation: true,
    requiresDialog: true,
    requiresEmployee: true,
    blockedStatuses: ['Sold', 'Retired', 'Disposed'],
    minSelection: 1,
  },
  
  UNASSIGN: {
    id: 'unassign',
    label: 'Unassign',
    description: 'Remove assignment from selected assets',
    icon: 'UserX',
    requiresConfirmation: true,
    requiresDialog: false,
    blockedStatuses: ['Sold', 'Retired', 'Disposed'],
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
  
  // Check each action against context
  Object.values(BULK_ACTIONS).forEach(action => {
    // Check minimum selection
    if (action.minSelection && selectedAssets.length < action.minSelection) {
      return;
    }
    
    // Check maximum selection
    if (action.maxSelection && selectedAssets.length > action.maxSelection) {
      return;
    }
    
    // Check blocked statuses
    if (action.blockedStatuses) {
      const hasBlockedStatus = selectedAssetData.some(asset => 
        action.blockedStatuses!.includes(asset.status)
      );
      if (hasBlockedStatus) {
        return;
      }
    }
    
    // Check allowed statuses
    if (action.allowedStatuses) {
      const hasAllowedStatus = selectedAssetData.some(asset => 
        action.allowedStatuses!.includes(asset.status)
      );
      if (!hasAllowedStatus) {
        return;
      }
    }
    
    // Check user permissions
    if (action.requiresEmployee && !currentUser?.accessLevel || currentUser?.accessLevel < 2) {
      return;
    }
    
    availableActions.push(action);
  });
  
  return availableActions;
}

export function getActionById(actionId: string): BulkAction | undefined {
  return BULK_ACTIONS[actionId.toUpperCase()];
}
