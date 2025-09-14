import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/use-language';
import { apiRequest } from '@/lib/queryClient';
import { getAvailableActions, getActionById } from './ActionRegistry';
import { BulkAction, BulkActionContext, BulkActionResult } from './types';
import { createSuccessResult, createErrorResult, validateBulkActionContext } from './utils';

// Import dialogs
import BulkStatusDialog from './dialogs/BulkStatusDialog';
import BulkAssignDialog from './dialogs/BulkAssignDialog';
import BulkDeleteDialog from './dialogs/BulkDeleteDialog';
import BulkMaintenanceDialog from './dialogs/BulkMaintenanceDialog';
import BulkUnassignDialog from './dialogs/BulkUnassignDialog';

// Import the new Check-In/Out dialogs
import CheckOutDialog from './dialogs/CheckOutDialog';
import CheckInDialog from './dialogs/CheckInDialog';

// Note: Sell and Retire dialogs are handled by the parent Assets.tsx component
// to preserve existing functionality

import { 
  MoreHorizontal, 
  Badge as BadgeIcon, 
  User, 
  UserX, 
  DollarSign, 
  Archive, 
  Trash2, 
  Wrench, 
  ArrowRightLeft,
  CheckCircle,
  XCircle,
  LogOut,
  LogIn,
  ChevronDown
} from 'lucide-react';

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface BulkActionsProps {
  selectedAssets: number[];
  availableAssets: any[];
  currentUser: any;
  onSelectionChange: (assets: number[]) => void;
  onRefresh: () => void;
  onSellRequest?: () => void;
  onRetireRequest?: () => void;
}

const actionIcons = {
  Badge: BadgeIcon,
  User: User,
  UserX: UserX,
  DollarSign: DollarSign,
  Archive: Archive,
  Trash2: Trash2,
  Wrench: Wrench,
  ArrowRightLeft: ArrowRightLeft,
  LogOut: LogOut,
  LogIn: LogIn,
};

