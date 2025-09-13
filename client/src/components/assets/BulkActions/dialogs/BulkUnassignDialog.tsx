import React from 'react';
import { useLanguage } from '@/hooks/use-language';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { BulkActionResult } from '../types';

interface BulkUnassignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedAssets: number[];
  onSuccess: (result: BulkActionResult) => void;
  onCancel: () => void;
}

export default function BulkUnassignDialog({
  open,
  onOpenChange,
  selectedAssets,
  onSuccess,
  onCancel,
}: BulkUnassignDialogProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = React.useState(false);

  const translations = {
    title: language === 'English' ? 'Unassign Assets' : 'إلغاء تخصيص الأصول',
    description: language === 'English' 
      ? `You are about to unassign ${selectedAssets.length} asset${selectedAssets.length > 1 ? 's' : ''}.`
      : `أنت على وشك إلغاء تخصيص ${selectedAssets.length} أصل.`,
    warningMessage: language === 'English'
      ? 'This will remove the employee assignment from all selected assets.'
      : 'سيؤدي هذا إلى إزالة تخصيص الموظف من جميع الأصول المحددة.',
    confirm: language === 'English' ? 'Confirm Unassign' : 'تأكيد إلغاء التخصيص',
    cancel: language === 'English' ? 'Cancel' : 'إلغاء',
    processing: language === 'English' ? 'Processing...' : 'جاري المعالجة...',
  };

  const handleConfirm = async () => {
    setIsProcessing(true);
    
    try {
      const response = await apiRequest('/api/assets/bulk/unassign', 'POST', {
        assetIds: selectedAssets
      });

      const result: BulkActionResult = {
        success: true,
        message: response.message || `Successfully unassigned ${selectedAssets.length} assets`,
        details: {
          total: selectedAssets.length,
          successful: response.successful || selectedAssets.length,
          failed: response.failed || 0,
          errors: response.errors
        }
      };
      
      onSuccess(result);
      onOpenChange(false);
    } catch (error: any) {
      console.error('Bulk unassign error:', error);
      
      const result: BulkActionResult = {
        success: false,
        message: error.message || 'Failed to unassign assets',
        details: {
          total: selectedAssets.length,
          successful: 0,
          failed: selectedAssets.length,
          errors: [error.message]
        }
      };
      
      onSuccess(result);
      onOpenChange(false);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{translations.title}</DialogTitle>
          <DialogDescription>{translations.description}</DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {translations.warningMessage}
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isProcessing}
          >
            {translations.cancel}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isProcessing}
            variant="destructive"
          >
            {isProcessing ? translations.processing : translations.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}