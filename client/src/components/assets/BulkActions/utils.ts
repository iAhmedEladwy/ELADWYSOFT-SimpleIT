import { BulkActionResult, BulkActionContext } from './types';

export function createSuccessResult(
  message: string, 
  succeeded: number, 
  failed: number = 0,
  errors: string[] = []
): BulkActionResult {
  return {
    success: true,
    message,
    details: {
      succeeded,
      failed,
      errors
    }
  };
}

export function createErrorResult(
  message: string, 
  errors: string[] = []
): BulkActionResult {
  return {
    success: false,
    message,
    details: {
      succeeded: 0,
      failed: 0,
      errors
    }
  };
}

export function validateBulkActionContext(
  context: BulkActionContext,
  actionId: string
): { valid: boolean; error?: string } {
  const { selectedAssets, availableAssets, currentUser } = context;
  
  if (!selectedAssets || selectedAssets.length === 0) {
    return { valid: false, error: 'No assets selected' };
  }
  
  if (!availableAssets || availableAssets.length === 0) {
    return { valid: false, error: 'No assets available' };
  }
  
  if (!currentUser) {
    return { valid: false, error: 'User not authenticated' };
  }
  
  // Check if all selected assets exist
  const selectedAssetData = availableAssets.filter(asset => 
    selectedAssets.includes(asset.id)
  );
  
  if (selectedAssetData.length !== selectedAssets.length) {
    return { valid: false, error: 'Some selected assets no longer exist' };
  }
  
  return { valid: true };
}

export function formatBulkActionResult(result: BulkActionResult): string {
  if (!result.success) {
    return result.message;
  }
  
  const { succeeded, failed } = result.details || { succeeded: 0, failed: 0 };
  
  if (failed === 0) {
    return `${result.message} (${succeeded} assets)`;
  } else if (succeeded > 0) {
    return `${result.message} (${succeeded} succeeded, ${failed} failed)`;
  } else {
    return `Failed: ${result.message}`;
  }
}

export function getAssetSummary(assets: any[]): {
  count: number;
  types: string[];
  statuses: string[];
  assigned: number;
  unassigned: number;
} {
  const types = [...new Set(assets.map(a => a.type))];
  const statuses = [...new Set(assets.map(a => a.status))];
  const assigned = assets.filter(a => a.assignedEmployeeId).length;
  const unassigned = assets.length - assigned;
  
  return {
    count: assets.length,
    types,
    statuses,
    assigned,
    unassigned
  };
}

export function canPerformAction(
  asset: any, 
  actionId: string
): { canPerform: boolean; reason?: string } {
  switch (actionId) {
    case 'sell':
    case 'retire':
    case 'delete':
      if (['Sold', 'Retired', 'Disposed'].includes(asset.status)) {
        return { 
          canPerform: false, 
          reason: `Asset is already ${asset.status.toLowerCase()}` 
        };
      }
      break;
      
    case 'assign':
    case 'unassign':
      if (['Sold', 'Retired', 'Disposed'].includes(asset.status)) {
        return { 
          canPerform: false, 
          reason: `Cannot assign ${asset.status.toLowerCase()} assets` 
        };
      }
      break;
      
    case 'schedule_maintenance':
      if (['Sold', 'Retired', 'Disposed'].includes(asset.status)) {
        return { 
          canPerform: false, 
          reason: `Cannot schedule maintenance for ${asset.status.toLowerCase()} assets` 
        };
      }
      break;
  }
  
  return { canPerform: true };
}

export function groupAssetsByStatus(assets: any[]): Record<string, any[]> {
  return assets.reduce((groups, asset) => {
    const status = asset.status || 'Unknown';
    if (!groups[status]) {
      groups[status] = [];
    }
    groups[status].push(asset);
    return groups;
  }, {} as Record<string, any[]>);
}

export function groupAssetsByType(assets: any[]): Record<string, any[]> {
  return assets.reduce((groups, asset) => {
    const type = asset.type || 'Unknown';
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(asset);
    return groups;
  }, {} as Record<string, any[]>);
}