export default function BulkActions({
  selectedAssets,
  availableAssets,
  currentUser,
  onSelectionChange,
  onRefresh,
  onSellRequest,
  onRetireRequest
}: BulkActionsProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Dialog states
  const [activeDialog, setActiveDialog] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<BulkActionResult | null>(null);
  const [showCheckOutDialog, setShowCheckOutDialog] = useState(false);
  const [showCheckInDialog, setShowCheckInDialog] = useState(false);
  const [showUnassignConfirm, setShowUnassignConfirm] = useState(false);

  // Get selected asset data
  const selectedAssetData = availableAssets.filter(asset => 
    selectedAssets.includes(asset.id)
  );

  // Filter assets by status for conditional actions
  const availableForCheckOut = selectedAssetData.filter(a => a.status === 'Available');
  const checkedOutAssets = selectedAssetData.filter(a => 
    a.status === 'In Use' && a.assignedEmployeeId
  );
  const assignedAssets = selectedAssetData.filter(a => a.assignedEmployeeId);
  const unassignedAssets = selectedAssetData.filter(a => !a.assignedEmployeeId);

  // Get available actions based on current context
  const context: BulkActionContext = {
    selectedAssets,
    availableAssets,
    currentUser,
    employees: [], // Will be populated by dialogs that need it
    assetStatuses: [], // Will be populated by dialogs that need it
  };

  const availableActions = getAvailableActions(context);

  const translations = {
    bulkActions: language === 'English' ? 'Bulk Actions' : 'إجراءات مجمعة',
    noActions: language === 'English' ? 'No actions available' : 'لا توجد إجراءات متاحة',
    selectAssets: language === 'English' ? 'Select assets to perform bulk actions' : 'اختر الأصول لتنفيذ الإجراءات المجمعة',
    success: language === 'English' ? 'Success' : 'نجح',
    error: language === 'English' ? 'Error' : 'خطأ',
    operationCompleted: language === 'English' ? 'Operation completed' : 'تم إكمال العملية',
    operationFailed: language === 'English' ? 'Operation failed' : 'فشلت العملية',
    unassignAssets: language === 'English' ? 'Unassign Assets' : 'إلغاء تخصيص الأصول',
    unassignConfirm: language === 'English' 
      ? `Are you sure you want to unassign ${selectedAssets.length} asset${selectedAssets.length > 1 ? 's' : ''}? This will remove the employee assignment from the selected assets.`
      : `هل أنت متأكد من إلغاء تخصيص ${selectedAssets.length} أصل؟ سيؤدي هذا إلى إزالة تخصيص الموظف من الأصول المحددة.`,
    cancel: language === 'English' ? 'Cancel' : 'إلغاء',
    unassign: language === 'English' ? 'Unassign' : 'إلغاء التخصيص',
    checkOut: language === 'English' ? 'Check Out' : 'تسليم',
    checkIn: language === 'English' ? 'Check In' : 'استلام',
    assign: language === 'English' ? 'Assign to Employee' : 'تعيين لموظف',
    changeStatus: language === 'English' ? 'Change Status' : 'تغيير الحالة',
    sell: language === 'English' ? 'Sell' : 'بيع',
    retire: language === 'English' ? 'Retire' : 'تقاعد',
    delete: language === 'English' ? 'Delete' : 'حذف',
    maintenance: language === 'English' ? 'Schedule Maintenance' : 'جدولة الصيانة',
    selected: language === 'English' ? 'selected' : 'محدد',
  };

  const handleActionClick = (action: BulkAction) => {
    // Validate context before proceeding
    const validation = validateBulkActionContext(context, action.id);
    if (!validation.valid) {
      toast({
        title: translations.error,
        description: validation.error,
        variant: 'destructive',
      });
      return;
    }

    // Handle sell and retire through parent component
    if (action.id === 'sell' && onSellRequest) {
      onSellRequest();
      return;
    }
    
    if (action.id === 'retire' && onRetireRequest) {
      onRetireRequest();
      return;
    }

    // Handle unassign with confirmation
    if (action.id === 'unassign') {
      setShowUnassignConfirm(true);
      return;
    }

    // Open appropriate dialog for other actions
    setActiveDialog(action.id);
  };

  const handleBulkUnassign = async () => {
    try {
      // Call the API to unassign all selected assets
      const response = await apiRequest('/api/assets/bulk/unassign', 'POST', {
        assetIds: selectedAssets
      });

      // Show success result
      const result: BulkActionResult = {
        success: true,
        message: `Successfully unassigned ${selectedAssets.length} assets`,
        details: {
          succeeded: selectedAssets.length,
          failed: 0
        }
      };
      
      handleDialogSuccess(result);
    } catch (error: any) {
      const result: BulkActionResult = {
        success: false,
        message: error.message || 'Failed to unassign assets',
        details: {
          succeeded: 0,
          failed: selectedAssets.length
        }
      };
      
      handleDialogSuccess(result);
    }
  };

  const handleDialogSuccess = (result: BulkActionResult) => {
    setLastResult(result);
    
    // Show result toast
    if (result.success) {
      toast({
        title: translations.success,
        description: result.message,
      });
    } else {
      toast({
        title: translations.error,
        description: result.message,
        variant: 'destructive',
      });
    }

    // Refresh data
    onRefresh();
    
    // Clear selection if operation was successful
    if (result.success && result.details?.failed === 0) {
      onSelectionChange([]);
    }

    // Close dialog
    setActiveDialog(null);
    setShowUnassignConfirm(false);
  };

  const handleDialogCancel = () => {
    setActiveDialog(null);
  };

  const handleCloseResult = () => {
    setLastResult(null);
  };

  // Handle successful check-in/out operations
  const handleCheckSuccess = () => {
    onSelectionChange([]);
    onRefresh();
  };

  // Render action icon
  const renderActionIcon = (iconName: string) => {
    const IconComponent = actionIcons[iconName as keyof typeof actionIcons] || MoreHorizontal;
    return <IconComponent className="h-4 w-4" />;
  };

  if (selectedAssets.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant="secondary">
        {selectedAssets.length} {translations.selected}
      </Badge>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="default" size="sm">
            {translations.bulkActions}
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          
          {/* Check-Out Action - Show only if some assets are available */}
          {availableForCheckOut.length > 0 && (
            <DropdownMenuItem onClick={() => setShowCheckOutDialog(true)}>
              <LogOut className="mr-2 h-4 w-4" />
              {translations.checkOut} ({availableForCheckOut.length})
            </DropdownMenuItem>
          )}

          {/* Check-In Action - Show only if some assets are checked out */}
          {checkedOutAssets.length > 0 && (
            <DropdownMenuItem onClick={() => setShowCheckInDialog(true)}>
              <LogIn className="mr-2 h-4 w-4" />
              {translations.checkIn} ({checkedOutAssets.length})
            </DropdownMenuItem>
          )}

          {availableForCheckOut.length > 0 || checkedOutAssets.length > 0 ? (
            <DropdownMenuSeparator />
          ) : null}

          {/* Assign Action - Show only if some assets are unassigned */}
          {unassignedAssets.length > 0 && (
            <DropdownMenuItem onClick={() => setActiveDialog('assign')}>
              <User className="mr-2 h-4 w-4" />
              {translations.assign} ({unassignedAssets.length})
            </DropdownMenuItem>
          )}

          {/* Unassign Action - Show only if some assets are assigned */}
            {assignedAssets.length > 0 && checkedOutAssets.length === 0 && (
              <DropdownMenuItem onClick={() => setShowUnassignConfirm(true)}>
              <UserX className="mr-2 h-4 w-4" />
              {translations.unassign} ({assignedAssets.length})
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {/* Change Status */}
          <DropdownMenuItem onClick={() => setActiveDialog('change_status')}>
            <BadgeIcon className="mr-2 h-4 w-4" />
            {translations.changeStatus}
          </DropdownMenuItem>

          {/* Schedule Maintenance */}
          <DropdownMenuItem onClick={() => setActiveDialog('schedule_maintenance')}>
            <Wrench className="mr-2 h-4 w-4" />
            {translations.maintenance}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Sell Action */}
          {onSellRequest && (
            <DropdownMenuItem onClick={onSellRequest}>
              <DollarSign className="mr-2 h-4 w-4" />
              {translations.sell}
            </DropdownMenuItem>
          )}

          {/* Retire Action */}
          {onRetireRequest && (
            <DropdownMenuItem onClick={onRetireRequest}>
              <Archive className="mr-2 h-4 w-4" />
              {translations.retire}
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {/* Delete Action */}
          <DropdownMenuItem 
            onClick={() => setActiveDialog('delete')}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {translations.delete}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialogs */}
      
      {/* Check-Out Dialog */}
      <CheckOutDialog
        open={showCheckOutDialog}
        onOpenChange={setShowCheckOutDialog}
        assets={selectedAssetData}
        onSuccess={handleCheckSuccess}
      />

      {/* Check-In Dialog */}
      <CheckInDialog
        open={showCheckInDialog}
        onOpenChange={setShowCheckInDialog}
        assets={selectedAssetData}
        onSuccess={handleCheckSuccess}
      />

      {/* Status Change Dialog */}
      {activeDialog === 'change_status' && (
        <BulkStatusDialog
          open={true}
          onOpenChange={(open) => !open && setActiveDialog(null)}
          selectedAssets={selectedAssets}
          onSuccess={handleDialogSuccess}
          onCancel={handleDialogCancel}
        />
      )}

      {/* Assign Dialog */}
      {activeDialog === 'assign' && (
        <BulkAssignDialog
          open={true}
          onOpenChange={(open) => !open && setActiveDialog(null)}
          selectedAssets={selectedAssets}
          onSuccess={handleDialogSuccess}
          onCancel={handleDialogCancel}
        />
      )}

      {/* Unassign Confirmation Dialog */}
      <AlertDialog open={showUnassignConfirm} onOpenChange={setShowUnassignConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{translations.unassignAssets}</AlertDialogTitle>
            <AlertDialogDescription>
              {translations.unassignConfirm}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{translations.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkUnassign}>
              {translations.unassign}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      {activeDialog === 'delete' && (
        <BulkDeleteDialog
          open={true}
          onOpenChange={(open) => !open && setActiveDialog(null)}
          selectedAssets={selectedAssets}
          onSuccess={handleDialogSuccess}
          onCancel={handleDialogCancel}
        />
      )}

      {/* Maintenance Dialog */}
      {activeDialog === 'schedule_maintenance' && (
        <BulkMaintenanceDialog
          open={true}
          onOpenChange={(open) => !open && setActiveDialog(null)}
          selectedAssets={selectedAssets}
          onSuccess={handleDialogSuccess}
          onCancel={handleDialogCancel}
        />
      )}

      {/* Result Dialog */}
      {lastResult && (
        <AlertDialog open={!!lastResult} onOpenChange={() => setLastResult(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {lastResult.success ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    {translations.operationCompleted}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                    {translations.operationFailed}
                  </div>
                )}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {lastResult.message}
                {lastResult.details && (
                  <div className="mt-2">
                    <div>Succeeded: {lastResult.details.succeeded}</div>
                    <div>Failed: {lastResult.details.failed}</div>
                    {lastResult.details.errors && lastResult.details.errors.length > 0 && (
                      <div className="mt-2">
                        <div className="font-medium">Errors:</div>
                        <ul className="list-disc list-inside">
                          {lastResult.details.errors.map((error, index) => (
                            <li key={index} className="text-sm">{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={handleCloseResult}>OK</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}