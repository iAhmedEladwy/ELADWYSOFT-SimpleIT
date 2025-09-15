export interface BulkAction {
  id: string;
  label: string;
  description: string;
  icon: string;
  requiresConfirmation: boolean;
  requiresDialog: boolean;
  allowedStatuses?: string[];
  blockedStatuses?: string[];
  minSelection?: number;
  maxSelection?: number;
  requiresEmployee?: boolean;
  requiresAsset?: boolean;
}

export interface BulkActionContext {
  selectedAssets: number[];
  availableAssets: any[];
  currentUser: any;
  employees: any[];
  assetStatuses: any[];
}

export interface BulkActionResult {
  success: boolean;
  message: string;
  details?: {
    succeeded: number;
    failed: number;
    errors?: string[];
  };
}

export interface BulkActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedAssets: number[];
  onSuccess: (result: BulkActionResult) => void;
  onCancel: () => void;
}

export interface BulkActionConfig {
  action: BulkAction;
  context: BulkActionContext;
  onExecute: (config: BulkActionConfig) => Promise<BulkActionResult>;
}

// Specific action result types
export interface BulkStatusChangeResult extends BulkActionResult {
  newStatus: string;
}

export interface BulkAssignResult extends BulkActionResult {
  employeeId: number;
  employeeName: string;
}

export interface BulkSellResult extends BulkActionResult {
  saleId: string;
  totalAmount: number;
}

export interface BulkRetireResult extends BulkActionResult {
  retirementReason: string;
}

export interface BulkMaintenanceResult extends BulkActionResult {
  maintenanceId: string;
  scheduledDate: string;
}
