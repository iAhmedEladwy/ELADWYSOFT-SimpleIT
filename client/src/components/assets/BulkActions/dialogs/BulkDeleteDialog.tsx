import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/use-language';
import { apiRequest } from '@/lib/queryClient';
import { BulkActionDialogProps, BulkActionResult } from '../types';
import { createSuccessResult, createErrorResult, getAssetSummary } from '../utils';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export default function BulkDeleteDialog({
  open,
  onOpenChange,
  selectedAssets,
  onSuccess,
  onCancel
}: BulkActionDialogProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [confirmationText, setConfirmationText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch selected assets data for summary
  const { data: assets = [] } = useQuery({
    queryKey: ['/api/assets'],
    staleTime: 5 * 60 * 1000,
  });

  const selectedAssetData = assets.filter((asset: any) => 
    selectedAssets.includes(asset.id)
  );

  const assetSummary = getAssetSummary(selectedAssetData);
  const requiredConfirmation = `DELETE ${selectedAssets.length} ASSETS`;

  const translations = {
    title: language === 'English' ? 'Delete Assets' : 'حذف الأصول',
    warning: language === 'English' ? 'Warning' : 'تحذير',
    deleteWarning: language === 'English' 
      ? 'This action cannot be undone. All selected assets will be permanently deleted from the system.' 
      : 'لا يمكن التراجع عن هذا الإجراء. سيتم حذف جميع الأصول المحددة نهائياً من النظام.',
    confirmation: language === 'English' ? 'Confirmation' : 'تأكيد',
    typeConfirmation: language === 'English' 
      ? 'Type the following text to confirm deletion:' 
      : 'اكتب النص التالي لتأكيد الحذف:',
    summary: language === 'English' ? 'Summary' : 'ملخص',
    assets: language === 'English' ? 'assets' : 'أصول',
    types: language === 'English' ? 'Types' : 'أنواع',
    statuses: language === 'English' ? 'Statuses' : 'حالات',
    assigned: language === 'English' ? 'Assigned' : 'مُكلف',
    unassigned: language === 'English' ? 'Unassigned' : 'غير مُكلف',
    cancel: language === 'English' ? 'Cancel' : 'إلغاء',
    delete: language === 'English' ? 'Delete Assets' : 'حذف الأصول',
    processing: language === 'English' ? 'Processing...' : 'جاري المعالجة...',
    success: language === 'English' ? 'Success' : 'نجح',
    error: language === 'English' ? 'Error' : 'خطأ',
    assetsDeleted: language === 'English' ? 'Assets deleted successfully' : 'تم حذف الأصول بنجاح',
    deleteFailed: language === 'English' ? 'Failed to delete assets' : 'فشل في حذف الأصول',
    confirmationRequired: language === 'English' ? 'Please type the confirmation text' : 'يرجى كتابة نص التأكيد',
  };

  const handleDelete = async () => {
    if (confirmationText !== requiredConfirmation) {
      toast({
        title: translations.error,
        description: translations.confirmationRequired,
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    try {
      const results = await Promise.allSettled(
        selectedAssets.map(id => 
          apiRequest(`/api/assets/${id}`, 'DELETE')
        )
      );

      const succeeded = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      const errors = results
        .filter(r => r.status === 'rejected')
        .map(r => (r as PromiseRejectedResult).reason?.message || 'Unknown error');

      let result: BulkActionResult;

      if (failed === 0) {
        result = createSuccessResult(
          translations.assetsDeleted,
          succeeded,
          failed,
          errors
        );
        toast({
          title: translations.success,
          description: `Successfully deleted ${succeeded} assets`,
        });
      } else if (succeeded > 0) {
        result = createSuccessResult(
          `Partially successful: ${succeeded} deleted, ${failed} failed`,
          succeeded,
          failed,
          errors
        );
        toast({
          title: 'Partial Success',
          description: `Deleted ${succeeded} assets, ${failed} failed`,
          variant: 'destructive',
        });
      } else {
        result = createErrorResult(
          translations.deleteFailed,
          errors
        );
        toast({
          title: translations.error,
          description: translations.deleteFailed,
          variant: 'destructive',
        });
      }

      onSuccess(result);
      onOpenChange(false);
    } catch (error: any) {
      const result = createErrorResult(
        translations.deleteFailed,
        [error.message || 'Unknown error']
      );
      toast({
        title: translations.error,
        description: translations.deleteFailed,
        variant: 'destructive',
      });
      onSuccess(result);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    setConfirmationText('');
    onCancel();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            {translations.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Critical Warning */}
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {translations.deleteWarning}
            </AlertDescription>
          </Alert>

          {/* Asset Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-3">{translations.summary}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">{translations.assets}:</span>
                <div className="font-medium">{assetSummary.count}</div>
              </div>
              <div>
                <span className="text-gray-600">{translations.types}:</span>
                <div className="font-medium">{assetSummary.types.join(', ')}</div>
              </div>
              <div>
                <span className="text-gray-600">{translations.statuses}:</span>
                <div className="space-y-1">
                  {assetSummary.statuses.map(status => (
                    <Badge key={status} variant="outline" className="text-xs">
                      {status}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-gray-600">{translations.assigned}:</span>
                <div className="font-medium">
                  {assetSummary.assigned} / {assetSummary.unassigned}
                </div>
              </div>
            </div>
          </div>

          {/* Confirmation */}
          <div className="space-y-2">
            <Label htmlFor="confirmation-input">{translations.confirmation}</Label>
            <div className="space-y-2">
              <div className="text-sm text-gray-600">
                {translations.typeConfirmation}
              </div>
              <div className="font-mono text-sm bg-gray-100 p-2 rounded border">
                {requiredConfirmation}
              </div>
              <Input
                id="confirmation-input"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder={requiredConfirmation}
                className="font-mono"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={handleCancel}
              disabled={isProcessing}
            >
              {translations.cancel}
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDelete}
              disabled={confirmationText !== requiredConfirmation || isProcessing}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {isProcessing ? translations.processing : translations.delete}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
