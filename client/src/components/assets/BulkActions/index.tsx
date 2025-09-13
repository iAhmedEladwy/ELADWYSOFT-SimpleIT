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

// Note: Sell and Retire dialogs are handled by the parent Assets.tsx component
// to preserve existing functionality

import { 
  MoreHorizontal, 
  Badge, 
  User, 
  UserX, 
  DollarSign, 
  Archive, 
  Trash2, 
  Wrench, 
  ArrowRightLeft,
  CheckCircle,
  XCircle
} from 'lucide-react';

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
  Badge: Badge,
  User: User,
  UserX: UserX,
  DollarSign: DollarSign,
  Archive: Archive,
  Trash2: Trash2,
  Wrench: Wrench,
  ArrowRightLeft: ArrowRightLeft,
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

    // Open appropriate dialog for other actions
    setActiveDialog(action.id);
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
  };

  const handleDialogCancel = () => {
    setActiveDialog(null);
  };

  const handleCloseResult = () => {
    setLastResult(null);
  };

  // Render action icon
  const renderActionIcon = (iconName: string) => {
    const IconComponent = actionIcons[iconName as keyof typeof actionIcons] || MoreHorizontal;
    return <IconComponent className="h-4 w-4" />;
  };

  // if (selectedAssets.length === 0) {
  //   return (
  //     <div className="text-center py-4 text-gray-500">
  //       {translations.selectAssets}
  //     </div>
  //   );
  // }

  if (availableActions.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        {translations.noActions}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Selection Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {selectedAssets.length} {language === 'English' ? 'assets selected' : 'أصول محددة'}
          </Badge>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              {translations.bulkActions}
              <MoreHorizontal className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {availableActions.map((action, index) => (
              <React.Fragment key={action.id}>
                {index > 0 && <DropdownMenuSeparator />}
                <DropdownMenuItem 
                  onClick={() => handleActionClick(action)}
                  className="flex items-center gap-2"
                >
                  {renderActionIcon(action.icon)}
                  <div>
                    <div className="font-medium">{action.label}</div>
                    <div className="text-xs text-gray-500">{action.description}</div>
                  </div>
                </DropdownMenuItem>
              </React.Fragment>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Result Display */}
      {lastResult && (
        <div className={`p-4 rounded-lg border ${
          lastResult.success 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {lastResult.success ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <XCircle className="h-5 w-5" />
              )}
              <div>
                <div className="font-medium">
                  {lastResult.success ? translations.operationCompleted : translations.operationFailed}
                </div>
                <div className="text-sm">{lastResult.message}</div>
                {lastResult.details && (
                  <div className="text-xs mt-1">
                    {lastResult.details.succeeded > 0 && (
                      <span className="text-green-600">
                        {lastResult.details.succeeded} succeeded
                      </span>
                    )}
                    {lastResult.details.succeeded > 0 && lastResult.details.failed > 0 && ' • '}
                    {lastResult.details.failed > 0 && (
                      <span className="text-red-600">
                        {lastResult.details.failed} failed
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleCloseResult}
              className="h-6 w-6 p-0"
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <BulkStatusDialog
        open={activeDialog === 'change_status'}
        onOpenChange={(open) => !open && setActiveDialog(null)}
        selectedAssets={selectedAssets}
        onSuccess={handleDialogSuccess}
        onCancel={handleDialogCancel}
      />

      <BulkAssignDialog
        open={activeDialog === 'assign'}
        onOpenChange={(open) => !open && setActiveDialog(null)}
        selectedAssets={selectedAssets}
        onSuccess={handleDialogSuccess}
        onCancel={handleDialogCancel}
      />

      <BulkDeleteDialog
        open={activeDialog === 'delete'}
        onOpenChange={(open) => !open && setActiveDialog(null)}
        selectedAssets={selectedAssets}
        onSuccess={handleDialogSuccess}
        onCancel={handleDialogCancel}
      />
{/* 
      <BulkUnassignDialog
        open={activeDialog === 'unassign'}
        onOpenChange={(open) => !open && setActiveDialog(null)}
        selectedAssets={selectedAssets}
        onSuccess={handleDialogSuccess}
        onCancel={handleDialogCancel}
      /> */}

      <BulkMaintenanceDialog
        open={activeDialog === 'schedule_maintenance'}
        onOpenChange={(open) => !open && setActiveDialog(null)}
        selectedAssets={selectedAssets}
        onSuccess={handleDialogSuccess}
        onCancel={handleDialogCancel}
      />

      {/* Sell and Retire dialogs are handled by parent Assets.tsx component */}
    </div>
  );
}
